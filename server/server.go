// Package server provides Web API for launchr actions.
//
//go:generate go run github.com/deepmap/oapi-codegen/v2/cmd/oapi-codegen@latest --config=cfg.yaml openapi.yaml
package server

import (
	"context"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path"
	"sort"
	"strings"
	"time"

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/go-chi/render"
	"github.com/gorilla/websocket"
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

const asyncTickerTime = 2

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

	r.HandleFunc("/ws", wsHandler(store))

	// Serve frontend files.
	r.HandleFunc("/*", spaHandler(opts))

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

func spaHandler(opts *RunOptions) http.HandlerFunc {
	if opts.ProxyClient != "" {
		target, _ := url.Parse(opts.ProxyClient)
		proxy := httputil.NewSingleHostReverseProxy(target)

		return func(w http.ResponseWriter, r *http.Request) {
			proxy.ServeHTTP(w, r)
		}
	}

	return func(w http.ResponseWriter, r *http.Request) {
		f, err := opts.ClientFS.Open(strings.TrimPrefix(path.Clean(r.URL.Path), "/"))
		if err == nil {
			defer f.Close()
		}
		if os.IsNotExist(err) {
			r.URL.Path = "/"
		}
		http.FileServer(http.FS(opts.ClientFS)).ServeHTTP(w, r)
	}
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

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Message struct {
	Message string `json:"message"`
	Action  string `json:"action"`
}

func wsHandler(l *launchrServer) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ws, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Fatal(err)
		}
		defer ws.Close()

		for {
			_, message, err := ws.ReadMessage()
			if err != nil {
				log.Println(err)
				break
			}

			var msg Message
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("Error unmarshaling message: %v", err)
				continue
			}

			log.Printf("Received command: %s", msg.Message)
			log.Printf("Received params: %v", msg.Action)

			switch msg.Message {
			case "get-processes":
				go getProcesses(msg, ws, l)
			case "get-process":
				go getStreams(msg, ws, l)
			default:
				log.Printf("Unknown command: %s", msg.Message)
			}
		}
	}
}

func getProcesses(msg Message, ws *websocket.Conn, l *launchrServer) {
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
			return runningActions[i].Status < runningActions[j].Status
		})

		responseMessage := map[string]interface{}{
			"message":   "send-processes",
			"action":    msg.Action,
			"processes": runningActions,
		}

		finalResponse, err := json.Marshal(responseMessage)
		if err != nil {
			log.Printf("Error marshaling final response: %v", err)
			return
		}

		l.wsMutex.Lock()
		if err := ws.WriteMessage(websocket.TextMessage, finalResponse); err != nil {
			log.Println(err)
		}
		l.wsMutex.Unlock()

		for _, ri := range runningActions {
			if ri.Status == "running" {
				anyProccessRunning = true
			}
		}

		completeMessage := map[string]interface{}{
			"channel":   "processes",
			"message":   "send-processes-finished",
			"action":    msg.Action,
			"processes": runningActions,
		}

		finalCompleteResponse, err := json.Marshal(completeMessage)
		if err != nil {
			log.Printf("Error marshaling final response: %v", err)
			return
		}

		if !anyProccessRunning {
			l.wsMutex.Lock()
			if err := ws.WriteMessage(websocket.TextMessage, finalCompleteResponse); err != nil {
				log.Println(err)
			}
			l.wsMutex.Unlock()
			break
		}
	}
}

func getStreams(msg Message, ws *websocket.Conn, l *launchrServer) {
	ticker := time.NewTicker(asyncTickerTime * time.Second)
	defer ticker.Stop()

	var lastStreamData interface{}

	for range ticker.C {
		ri, _ := l.actionMngr.RunInfoByID(msg.Action)

		// Get the streams data
		streams := ri.Action.GetInput().IO
		fStreams, _ := streams.(fileStreams)
		params := GetRunningActionStreamsParams{
			Offset: new(int),
			Limit:  new(int),
		}
		*params.Offset = 1
		*params.Limit = 1
		sd, _ := fStreams.GetStreamData(params)

		lastStreamData = sd

		if ri.Status != "running" {
			break
		}

		// Send the process data
		responseMessage := map[string]interface{}{
			"channel": "process",
			"message": "send-process",
			"action":  msg.Action,
			"data":    sd,
		}

		finalResponse, err := json.Marshal(responseMessage)
		if err != nil {
			log.Printf("Error marshaling response: %v", err)
			return
		}

		l.wsMutex.Lock()
		if err := ws.WriteMessage(websocket.TextMessage, finalResponse); err != nil {
			log.Println(err)
		}
		l.wsMutex.Unlock()
	}

	// Send the final message indicating streams have finished with the last stream data
	finalMessage := map[string]interface{}{
		"channel": "process",
		"message": "send-process-finished",
		"action":  msg.Action,
		"data":    lastStreamData,
	}

	finalResponse, err := json.Marshal(finalMessage)
	if err != nil {
		log.Printf("Error marshaling final message: %v", err)
		return
	}

	l.wsMutex.Lock()
	if err := ws.WriteMessage(websocket.TextMessage, finalResponse); err != nil {
		log.Println(err)
	}
	l.wsMutex.Unlock()
}
