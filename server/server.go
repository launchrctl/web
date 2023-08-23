//go:generate go run github.com/deepmap/oapi-codegen/cmd/oapi-codegen --config=cfg.yaml openapi.yaml
package server

import (
	"encoding/json"
	"fmt"
	"net/http"

	middleware "github.com/deepmap/oapi-codegen/pkg/chi-middleware"
	"github.com/getkin/kin-openapi/openapi3"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/go-chi/render"

	"github.com/launchrctl/launchr"
	"github.com/launchrctl/launchr/pkg/action"
)

// RunOptions is a set of options for running openapi http server.
type RunOptions struct {
	// Addr optionally specifies the TCP address in form "host:port" for the server to listen on.
	// If empty, :80 is used.
	Addr string
	// ApiPrefix specifies subpath where Api is served.
	ApiPrefix string
	// SwaggerJson enables serving of swagger.json for swagger ui.
	SwaggerJson bool
}

func Run(app launchr.App, opts RunOptions) error {
	// Get swagger information for schema validation and swagger ui.
	swagger, err := GetSwagger()
	if err != nil {
		panic(fmt.Errorf("Error loading swagger spec\n: %w", err))
	}
	// Default servers for swagger ui.
	swagger.Servers = openapi3.Servers{
		&openapi3.Server{
			URL: opts.ApiPrefix,
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
	store := &launchrServer{}
	app.GetService(&store.actionMngr)

	// Enable swagger ui on the subpath.
	// @todo check if dir exists and skip with warning.
	// @todo maybe use generate functionality to embed files into the binary.
	swfs := http.FileServer(http.Dir("./swagger-ui"))
	r.Route("/swagger-ui", func(r chi.Router) {
		r.Handle("/*", http.StripPrefix("/swagger-ui", swfs))
	})
	if opts.SwaggerJson {
		r.Get("/swagger.json", func(w http.ResponseWriter, r *http.Request) {
			render.Status(r, http.StatusOK)
			render.JSON(w, r, &swagger)
		})
	}

	// Serve frontend files.
	clientFS := http.FileServer(http.Dir("./client/dist"))
	r.Handle("/*", clientFS)

	// Use the validation middleware to check all requests against the OpenAPI schema on Api subroutes.
	r.Route(opts.ApiPrefix, func(r chi.Router) {
		r.Use(
			middleware.OapiRequestValidator(swagger),
		)
	})

	// Register router in openapi and start the server.
	HandlerFromMuxWithBaseURL(store, r, opts.ApiPrefix)
	s := &http.Server{
		Handler: r,
		Addr:    opts.Addr,
	}

	return s.ListenAndServe()
}

type launchrServer struct {
	actionMngr action.Manager
}

func (l *launchrServer) GetActions(w http.ResponseWriter, r *http.Request) {
	actions := l.actionMngr.All()
	var result = make([]Action, 0, len(actions))
	for _, a := range actions {
		result = append(result, apiActionFromLaunchrCommand(a))
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func (l *launchrServer) GetActionByID(w http.ResponseWriter, r *http.Request, id string) {
	actions := l.actionMngr.All()
	a, ok := actions[id]
	if !ok {
		sendError(w, http.StatusNotFound, fmt.Sprintf("action with id %q is not found", id))
		return
	}
	result := apiActionFromLaunchrCommand(a)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func apiActionFromLaunchrCommand(a *action.Command) Action {
	jsonschema := a.Action().JsonSchema()
	return Action{Id: a.CommandName, Jsonschema: &jsonschema}
}

func sendError(w http.ResponseWriter, code int, message string) {
	petErr := Error{
		Code:    int32(code),
		Message: message,
	}
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(petErr)
}
