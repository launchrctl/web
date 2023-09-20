// Package server provides Web API for launchr actions.
//
//go:generate go run github.com/deepmap/oapi-codegen/cmd/oapi-codegen --config=cfg.yaml openapi.yaml
package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	middleware "github.com/deepmap/oapi-codegen/pkg/chi-middleware"
	"github.com/getkin/kin-openapi/openapi3"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/go-chi/render"

	"github.com/launchrctl/launchr"
	"github.com/launchrctl/launchr/pkg/action"
	"github.com/launchrctl/launchr/pkg/cli"
)

// RunOptions is a set of options for running openapi http server.
type RunOptions struct {
	// Addr optionally specifies the TCP address in form "host:port" for the server to listen on.
	// If empty, :80 is used.
	Addr string
	// APIPrefix specifies subpath where Api is served.
	APIPrefix string
	// SwaggerJSON enables serving of swagger.json for swagger ui.
	SwaggerJSON bool
}

// Run starts http server.
func Run(ctx context.Context, app launchr.App, opts RunOptions) error {
	// @todo consider locks on endpoints
	// Get swagger information for schema validation and swagger ui.
	swagger, err := GetSwagger()
	if err != nil {
		panic(fmt.Errorf("Error loading swagger spec\n: %w", err))
	}
	// Default servers for swagger ui.
	swagger.Servers = openapi3.Servers{
		&openapi3.Server{
			URL: opts.APIPrefix,
		},
	}
	// Prepare router and openapi.
	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"}, // @todo be more specific
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))
	store := &launchrServer{
		ctx: ctx,
	}
	app.GetService(&store.actionMngr)
	app.GetService(&store.cfg)

	// Enable swagger ui on the subpath.
	// @todo check if dir exists and skip with warning.
	// @todo maybe use generate functionality to embed files into the binary.
	swfs := http.FileServer(http.Dir("./swagger-ui"))
	r.Route("/swagger-ui", func(r chi.Router) {
		r.Handle("/*", http.StripPrefix("/swagger-ui", swfs))
	})
	if opts.SwaggerJSON {
		r.Get("/swagger.json", func(w http.ResponseWriter, r *http.Request) {
			render.Status(r, http.StatusOK)
			render.JSON(w, r, &swagger)
		})
	}

	// Serve frontend files.
	clientFS := http.FileServer(http.Dir("./client/dist"))
	r.Handle("/*", clientFS)

	// Use the validation middleware to check all requests against the OpenAPI schema on Api subroutes.
	r.Route(opts.APIPrefix, func(r chi.Router) {
		r.Use(
			middleware.OapiRequestValidator(swagger),
		)
	})

	// Register router in openapi and start the server.
	HandlerFromMuxWithBaseURL(store, r, opts.APIPrefix)
	s := &http.Server{
		Handler:           r,
		Addr:              opts.Addr,
		ReadHeaderTimeout: time.Second * 30, // @todo make it configurable
	}

	return s.ListenAndServe()
}

type launchrServer struct {
	actionMngr action.Manager
	cfg        launchr.Config
	ctx        context.Context
}

func (l *launchrServer) GetOneRunningActionByID(w http.ResponseWriter, r *http.Request, id string, runID string) {
	//TODO implement me
	panic("implement me")
}

func (l *launchrServer) GetActions(w http.ResponseWriter, _ *http.Request) {
	actions := l.actionMngr.AllRef()
	var result = make([]ActionBasicInfo, 0, len(actions))
	for _, a := range actions {
		result = append(result, apiActionBasic(a))
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
	_ = json.NewEncoder(w).Encode(apiAction(a))
}

func (l *launchrServer) GetRunningActionsByID(w http.ResponseWriter, _ *http.Request, id string) {
	runningActions := l.actionMngr.RunInfoByAction(id)
	var result = make([]ActionRunInfo, 0, len(runningActions))
	for _, ri := range runningActions {
		result = append(result, ActionRunInfo{
			ID: ri.ID,
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
	err = a.SetInput(action.Input{
		Args: params.Arguments,
		Opts: params.Options,
		IO:   cli.StandardStreams(), // @todo IO should possibly go to a file.
	})
	if err != nil {
		// @todo validate must have info about which fields failed.
		sendError(w, http.StatusBadRequest, "invalid actions input")
		return
	}

	ri, chErr := l.actionMngr.RunBackground(l.ctx, a)
	go func() {
		// @todo handle error somehow. We cant notify client, but must save the status
		<-chErr
	}()

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(ActionRunInfo{
		ID: ri.ID,
	})
}

func apiAction(a *action.Action) Action {
	jsonschema := a.JSONSchema()
	return Action{Id: a.ID, JsonSchema: &jsonschema}
}

func apiActionBasic(a *action.Action) ActionBasicInfo {
	return ActionBasicInfo{Id: a.ID}
}

func sendError(w http.ResponseWriter, code int, message string) {
	petErr := Error{
		Code:    int32(code),
		Message: message,
	}
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(petErr)
}
