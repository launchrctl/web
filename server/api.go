package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/knadh/koanf"
	yamlparser "github.com/knadh/koanf/parsers/yaml"
	"github.com/knadh/koanf/providers/file"
	"github.com/knadh/koanf/providers/rawbytes"
	"gopkg.in/yaml.v3"

	"github.com/launchrctl/launchr"
	"github.com/launchrctl/launchr/pkg/action"
)

// customizationPlatformNameKey used to set the layout-flow root name
const customizationPlatformNameKey = "plasmactl_web_ui_platform_name"

type launchrServer struct {
	action.WithLogger
	action.WithTerm

	actionMngr   action.Manager
	stateMngr    *StateManager
	cfg          launchr.Config
	ctx          context.Context
	baseURL      string
	apiPrefix    string
	wsMutex      sync.Mutex
	customize    FrontendCustomize
	uiSchemaBase []byte
	logsDirPath  string
	app          launchr.App
}

// FrontendCustomize stores variables to customize web appearance.
type FrontendCustomize struct {
	VarsFile        string
	Variables       []string
	ExcludedActions map[string]bool
}

func parseVarsFile(path string) (map[string]interface{}, error) {
	var data map[string]interface{}
	var rawData []byte

	rawData, err := os.ReadFile(filepath.Clean(path))
	if err != nil {
		return data, err
	}

	err = yaml.Unmarshal(rawData, &data)
	if err != nil {
		return data, err
	}

	return data, nil
}

func (l *launchrServer) GetCustomisationConfig(w http.ResponseWriter, _ *http.Request) {
	customisation := make(CustomisationConfig)
	currentDir, err := os.Getwd()
	if err == nil {
		customisation[customizationPlatformNameKey] = filepath.Base(currentDir)
	}

	if l.customize.VarsFile != "" {
		vars := make(map[string]bool)
		for _, item := range l.customize.Variables {
			vars[item] = true
		}

		gvFile, err := parseVarsFile(l.customize.VarsFile)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "error getting group vars file")
			return
		}

		if len(l.customize.Variables) > 0 {
			for key, value := range gvFile {
				if _, ok := vars[key]; ok {
					customisation[key] = value
				}
			}
		}
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(customisation)
}

func (l *launchrServer) GetOneRunningActionByID(w http.ResponseWriter, _ *http.Request, id ActionId, runID ActionRunInfoId) {
	ri, ok := l.actionMngr.RunInfoByID(runID)
	if !ok {
		sendError(w, http.StatusNotFound, fmt.Sprintf("action run info with id %q is not found", id))
		return
	}
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(ActionRunInfo{
		ID:     ri.ID,
		Status: ActionRunStatus(ri.Status),
	})
}

func (l *launchrServer) CancelRunningAction(w http.ResponseWriter, _ *http.Request, id ActionId, runID ActionRunInfoId) {
	ri, ok := l.actionMngr.RunInfoByID(runID)
	if !ok {
		sendError(w, http.StatusNotFound, fmt.Sprintf("action run info with id %q is not found", id))
		return
	}

	if ri.Status != "running" {
		sendError(w, http.StatusNotFound, fmt.Sprintf("action %q is not running", id))
		return
	}

	as, ok := l.stateMngr.actionStateByID(runID)
	if !ok {
		sendError(w, http.StatusNotFound, fmt.Sprintf("action state info with id %q is not found", id))
		return
	}

	// Cancel context
	as.cancelSwitch()

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(struct{}{})
}

func (l *launchrServer) GetRunningActionStreams(w http.ResponseWriter, _ *http.Request, id ActionId, runID ActionRunInfoId, params GetRunningActionStreamsParams) {
	ri, ok := l.actionMngr.RunInfoByID(runID)
	if !ok {
		sendError(w, http.StatusNotFound, fmt.Sprintf("action run info with id %q is not found", id))
		return
	}
	streams := ri.Action.Input().Streams()
	fStreams, ok := streams.(fileStreams)
	if !ok {
		panic("not supported")
	}
	sd, err := fStreams.GetStreamData(params)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Error reading streams")
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(sd)
}

func (l *launchrServer) basePath() string {
	return l.baseURL + l.apiPrefix
}

func (l *launchrServer) GetActions(w http.ResponseWriter, _ *http.Request) {
	actions := l.actionMngr.All()
	var result = make([]ActionShort, 0, len(actions))
	for _, a := range actions {
		// skip excluded actions
		if _, ok := l.customize.ExcludedActions[a.ID]; ok {
			continue
		}

		ab, err := l.apiActionShort(a)
		if err != nil {
			continue
		}
		result = append(result, ab)
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].ID < result[j].ID
	})

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(result)
}

func (l *launchrServer) GetActionByID(w http.ResponseWriter, _ *http.Request, id string) {
	// @todo return executing actions for a show page.
	a, ok := l.actionMngr.Get(id)
	if !ok {
		sendError(w, http.StatusNotFound, fmt.Sprintf("action with id %q is not found", id))
		return
	}

	afull, err := l.apiActionFull(a)
	if err != nil {
		sendError(w, http.StatusInternalServerError, fmt.Sprintf("error on building actionFull %q", id))
		return
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(afull)
}

func (l *launchrServer) GetActionJSONSchema(w http.ResponseWriter, _ *http.Request, id string) {
	a, ok := l.actionMngr.Get(id)
	if !ok {
		sendError(w, http.StatusNotFound, fmt.Sprintf("action with id %q is not found", id))
		return
	}

	afull, err := l.apiActionFull(a)
	if err != nil {
		sendError(w, http.StatusInternalServerError, fmt.Sprintf("error on building actionFull %q", id))
		return
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(afull.JSONSchema)
}

func (l *launchrServer) GetRunningActionsByID(w http.ResponseWriter, _ *http.Request, id string) {
	runningActions := l.actionMngr.RunInfoByAction(id)

	sort.Slice(runningActions, func(i, j int) bool {
		return runningActions[i].ID < runningActions[j].ID
	})

	var result = make([]ActionRunInfo, 0, len(runningActions))
	for _, ri := range runningActions {
		result = append(result, ActionRunInfo{
			ID:     ri.ID,
			Status: ActionRunStatus(ri.Status),
		})
	}
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(result)
}

func (l *launchrServer) GetWizards(w http.ResponseWriter, _ *http.Request) {
	var result []WizardShort

	runDir, fileErr := os.Getwd()
	if fileErr != nil {
		http.Error(w, fileErr.Error(), http.StatusInternalServerError)
		return
	}

	// TODO: make file search optimisations.
	err := filepath.Walk(runDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() && info.Name() == "ui-wizard.yaml" {
			content, err := os.ReadFile(filepath.Clean(path))
			if err != nil {
				return err
			}

			var data struct {
				UIWizard WizardShort `yaml:"uiWizard"`
			}
			err = yaml.Unmarshal(content, &data)
			if err != nil {
				return err
			}

			relativePath, err := filepath.Rel(runDir, path)
			if err != nil {
				return err
			}
			relativePath = strings.TrimSuffix(relativePath, "/ui-wizard.yaml")
			relativePath = strings.ReplaceAll(relativePath, string(filepath.Separator), ".")

			result = append(result, WizardShort{
				Description: data.UIWizard.Description,
				ID:          relativePath,
				Title:       data.UIWizard.Title,
				Success:     data.UIWizard.Success,
			})
		}
		return nil
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(result)
}

func (l *launchrServer) GetWizardByID(w http.ResponseWriter, _ *http.Request, id WizardId) {
	runDir, err := os.Getwd()
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Error getting working directory")
		return
	}

	targetPath := filepath.Join(runDir, strings.ReplaceAll(string(id), ".", string(filepath.Separator)), "ui-wizard.yaml")
	content, err := os.ReadFile(filepath.Clean(targetPath))
	if err != nil {
		if os.IsNotExist(err) {
			sendError(w, http.StatusNotFound, fmt.Sprintf("Wizard with ID %q not found", id))
		} else {
			sendError(w, http.StatusInternalServerError, "Error reading wizard file")
		}
		return
	}

	type wizardStep struct {
		Actions     []string `yaml:"actions"`
		Description string   `yaml:"description"`
		Title       string   `yaml:"title"`
	}

	type wizardShortWithSteps struct {
		Description string       `yaml:"description"`
		Success     string       `yaml:"success"`
		Title       string       `yaml:"title"`
		Steps       []wizardStep `yaml:"steps"`
	}

	var data struct {
		UIWizard wizardShortWithSteps `yaml:"uiWizard"`
	}

	if err := yaml.Unmarshal(content, &data); err != nil {
		sendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var steps []WizardStep

	for _, step := range data.UIWizard.Steps {
		var actions []ActionFull
		for _, actionID := range step.Actions {
			a, ok := l.actionMngr.Get(actionID)
			if !ok {
				sendError(w, http.StatusInternalServerError, fmt.Sprintf("Step action with ID %q not found", actionID))
				return
			}

			if err := a.EnsureLoaded(); err != nil {
				sendError(w, http.StatusInternalServerError, fmt.Sprintf("Error loading step action %q", actionID))
				return
			}

			afull, err := l.apiActionFull(a)
			if err != nil {
				sendError(w, http.StatusInternalServerError, fmt.Sprintf("Error building ActionFull for %q", actionID))
				return
			}
			actions = append(actions, afull)
		}

		stepActions := actions
		stepTitle := step.Title
		stepDescription := step.Description

		steps = append(steps, WizardStep{
			Title:       &stepTitle,
			Description: &stepDescription,
			Actions:     &stepActions,
		})
	}

	wizard := WizardFull{
		Description: data.UIWizard.Description,
		ID:          string(id),
		Steps:       steps,
		Title:       data.UIWizard.Title,
		Success:     data.UIWizard.Success,
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(wizard)
}

func (l *launchrServer) RunAction(w http.ResponseWriter, r *http.Request, id string) {
	// @todo error if action is already running. We need some pool of running processes with its io.
	var err error
	a, ok := l.actionMngr.Get(id)
	_, excluded := l.customize.ExcludedActions[a.ID]
	if !ok || excluded {
		sendError(w, http.StatusNotFound, fmt.Sprintf("action with id %q is not found", id))
		return
	}

	// Parse JSON Schema input.
	var params ActionRunParams
	if err = json.NewDecoder(r.Body).Decode(&params); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid format for ActionRunParams")
		return
	}

	// Generate custom runID.
	runID := strconv.FormatInt(time.Now().Unix(), 10) + "___" + a.ID

	defer func() {
		//if err != nil {
		//	streams.Close()
		//}
	}()

	persistentFlags := l.actionMngr.GetPersistentFlags()
	params = convertUserInput(a, persistentFlags.GetDefinitions(), params)

	// early peak for `quiet` flag.
	// @todo would be great to move this check into core, but it will require recreating streams on manager.decorate.
	quiet := isQuietModeEnabled(params.Persistent)

	// Prepare action for run.
	// Can we fetch directly json?
	streams, err := createFileStreams(l.logsDirPath, runID, l.app, quiet)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Error preparing streams")
	}

	input := action.NewInput(a, params.Arguments, params.Options, streams)

	// set runtime flags if any.
	if rt, ok := a.Runtime().(action.RuntimeFlags); ok {
		group := rt.GetFlags().GetName()
		for k, v := range params.Runtime {
			input.SetFlagInGroup(group, k, v)
		}
	}
	// set persistent flags
	for k, v := range persistentFlags.GetAll() {
		if _, ok := params.Persistent[k]; ok {
			input.SetFlagInGroup(persistentFlags.GetName(), k, params.Persistent[k])
		} else {
			input.SetFlagInGroup(persistentFlags.GetName(), k, v)
		}
	}

	err = l.actionMngr.ValidateInput(a, input)
	if err != nil {
		// @todo validate must have info about which fields failed.
		// @todo change to json
		l.Log().Warn("Failed to validate input", "error", err)
		sendError(w, http.StatusBadRequest, "The input provided is invalid. Please check your form values and try again.")

		return
	}

	err = a.SetInput(input)
	if err != nil {
		l.Log().Error("Failed to set input", "error", err)
		sendError(w, http.StatusBadRequest, fmt.Sprintf("Failed to set input: %q", err))
		return
	}

	l.actionMngr.Decorate(a)
	state := l.stateMngr.registerState(runID)
	ri, chErr := l.actionMngr.RunBackground(state.context, a, runID)

	go func() {
		err := <-chErr
		if err != nil {
			l.Log().Error("Action execution failed", "runID", runID, "error", err)
			// save error to error file
			if _, writeErr := streams.Err().Write([]byte(err.Error())); writeErr != nil {
				l.Log().Error("Failed to write error to stream", "error", writeErr)
			}

			l.stateMngr.removeActionState(runID)
		}
	}()

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(ActionRunInfo{
		ID:     ri.ID,
		Status: ActionRunStatus(ri.Status),
	})
}

func (l *launchrServer) apiActionFull(a *action.Action) (ActionFull, error) {
	short, err := l.apiActionShort(a)
	if err != nil {
		return ActionFull{}, err
	}
	actionSchema := a.JSONSchema()
	actionSchema.ID = fmt.Sprintf("%s/actions/%s/schema.json", l.basePath(), url.QueryEscape(a.ID))

	// As we don't have a full JSON schema from action. Need to populate it with runtime and persistent flags.
	if rt, ok := a.Runtime().(action.RuntimeFlags); ok {
		runtimeFlagsSchema := rt.GetFlags().JSONSchema()
		actionSchema.Properties["runtime"] = runtimeFlagsSchema.Properties["runtime"]
	}

	// Add persistent flags into the action schema.
	persistentFlagsSchema := l.actionMngr.GetPersistentFlags().JSONSchema()
	actionSchema.Properties["persistent"] = persistentFlagsSchema.Properties["persistent"]

	uiSchema := koanf.New(".")

	// Load default schema
	if err = uiSchema.Load(rawbytes.Provider(l.uiSchemaBase), yamlparser.Parser()); err != nil {
		if !os.IsNotExist(err) {
			return ActionFull{}, err
		}
		l.Log().Debug("ui-schema.default.yaml is not present")
	}

	// Merge custom schema with higher priority
	if err = uiSchema.Load(file.Provider(filepath.Join(a.Dir(), "ui-schema.yaml")), yamlparser.Parser()); err != nil {
		if !os.IsNotExist(err) {
			return ActionFull{}, err
		}
		l.Log().Debug("ui-schema.yaml not found, using default ui-schema", "action_id", a.ID)
	}

	return ActionFull{
		ID:          a.ID,
		Title:       short.Title,
		Description: short.Description,
		JSONSchema:  actionSchema,
		UISchema:    uiSchema.Raw(),
	}, nil
}

func (l *launchrServer) apiActionShort(a *action.Action) (ActionShort, error) {
	def := a.ActionDef()
	return ActionShort{
		ID:          a.ID,
		Title:       def.Title,
		Description: def.Description,
	}, nil
}

func sendError(w http.ResponseWriter, code int, message string) {
	petErr := Error{
		Code:    code,
		Message: message,
	}
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(petErr)
}

// Use front-end changed property to filter out default arguments and options.
func convertUserInput(a *action.Action, persistentFlagsDef action.ParametersList, params ActionRunParams) ActionRunParams {
	changedArgs := make(map[string]bool)
	changedOpts := make(map[string]bool)
	changedRuntime := make(map[string]bool)
	changedPersistent := make(map[string]bool)
	args := make(action.InputParams)
	opts := make(action.InputParams)
	runtime := make(action.InputParams)
	persistent := make(action.InputParams)

	categoryMaps := map[string]map[string]bool{
		"arguments":  changedArgs,
		"options":    changedOpts,
		"runtime":    changedRuntime,
		"persistent": changedPersistent,
	}

	for _, p := range *params.Changed {
		split := strings.Split(p, "____")
		if len(split) < 3 {
			continue
		}

		category := split[1]
		name := split[2]

		if targetMap, exists := categoryMaps[category]; exists {
			targetMap[name] = true
		}
	}

	// Store changed arguments
	for _, arg := range a.ActionDef().Arguments {
		if changedArgs[arg.Name] {
			args[arg.Name] = params.Arguments[arg.Name]
		}
	}

	// Store changed options
	for _, opt := range a.ActionDef().Options {
		if changedOpts[opt.Name] {
			opts[opt.Name] = params.Options[opt.Name]
		}
	}

	// Store changed runtime flags
	if rt, ok := a.Runtime().(action.RuntimeFlags); ok {
		flags := rt.GetFlags().GetDefinitions()
		for _, flag := range flags {
			if changedRuntime[flag.Name] {
				runtime[flag.Name] = params.Runtime[flag.Name]
			}
		}
	}

	// Store changed persistent flags
	for _, flag := range persistentFlagsDef {
		if changedPersistent[flag.Name] {
			persistent[flag.Name] = params.Persistent[flag.Name]
		}
	}

	params.Arguments = args
	params.Options = opts
	params.Runtime = runtime
	params.Persistent = persistent

	return params
}
