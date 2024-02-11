// Package server provides Web API for launchr actions.
//
//go:generate go run github.com/deepmap/oapi-codegen/v2/cmd/oapi-codegen@latest --config=cfg.yaml openapi.yaml
package server

import (
	"context"
	"fmt"
	"io/fs"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/go-chi/render"
	middleware "github.com/oapi-codegen/nethttp-middleware"

	"github.com/launchrctl/launchr"
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
	SwaggerUIFS fs.FS
	// Client server.
	ClientFS    fs.FS
	ProxyClient string
}

const swaggerUIPath = "/swagger-ui"
const swaggerJSONPath = "/swagger.json"

// Run starts http server.
func Run(ctx context.Context, app launchr.App, opts *RunOptions) error {
	// @todo consider locks on endpoints
	// Get swagger information for schema validation and swagger ui.
	swagger, err := GetSwagger()
	if err != nil {
		panic(fmt.Errorf("Error loading swagger spec\n: %w", err))
	}
	swagger.Servers = nil
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
		ctx:       ctx,
		apiPrefix: opts.APIPrefix,
	}
	app.GetService(&store.actionMngr)
	app.GetService(&store.cfg)

	// Provide Swagger UI.
	if opts.SwaggerJSON {
		serveSwaggerUI(swagger, r, opts)
	}

	// Serve frontend files.
	if opts.ProxyClient != "" {
		target, _ := url.Parse(opts.ProxyClient)
		proxy := httputil.NewSingleHostReverseProxy(target)

		r.HandleFunc("/*", func(w http.ResponseWriter, r *http.Request) {
			proxy.ServeHTTP(w, r)
		})
	} else {
		r.Handle("/*", http.FileServer(http.FS(opts.ClientFS)))
	}

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

	// @todo remove all stopped containers when stopped
	// @todo add special prefix for web run containers.
	baseURL := "http://localhost:" + strings.Split(s.Addr, ":")[1]
	store.baseURL = baseURL
	fmt.Println("Starting server on " + baseURL)
	if opts.SwaggerJSON {
		fmt.Println("Swagger UI: " + baseURL + opts.APIPrefix + swaggerUIPath)
		fmt.Println("swagger.json: " + baseURL + opts.APIPrefix + swaggerJSONPath)
	}
	return s.ListenAndServe()
}

func serveSwaggerUI(swagger *openapi3.T, r chi.Router, opts *RunOptions) {
	pathUI := opts.APIPrefix + swaggerUIPath
	r.Route(pathUI, func(r chi.Router) {
		r.Handle("/*", http.StripPrefix(pathUI, http.FileServer(http.FS(opts.SwaggerUIFS))))
	})
	r.Get(pathUI, func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, pathUI+"/", http.StatusMovedPermanently)
	})
	// Default servers for swagger ui.
	swagger.Servers = openapi3.Servers{
		&openapi3.Server{
			URL: opts.APIPrefix,
		},
	}
	r.Get(opts.APIPrefix+swaggerJSONPath, func(w http.ResponseWriter, r *http.Request) {
		render.Status(r, http.StatusOK)
		render.JSON(w, r, &swagger)
	})
}
