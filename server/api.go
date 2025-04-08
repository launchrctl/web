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

	"gopkg.in/yaml.v3"

	"github.com/launchrctl/launchr"
	"github.com/launchrctl/launchr/pkg/action"
)

type launchrServer struct {
	actionMngr  action.Manager
	cfg         launchr.Config
	ctx         context.Context
	baseURL     string
	apiPrefix   string
	wsMutex     sync.Mutex
	customize   FrontendCustomize
	logsDirPath string
	app         launchr.App
}

// FrontendCustomize stores variables to customize web appearance.
type FrontendCustomize struct {
	VarsFile  string   `yaml:"vars_file"`
	Variables []string `yaml:"variables"`
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
		ab, err := apiActionShort(a)
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

	afull, err := apiActionFull(l.basePath(), a)
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

	afull, err := apiActionFull(l.basePath(), a)
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

			afull, err := apiActionFull(l.basePath(), a)
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
	if !ok {
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
	runID := strconv.FormatInt(time.Now().Unix(), 10) + "-" + a.ID

	// Prepare action for run.
	// Can we fetch directly json?
	streams, err := createFileStreams(l.logsDirPath, runID, l.app)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Error preparing streams")
	}

	defer func() {
		//if err != nil {
		//	streams.Close()
		//}
	}()

	params = convertUserInput(a, params)
	input := action.NewInput(a, params.Arguments, params.Options, streams)

	err = a.SetInput(input)
	if err != nil {
		// @todo validate must have info about which fields failed.
		launchr.Log().Error("invalid actions input", "error", err)
		sendError(w, http.StatusBadRequest, fmt.Sprintf("invalid actions input: %q", err))
		return
	}

	ri, chErr := l.actionMngr.RunBackground(l.ctx, a, runID)

	go func() {
		err := <-chErr
		if err != nil {
			launchr.Log().Error("Action execution failed", "runID", runID, "error", err)
			// save error to error file)
			if _, writeErr := streams.Err().Write([]byte(err.Error())); writeErr != nil {
				launchr.Log().Error("Failed to write error to stream", "error", writeErr)
			}
		}
	}()

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(ActionRunInfo{
		ID:     ri.ID,
		Status: ActionRunStatus(ri.Status),
	})
}

func apiActionFull(baseURL string, a *action.Action) (ActionFull, error) {
	short, err := apiActionShort(a)
	if err != nil {
		return ActionFull{}, err
	}
	jsonschema := a.JSONSchema()
	jsonschema.ID = fmt.Sprintf("%s/actions/%s/schema.json", baseURL, url.QueryEscape(a.ID))

	var uiSchema map[string]interface{}

	yamlData, err := os.ReadFile(filepath.Join(a.Dir(), "ui-schema.yaml"))
	if err != nil {
		if !os.IsNotExist(err) {
			return ActionFull{}, err
		}
		launchr.Log().Debug("ui-schema.yaml not found, using empty ui-schema", "action_id", a.ID)
		uiSchema = map[string]interface{}{}
	} else {
		err = yaml.Unmarshal(yamlData, &uiSchema)
		if err != nil {
			return ActionFull{}, err
		}
	}

	return ActionFull{
		ID:          a.ID,
		Title:       short.Title,
		Description: short.Description,
		JSONSchema:  jsonschema,
		UISchema:    uiSchema,
	}, nil
}

func apiActionShort(a *action.Action) (ActionShort, error) {
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
func convertUserInput(a *action.Action, params ActionRunParams) ActionRunParams {
	changedArgs := make(map[string]bool)
	changedOpts := make(map[string]bool)
	args := make(action.InputParams)
	opts := make(action.InputParams)

	for _, p := range *params.Changed {
		split := strings.Split(p, "____")
		if split[1] == "arguments" {
			changedArgs[split[2]] = true
		} else if split[1] == "options" {
			changedOpts[split[2]] = true
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

	params.Arguments = args
	params.Options = opts

	return params
}
