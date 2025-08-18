// Package server provides Web API for launchr actions.
//
//go:generate go run github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@latest --config=cfg.yaml openapi.yaml
package server

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"path"
	"sort"
	"strings"
	"syscall"
	"time"

	"github.com/launchrctl/keyring"

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/go-chi/render"
	"github.com/gorilla/websocket"
	middleware "github.com/oapi-codegen/nethttp-middleware"

	"github.com/launchrctl/launchr"
	"github.com/launchrctl/launchr/pkg/action"
)

// RunOptions is a set of options for running openapi http server.
type RunOptions struct {
	action.WithLogger
	action.WithTerm

	// Addr optionally specifies the TCP address in form "host:port" for the server to listen on.
	// If empty, :80 is used.
	Addr string
	// APIPrefix specifies subpath where Api is served.
	APIPrefix string
	NoUI      bool
	// SwaggerUIFS enables serving of swagger.json for swagger ui if set.
	SwaggerUIFS fs.FS
	// Client server.
	ClientFS        fs.FS
	ProxyClient     string
	Customize       WebCustomize
	DefaultUISchema []byte
	LogsDirPath     string
}

// BaseURL returns base url for run options.
func (o RunOptions) BaseURL() string {
	return "http://localhost:" + strings.Split(o.Addr, ":")[1]
}

const (
	asyncTickerTime = 2

	swaggerUIPath   = "/swagger-ui"
	swaggerJSONPath = "/swagger.json"

	statusRunning string = "running"
)

// Run starts http server.
func Run(ctx context.Context, app launchr.App, opts *RunOptions) error {
	// @todo consider locks on endpoints
	// Get swagger information for schema validation and swagger ui.
	swagger, err := GetSwagger()
	if err != nil {
		panic(fmt.Errorf("Error loading swagger spec\n: %w", err))
	}
	swagger.Servers = nil

	err = os.MkdirAll(opts.LogsDirPath, 0750)
	if err != nil {
		return fmt.Errorf("can't create logs dir: %w", err)
	}

	store := &launchrServer{
		ctx:          ctx,
		baseURL:      opts.BaseURL(),
		apiPrefix:    opts.APIPrefix,
		customize:    opts.Customize,
		logsDirPath:  opts.LogsDirPath,
		uiSchemaBase: opts.DefaultUISchema,
		app:          app,
		stateMngr:    NewStateManager(),
	}
	store.SetLogger(opts.Log())
	store.SetTerm(opts.Term())
	app.GetService(&store.actionMngr)
	app.GetService(&store.cfg)

	var k keyring.Keyring
	app.GetService(&k)
	store.tokenStore, err = NewTokenStore(k)
	if err != nil {
		return fmt.Errorf("can't create token store: %w", err)
	}

	ctx, cancel := context.WithCancel(ctx)

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

	// Apply authMiddleware to all routes.
	r.Use(store.authMiddleware)
	// Mode-specific setup
	if opts.NoUI {
		setupAPIOnlyMode(r, store, opts, swagger)
	} else {
		setupFullUIMode(r, store, opts, cancel, swagger)
	}

	// Provide Swagger UI.
	if opts.SwaggerUIFS != nil {
		store.Term().Info().Println("Serving Swagger UI")
		serveSwaggerUI(swagger, r, opts)
	}

	s := &http.Server{
		Handler:           r,
		Addr:              opts.Addr,
		ReadHeaderTimeout: time.Second * 30, // @todo make it configurable
	}

	// @todo remove all stopped containers when stopped
	// @todo add special prefix for web run containers.
	store.baseURL = opts.BaseURL()
	store.Term().Info().Printfln("Web Server running at: %s", store.baseURL)

	if opts.SwaggerUIFS != nil {
		store.Term().Info().Printfln("Swagger UI: %s%s", store.basePath(), swaggerUIPath)
	}

	return handleServerLifecycle(ctx, cancel, s, store)
}

func setupAPIOnlyMode(r chi.Router, store *launchrServer, opts *RunOptions, swagger *openapi3.T) {
	// API routes with validation
	r.Route(opts.APIPrefix, func(r chi.Router) {
		r.Use(middleware.OapiRequestValidator(swagger))
	})

	// Register API handlers
	HandlerFromMuxWithBaseURL(store, r, opts.APIPrefix)
}

func setupFullUIMode(r chi.Router, store *launchrServer, opts *RunOptions, cancel context.CancelFunc, swagger *openapi3.T) {
	// Frontend file serving
	r.HandleFunc("/*", spaHandler(opts))

	// WebSocket endpoint
	r.HandleFunc("/ws", wsHandler(store))

	// API routes with validation
	r.Route(opts.APIPrefix, func(r chi.Router) {
		r.Use(middleware.OapiRequestValidator(swagger))
	})

	// Shutdown endpoint for UI
	r.Post("/api/shutdown", func(w http.ResponseWriter, _ *http.Request) {
		cancel() // This needs to be passed in somehow
		_, _ = w.Write([]byte("Server is shutting down..."))
	})

	// Register API handlers
	HandlerFromMuxWithBaseURL(store, r, opts.APIPrefix)
}

func handleServerLifecycle(ctx context.Context, cancel context.CancelFunc, s *http.Server, store *launchrServer) error {
	signals := make(chan os.Signal, 1)
	signal.Notify(signals, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-signals
		store.Log().Debug("shutting down on signal", "signal", sig)
		cancel()
	}()

	var errShutdown error
	go func() {
		<-ctx.Done()
		store.Term().Info().Println("Shutting down...")
		ctxShut, cancelShut := context.WithTimeout(context.Background(), time.Second*10)
		defer cancelShut()
		errShutdown = s.Shutdown(ctxShut)
		if errShutdown != nil {
			errShutdown = s.Close()
		}
	}()

	if err := s.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	if errShutdown != nil {
		store.Log().Error("error on shutting down", "error", errShutdown)
		return errShutdown
	}

	return nil
}

func spaHandler(opts *RunOptions) http.HandlerFunc {
	if opts.ProxyClient != "" {
		opts.Log().Debug("serving assets from proxy", "proxy", opts.ProxyClient)
		target, _ := url.Parse(opts.ProxyClient)
		proxy := httputil.NewSingleHostReverseProxy(target)

		return func(w http.ResponseWriter, r *http.Request) {
			proxy.ServeHTTP(w, r)
		}
	}
	realpath := launchr.FsRealpath(opts.ClientFS)
	if realpath == "" {
		realpath = "[embed]"
	}
	opts.Log().Debug("serving assets from path", "path", realpath)
	fileServer := http.FileServer(http.FS(opts.ClientFS))
	return func(w http.ResponseWriter, r *http.Request) {
		// @todo prevent directory listing in case of missing index.html
		f, err := opts.ClientFS.Open(strings.TrimPrefix(path.Clean(r.URL.Path), "/"))
		if err == nil {
			defer f.Close()
		}
		if os.IsNotExist(err) {
			r.URL.Path = "/"
		}
		fileServer.ServeHTTP(w, r)
	}
}

func serveSwaggerUI(swagger *openapi3.T, r chi.Router, opts *RunOptions) {
	pathUI := opts.APIPrefix + swaggerUIPath
	r.Route(pathUI, func(r chi.Router) {
		// @todo prevent directory listing in case of missing index.html
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

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(_ *http.Request) bool {
		return true
	},
}

type messageType struct {
	Message string `json:"message"`
	Action  string `json:"action"`
}

func wsHandler(l *launchrServer) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ws, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			l.Log().Error("failed to upgrade to websocket", "error", err)
			return
		}
		defer ws.Close()

		var message []byte
		for {
			_, message, err = ws.ReadMessage()
			if err != nil {
				l.Log().Error("failed to read ws message", "error", err)
				return
			}

			var msg messageType
			if err = json.Unmarshal(message, &msg); err != nil {
				l.Log().Error("error unmarshalling ws command", "error", err)
				continue
			}

			l.Log().Debug("received ws command", "command", msg.Message, "params", msg.Action)

			switch msg.Message {
			case "get-processes":
				go getProcesses(msg, ws, l)
			case "get-process":
				go getStreams(msg, ws, l)
			default:
				l.Log().Info("unknown command", "command", msg.Message)
			}
		}
	}
}

func getProcesses(msg messageType, ws *websocket.Conn, l *launchrServer) {
	ticker := time.NewTicker(asyncTickerTime * time.Second)
	defer ticker.Stop()

	// TODO: replace that code with some listener which
	// will send messages when action started or finished instead of ticker

	for range ticker.C {

		anyProccessRunning := false

		runningActions := l.actionMngr.RunInfoByAction(msg.Action)

		if len(runningActions) == 0 {
			break
		}

		sort.Slice(runningActions, func(i, j int) bool {
			return runningActions[i].ID < runningActions[j].ID
		})

		msgAllProcesses := map[string]interface{}{
			"channel":   "processes",
			"message":   "send-processes",
			"action":    msg.Action,
			"processes": runningActions,
		}

		resp, err := json.Marshal(msgAllProcesses)
		if err != nil {
			l.Log().Error("error on marshaling the response", "error", err)
			return
		}

		l.wsMutex.Lock()
		if writeErr := ws.WriteMessage(websocket.TextMessage, resp); writeErr != nil {
			l.Log().Error("error on writing ws all processes", "error", writeErr)
		}
		l.wsMutex.Unlock()

		for _, ri := range runningActions {
			if ri.Status == statusRunning {
				anyProccessRunning = true
			}
		}

		msgFinished := map[string]interface{}{
			"channel":   "processes",
			"message":   "send-processes-finished",
			"action":    msg.Action,
			"processes": runningActions,
		}

		resp, err = json.Marshal(msgFinished)
		if err != nil {
			l.Log().Error("error on marshaling the finished processes response", "error", err)
			return
		}

		if !anyProccessRunning {
			l.wsMutex.Lock()
			if err = ws.WriteMessage(websocket.TextMessage, resp); err != nil {
				l.Log().Error("error on writing ws finished processes", "error", err)
			}
			l.wsMutex.Unlock()
			break
		}
	}
}

func getStreams(msg messageType, ws *websocket.Conn, l *launchrServer) {
	ticker := time.NewTicker(asyncTickerTime * time.Second)
	defer ticker.Stop()

	var lastStreamData interface{}

	for range ticker.C {
		ri, _ := l.actionMngr.RunInfoByID(msg.Action)

		// Get the streams data
		streams := ri.Action.Input().Streams()
		fStreams, _ := streams.(fileStreams)
		params := GetRunningActionStreamsParams{
			Offset: new(int),
			Limit:  new(int),
		}
		*params.Offset = 1
		*params.Limit = 1
		sd, _ := fStreams.GetStreamData(params)

		lastStreamData = sd

		if ri.Status != statusRunning {
			break
		}

		// Send the process data
		msgAllProcesses := map[string]interface{}{
			"channel": "process",
			"message": "send-process",
			"action":  msg.Action,
			"data":    sd,
			"status":  ri.Status,
		}

		resp, err := json.Marshal(msgAllProcesses)
		if err != nil {
			l.Log().Error("error on marshaling the response", "error", err)
			return
		}

		l.wsMutex.Lock()
		if err = ws.WriteMessage(websocket.TextMessage, resp); err != nil {
			l.Log().Error("error on writing ws all streams", "error", err)
		}
		l.wsMutex.Unlock()
	}

	ri, _ := l.actionMngr.RunInfoByID(msg.Action)
	// Send the final message indicating streams have finished with the last stream data
	msgFinished := map[string]interface{}{
		"channel": "process",
		"message": "send-process-finished",
		"action":  msg.Action,
		"data":    lastStreamData,
		"status":  ri.Status,
	}

	finalResponse, err := json.Marshal(msgFinished)
	if err != nil {
		l.Log().Error("error on marshaling the finished streams response", "error", err)
		return
	}

	l.wsMutex.Lock()
	if err = ws.WriteMessage(websocket.TextMessage, finalResponse); err != nil {
		l.Log().Error("error on writing ws finished streams", "error", err)
	}
	l.wsMutex.Unlock()
}
