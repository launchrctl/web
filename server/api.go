package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"github.com/launchrctl/launchr"
	"github.com/launchrctl/launchr/pkg/action"
	"github.com/launchrctl/launchr/pkg/cli"
)

type launchrServer struct {
	actionMngr action.Manager
	cfg        launchr.Config
	ctx        context.Context
	baseURL    string
	apiPrefix  string
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
		Status: ri.Status,
	})
}

func (l *launchrServer) GetRunningActionStreams(w http.ResponseWriter, _ *http.Request, id ActionId, runID ActionRunInfoId, _ GetRunningActionStreamsParams) {
	_, ok := l.actionMngr.RunInfoByID(runID)
	if !ok {
		sendError(w, http.StatusNotFound, fmt.Sprintf("action run info with id %q is not found", id))
		return
	}
	panic("not implemented")
	//_ = ri.Action.GetRunEnvironment().Logs(r.Context(), "", "")
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

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(apiActionFull(l.basePath(), a))
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
	afull := apiActionFull(l.basePath(), a)
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(afull.JSONSchema)
}

func (l *launchrServer) GetRunningActionsByID(w http.ResponseWriter, _ *http.Request, id string) {
	runningActions := l.actionMngr.RunInfoByAction(id)
	var result = make([]ActionRunInfo, 0, len(runningActions))
	for _, ri := range runningActions {
		result = append(result, ActionRunInfo{
			ID:     ri.ID,
			Status: ri.Status,
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

	// Prepare action for run.
	// Can we fetch directly json?
	streams := cli.StandardStreams() // @todo IO should possibly go to a file.
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

	ri, chErr := l.actionMngr.RunBackground(l.ctx, a)
	go func() {
		// @todo handle error somehow. We cant notify client, but must save the status
		//defer streams.Close()
		<-chErr
	}()

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(ActionRunInfo{
		ID:     ri.ID,
		Status: ri.Status,
	})
}

func apiActionFull(baseURL string, a *action.Action) ActionFull {
	jsonschema := a.JSONSchema()
	jsonschema.ID = fmt.Sprintf("%s/actions/%s/schema.json", baseURL, url.QueryEscape(a.ID))
	def := a.ActionDef()
	return ActionFull{
		ID:          a.ID,
		Title:       def.Title,
		Description: def.Description,
		JSONSchema:  jsonschema,
	}
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
