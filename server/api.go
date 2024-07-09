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
	"sync"
	"time"

	"github.com/launchrctl/launchr/pkg/log"

	"github.com/launchrctl/launchr"
	"github.com/launchrctl/launchr/pkg/action"
	"gopkg.in/yaml.v3"
)

type launchrServer struct {
	actionMngr action.Manager
	cfg        launchr.Config
	ctx        context.Context
	baseURL    string
	apiPrefix  string
	wsMutex    sync.Mutex
}

type launchrWebConfig struct {
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
	var launchrConfig *launchrWebConfig
	err := l.cfg.Get("web", &launchrConfig)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "error getting config")
		return
	}

	customisation := make(CustomisationConfig)
	if launchrConfig == nil {
		log.Debug("Launchr config doesn't exist")
	} else {
		if launchrConfig.VarsFile != "" {
			vars := make(map[string]bool)
			for _, item := range launchrConfig.Variables {
				vars[item] = true
			}

			gvFile, err := parseVarsFile(launchrConfig.VarsFile)
			if err != nil {
				sendError(w, http.StatusInternalServerError, "error getting group vars file")
				return
			}

			if len(launchrConfig.Variables) > 0 {
				for key, value := range gvFile {
					if _, ok := vars[key]; ok {
						customisation[key] = value
					}
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
	streams := ri.Action.GetInput().IO
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
	actions := l.actionMngr.AllRef()
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
	a, ok := l.actionMngr.GetRef(id)
	if !ok {
		sendError(w, http.StatusNotFound, fmt.Sprintf("action with id %q is not found", id))
		return
	}
	if err := a.EnsureLoaded(); err != nil {
		sendError(w, http.StatusInternalServerError, fmt.Sprintf("error on loading action %q", id))
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
	if err := a.EnsureLoaded(); err != nil {
		sendError(w, http.StatusInternalServerError, fmt.Sprintf("error on loading action %q", id))
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
	streams, err := createFileStreams(runID)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Error preparing streams")
	}

	defer func() {
		//if err != nil {
		//	streams.Close()
		//}
	}()
	err = a.SetInput(action.Input{
		Args: params.Arguments,
		Opts: params.Options,
		IO:   streams,
	})
	if err != nil {
		// @todo validate must have info about which fields failed.
		sendError(w, http.StatusBadRequest, "invalid actions input")
		return
	}

	ri, chErr := l.actionMngr.RunBackground(l.ctx, a, runID)

	go func() {
		// @todo handle error somehow. We cant notify client, but must save the status
		//defer streams.Close()
		<-chErr
	}()

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(ActionRunInfo{
		ID:     ri.ID,
		Status: ActionRunStatus(ri.Status),
	})
}

func apiActionFull(baseURL string, a *action.Action) (ActionFull, error) {
	jsonschema := a.JSONSchema()
	jsonschema.ID = fmt.Sprintf("%s/actions/%s/schema.json", baseURL, url.QueryEscape(a.ID))
	def := a.ActionDef()

	var uiSchema map[string]interface{}

	filePath, err := findUISchemaFile(a.Dir())
	if err != nil {
		fmt.Println("Info: ui-schema.yaml not found, using empty UISchema")
		uiSchema = map[string]interface{}{}
	} else {
		yamlData, err := os.ReadFile(filePath)
		if err != nil {
			fmt.Printf("Error reading ui-schema.yaml: %v\n", err)
		}
		err = yaml.Unmarshal(yamlData, &uiSchema)
		if err != nil {
			fmt.Printf("Error unmarshalling ui-schema.yaml: %v\n", err)
		}
	}

	return ActionFull{
		ID:          a.ID,
		Title:       def.Title,
		Description: def.Description,
		JSONSchema:  jsonschema,
		UISchema:    uiSchema,
	}, nil
}

func apiActionShort(a *action.Action) (ActionShort, error) {
	err := a.EnsureLoaded()
	def := a.ActionDef()
	return ActionShort{
		ID:          a.ID,
		Title:       def.Title,
		Description: def.Description,
	}, err
}

func sendError(w http.ResponseWriter, code int, message string) {
	petErr := Error{
		Code:    int32(code),
		Message: message,
	}
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(petErr)
}

// Find UI schema file in parent directories.
func findUISchemaFile(startDir string) (string, error) {
	dir := startDir
	for {
		filePath := filepath.Join(dir, "ui-schema.yaml")
		if _, err := os.Stat(filePath); err == nil {
			return filePath, nil
		} else if os.IsNotExist(err) {
			parentDir := filepath.Dir(dir)
			if parentDir == dir {
				return "", fmt.Errorf("ui-schema.yaml not found")
			}
			dir = parentDir
		} else {
			return "", err
		}
	}
}