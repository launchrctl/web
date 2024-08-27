// Package server provides primitives to interact with the openapi HTTP API.
//
// Code generated by github.com/deepmap/oapi-codegen/v2 version v2.1.0 DO NOT EDIT.
package server

import (
	"bytes"
	"compress/gzip"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/url"
	"path"
	"strings"

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/go-chi/chi/v5"
	"github.com/launchrctl/launchr/pkg/action"
	"github.com/launchrctl/launchr/pkg/jsonschema"
	"github.com/oapi-codegen/runtime"
)

// Defines values for ActionRunStatus.
const (
	ActionRunStatusCreated  ActionRunStatus = "created"
	ActionRunStatusError    ActionRunStatus = "error"
	ActionRunStatusFinished ActionRunStatus = "finished"
	ActionRunStatusRunning  ActionRunStatus = "running"
)

// Defines values for ActionRunStreamDataType.
const (
	StdErr ActionRunStreamDataType = "stdErr"
	StdIn  ActionRunStreamDataType = "stdIn"
	StdOut ActionRunStreamDataType = "stdOut"
)

// ActionFull defines model for ActionFull.
type ActionFull struct {
	Description string                 `json:"description"`
	ID          string                 `json:"id"`
	JSONSchema  jsonschema.Schema      `json:"jsonschema"`
	Title       string                 `json:"title"`
	UISchema    map[string]interface{} `json:"uischema,omitempty"`
}

// ActionRunInfo defines model for ActionRunInfo.
type ActionRunInfo struct {
	ID     string          `json:"id"`
	Status ActionRunStatus `json:"status"`
}

// ActionRunParams defines model for ActionRunParams.
type ActionRunParams struct {
	Arguments action.TypeArgs `json:"arguments"`
	Options   action.TypeOpts `json:"options"`
}

// ActionRunStatus defines model for ActionRunStatus.
type ActionRunStatus string

// ActionRunStreamData defines model for ActionRunStreamData.
type ActionRunStreamData struct {
	Content string                  `json:"content"`
	Count   int                     `json:"count"`
	Offset  int                     `json:"offset"`
	Type    ActionRunStreamDataType `json:"type"`
}

// ActionRunStreamDataType defines model for ActionRunStreamData.Type.
type ActionRunStreamDataType string

// ActionShort defines model for ActionShort.
type ActionShort struct {
	Description string `json:"description"`
	ID          string `json:"id"`
	Title       string `json:"title"`
}

// CustomisationConfig defines model for Customisation.
type CustomisationConfig = map[string]interface{}

// Error defines model for Error.
type Error struct {
	Code    int32  `json:"code"`
	Message string `json:"message"`
}

// JSONSchema defines model for JSONSchema.
type JSONSchema = map[string]interface{}

// ActionId defines model for ActionId.
type ActionId = string

// ActionRunInfoId defines model for ActionRunInfoId.
type ActionRunInfoId = string

// Limit defines model for Limit.
type Limit = int

// Offset defines model for Offset.
type Offset = int

// DefaultError defines model for DefaultError.
type DefaultError = Error

// GetRunningActionStreamsParams defines parameters for GetRunningActionStreams.
type GetRunningActionStreamsParams struct {
	// Offset number of elements to skip
	Offset *Offset `form:"offset,omitempty" json:"offset,omitempty"`

	// Limit number of elements to return
	Limit *Limit `form:"limit,omitempty" json:"limit,omitempty"`
}

// RunActionJSONRequestBody defines body for RunAction for application/json ContentType.
type RunActionJSONRequestBody = ActionRunParams

// ServerInterface represents all server handlers.
type ServerInterface interface {
	// Lists all actions
	// (GET /actions)
	GetActions(w http.ResponseWriter, r *http.Request)
	// Returns action by id
	// (GET /actions/{id})
	GetActionByID(w http.ResponseWriter, r *http.Request, id ActionId)
	// runs action
	// (POST /actions/{id})
	RunAction(w http.ResponseWriter, r *http.Request, id ActionId)
	// Returns running actions
	// (GET /actions/{id}/running)
	GetRunningActionsByID(w http.ResponseWriter, r *http.Request, id ActionId)
	// Returns action run info
	// (GET /actions/{id}/running/{runId})
	GetOneRunningActionByID(w http.ResponseWriter, r *http.Request, id ActionId, runId ActionRunInfoId)
	// Returns running action streams
	// (GET /actions/{id}/running/{runId}/streams)
	GetRunningActionStreams(w http.ResponseWriter, r *http.Request, id ActionId, runId ActionRunInfoId, params GetRunningActionStreamsParams)
	// Returns action json schema
	// (GET /actions/{id}/schema.json)
	GetActionJSONSchema(w http.ResponseWriter, r *http.Request, id ActionId)
	// Customisation config
	// (GET /customisation)
	GetCustomisationConfig(w http.ResponseWriter, r *http.Request)
}

// Unimplemented server implementation that returns http.StatusNotImplemented for each endpoint.

type Unimplemented struct{}

// Lists all actions
// (GET /actions)
func (_ Unimplemented) GetActions(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}

// Returns action by id
// (GET /actions/{id})
func (_ Unimplemented) GetActionByID(w http.ResponseWriter, r *http.Request, id ActionId) {
	w.WriteHeader(http.StatusNotImplemented)
}

// runs action
// (POST /actions/{id})
func (_ Unimplemented) RunAction(w http.ResponseWriter, r *http.Request, id ActionId) {
	w.WriteHeader(http.StatusNotImplemented)
}

// Returns running actions
// (GET /actions/{id}/running)
func (_ Unimplemented) GetRunningActionsByID(w http.ResponseWriter, r *http.Request, id ActionId) {
	w.WriteHeader(http.StatusNotImplemented)
}

// Returns action run info
// (GET /actions/{id}/running/{runId})
func (_ Unimplemented) GetOneRunningActionByID(w http.ResponseWriter, r *http.Request, id ActionId, runId ActionRunInfoId) {
	w.WriteHeader(http.StatusNotImplemented)
}

// Returns running action streams
// (GET /actions/{id}/running/{runId}/streams)
func (_ Unimplemented) GetRunningActionStreams(w http.ResponseWriter, r *http.Request, id ActionId, runId ActionRunInfoId, params GetRunningActionStreamsParams) {
	w.WriteHeader(http.StatusNotImplemented)
}

// Returns action json schema
// (GET /actions/{id}/schema.json)
func (_ Unimplemented) GetActionJSONSchema(w http.ResponseWriter, r *http.Request, id ActionId) {
	w.WriteHeader(http.StatusNotImplemented)
}

// Customisation config
// (GET /customisation)
func (_ Unimplemented) GetCustomisationConfig(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}

// ServerInterfaceWrapper converts contexts to parameters.
type ServerInterfaceWrapper struct {
	Handler            ServerInterface
	HandlerMiddlewares []MiddlewareFunc
	ErrorHandlerFunc   func(w http.ResponseWriter, r *http.Request, err error)
}

type MiddlewareFunc func(http.Handler) http.Handler

// GetActions operation middleware
func (siw *ServerInterfaceWrapper) GetActions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.GetActions(w, r)
	}))

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		handler = siw.HandlerMiddlewares[i](handler)
	}

	handler.ServeHTTP(w, r.WithContext(ctx))
}

// GetActionByID operation middleware
func (siw *ServerInterfaceWrapper) GetActionByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var err error

	// ------------- Path parameter "id" -------------
	var id ActionId

	err = runtime.BindStyledParameterWithOptions("simple", "id", chi.URLParam(r, "id"), &id, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationPath, Explode: false, Required: true})
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "id", Err: err})
		return
	}

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.GetActionByID(w, r, id)
	}))

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		handler = siw.HandlerMiddlewares[i](handler)
	}

	handler.ServeHTTP(w, r.WithContext(ctx))
}

// RunAction operation middleware
func (siw *ServerInterfaceWrapper) RunAction(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var err error

	// ------------- Path parameter "id" -------------
	var id ActionId

	err = runtime.BindStyledParameterWithOptions("simple", "id", chi.URLParam(r, "id"), &id, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationPath, Explode: false, Required: true})
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "id", Err: err})
		return
	}

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.RunAction(w, r, id)
	}))

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		handler = siw.HandlerMiddlewares[i](handler)
	}

	handler.ServeHTTP(w, r.WithContext(ctx))
}

// GetRunningActionsByID operation middleware
func (siw *ServerInterfaceWrapper) GetRunningActionsByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var err error

	// ------------- Path parameter "id" -------------
	var id ActionId

	err = runtime.BindStyledParameterWithOptions("simple", "id", chi.URLParam(r, "id"), &id, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationPath, Explode: false, Required: true})
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "id", Err: err})
		return
	}

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.GetRunningActionsByID(w, r, id)
	}))

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		handler = siw.HandlerMiddlewares[i](handler)
	}

	handler.ServeHTTP(w, r.WithContext(ctx))
}

// GetOneRunningActionByID operation middleware
func (siw *ServerInterfaceWrapper) GetOneRunningActionByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var err error

	// ------------- Path parameter "id" -------------
	var id ActionId

	err = runtime.BindStyledParameterWithOptions("simple", "id", chi.URLParam(r, "id"), &id, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationPath, Explode: false, Required: true})
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "id", Err: err})
		return
	}

	// ------------- Path parameter "runId" -------------
	var runId ActionRunInfoId

	err = runtime.BindStyledParameterWithOptions("simple", "runId", chi.URLParam(r, "runId"), &runId, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationPath, Explode: false, Required: true})
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "runId", Err: err})
		return
	}

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.GetOneRunningActionByID(w, r, id, runId)
	}))

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		handler = siw.HandlerMiddlewares[i](handler)
	}

	handler.ServeHTTP(w, r.WithContext(ctx))
}

// GetRunningActionStreams operation middleware
func (siw *ServerInterfaceWrapper) GetRunningActionStreams(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var err error

	// ------------- Path parameter "id" -------------
	var id ActionId

	err = runtime.BindStyledParameterWithOptions("simple", "id", chi.URLParam(r, "id"), &id, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationPath, Explode: false, Required: true})
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "id", Err: err})
		return
	}

	// ------------- Path parameter "runId" -------------
	var runId ActionRunInfoId

	err = runtime.BindStyledParameterWithOptions("simple", "runId", chi.URLParam(r, "runId"), &runId, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationPath, Explode: false, Required: true})
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "runId", Err: err})
		return
	}

	// Parameter object where we will unmarshal all parameters from the context
	var params GetRunningActionStreamsParams

	// ------------- Optional query parameter "offset" -------------

	err = runtime.BindQueryParameter("form", true, false, "offset", r.URL.Query(), &params.Offset)
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "offset", Err: err})
		return
	}

	// ------------- Optional query parameter "limit" -------------

	err = runtime.BindQueryParameter("form", true, false, "limit", r.URL.Query(), &params.Limit)
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "limit", Err: err})
		return
	}

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.GetRunningActionStreams(w, r, id, runId, params)
	}))

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		handler = siw.HandlerMiddlewares[i](handler)
	}

	handler.ServeHTTP(w, r.WithContext(ctx))
}

// GetActionJSONSchema operation middleware
func (siw *ServerInterfaceWrapper) GetActionJSONSchema(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var err error

	// ------------- Path parameter "id" -------------
	var id ActionId

	err = runtime.BindStyledParameterWithOptions("simple", "id", chi.URLParam(r, "id"), &id, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationPath, Explode: false, Required: true})
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "id", Err: err})
		return
	}

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.GetActionJSONSchema(w, r, id)
	}))

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		handler = siw.HandlerMiddlewares[i](handler)
	}

	handler.ServeHTTP(w, r.WithContext(ctx))
}

// GetCustomisationConfig operation middleware
func (siw *ServerInterfaceWrapper) GetCustomisationConfig(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.GetCustomisationConfig(w, r)
	}))

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		handler = siw.HandlerMiddlewares[i](handler)
	}

	handler.ServeHTTP(w, r.WithContext(ctx))
}

type UnescapedCookieParamError struct {
	ParamName string
	Err       error
}

func (e *UnescapedCookieParamError) Error() string {
	return fmt.Sprintf("error unescaping cookie parameter '%s'", e.ParamName)
}

func (e *UnescapedCookieParamError) Unwrap() error {
	return e.Err
}

type UnmarshalingParamError struct {
	ParamName string
	Err       error
}

func (e *UnmarshalingParamError) Error() string {
	return fmt.Sprintf("Error unmarshaling parameter %s as JSON: %s", e.ParamName, e.Err.Error())
}

func (e *UnmarshalingParamError) Unwrap() error {
	return e.Err
}

type RequiredParamError struct {
	ParamName string
}

func (e *RequiredParamError) Error() string {
	return fmt.Sprintf("Query argument %s is required, but not found", e.ParamName)
}

type RequiredHeaderError struct {
	ParamName string
	Err       error
}

func (e *RequiredHeaderError) Error() string {
	return fmt.Sprintf("Header parameter %s is required, but not found", e.ParamName)
}

func (e *RequiredHeaderError) Unwrap() error {
	return e.Err
}

type InvalidParamFormatError struct {
	ParamName string
	Err       error
}

func (e *InvalidParamFormatError) Error() string {
	return fmt.Sprintf("Invalid format for parameter %s: %s", e.ParamName, e.Err.Error())
}

func (e *InvalidParamFormatError) Unwrap() error {
	return e.Err
}

type TooManyValuesForParamError struct {
	ParamName string
	Count     int
}

func (e *TooManyValuesForParamError) Error() string {
	return fmt.Sprintf("Expected one value for %s, got %d", e.ParamName, e.Count)
}

// Handler creates http.Handler with routing matching OpenAPI spec.
func Handler(si ServerInterface) http.Handler {
	return HandlerWithOptions(si, ChiServerOptions{})
}

type ChiServerOptions struct {
	BaseURL          string
	BaseRouter       chi.Router
	Middlewares      []MiddlewareFunc
	ErrorHandlerFunc func(w http.ResponseWriter, r *http.Request, err error)
}

// HandlerFromMux creates http.Handler with routing matching OpenAPI spec based on the provided mux.
func HandlerFromMux(si ServerInterface, r chi.Router) http.Handler {
	return HandlerWithOptions(si, ChiServerOptions{
		BaseRouter: r,
	})
}

func HandlerFromMuxWithBaseURL(si ServerInterface, r chi.Router, baseURL string) http.Handler {
	return HandlerWithOptions(si, ChiServerOptions{
		BaseURL:    baseURL,
		BaseRouter: r,
	})
}

// HandlerWithOptions creates http.Handler with additional options
func HandlerWithOptions(si ServerInterface, options ChiServerOptions) http.Handler {
	r := options.BaseRouter

	if r == nil {
		r = chi.NewRouter()
	}
	if options.ErrorHandlerFunc == nil {
		options.ErrorHandlerFunc = func(w http.ResponseWriter, r *http.Request, err error) {
			http.Error(w, err.Error(), http.StatusBadRequest)
		}
	}
	wrapper := ServerInterfaceWrapper{
		Handler:            si,
		HandlerMiddlewares: options.Middlewares,
		ErrorHandlerFunc:   options.ErrorHandlerFunc,
	}

	r.Group(func(r chi.Router) {
		r.Get(options.BaseURL+"/actions", wrapper.GetActions)
	})
	r.Group(func(r chi.Router) {
		r.Get(options.BaseURL+"/actions/{id}", wrapper.GetActionByID)
	})
	r.Group(func(r chi.Router) {
		r.Post(options.BaseURL+"/actions/{id}", wrapper.RunAction)
	})
	r.Group(func(r chi.Router) {
		r.Get(options.BaseURL+"/actions/{id}/running", wrapper.GetRunningActionsByID)
	})
	r.Group(func(r chi.Router) {
		r.Get(options.BaseURL+"/actions/{id}/running/{runId}", wrapper.GetOneRunningActionByID)
	})
	r.Group(func(r chi.Router) {
		r.Get(options.BaseURL+"/actions/{id}/running/{runId}/streams", wrapper.GetRunningActionStreams)
	})
	r.Group(func(r chi.Router) {
		r.Get(options.BaseURL+"/actions/{id}/schema.json", wrapper.GetActionJSONSchema)
	})
	r.Group(func(r chi.Router) {
		r.Get(options.BaseURL+"/customisation", wrapper.GetCustomisationConfig)
	})

	return r
}

// Base64 encoded, gzipped, json marshaled Swagger object
var swaggerSpec = []string{

	"H4sIAAAAAAAC/8xYS2/jNhD+KwLbo2w52Ztu3k1auFisF3F7SnNgpJHMXfERPpoYhv57QVJPS45lxEl7",
	"SiyOON98M/NpyD1KOBWcAdMKxXsksMQUNEj3a5lowtkqtf+noBJJhH2AYrS6CXgWYLceaB5koJMtChGx",
	"iwJr+z/DFFCMSIpCJOHJEAkpirU0ECKVbIFiu6/eCWultCQsR2UZVl7vDFuxjB93rrcQSMMYYXkFZNy/",
	"NDaC8yB8JZTooWNm6CNI6xwKoJYzG7sEbWTj/MmA3LXeC7dT1xvFL4QaiuKrxSJElLDqV1jjIExDDtIB",
	"WWeZgslI1E8ijuDgfqORsFt3pSVJCc4UuPTfQIZNoW+l5NL+TjjTwBwaLERBEmzRRD+UhbTv7PyrhAzF",
	"6JeoLa7Ir6rI7+ac9UMyDF4EJBrSACqbGm2nGH8zReEAFMU6Q/H96878O5stlxqV4R4JyQVITXx8FviA",
	"Dv74AxJL1Mss57OKvT82628bb1ktVNbtFvPh+oxQYT27vtJbFKOc6K15nCecRgU2LNnKRBf1v5H4mUcd",
	"TDZ+Q6YB/Gs1Co9ice/L+sGmWWY4gX3Zw2hrZsZdEnAxE9zZ+R7xBVF3zX2Xr4fwAE75cNi5/Sz1mSfp",
	"sO/6Aa1ukE2/xtqoUyXVuN1480PcToGqrU4A/271T70GHcvc0FouR1NSPfSaNP9zJ2Apc/XWwqgkzsbm",
	"s3UOgLXQlwNwwG5LSIvsBMubJq3ArPbdo0QC1uBk2ks6ClFGGFFb99ALQrtrLdW9PSVgeoM1fi17HQkb",
	"bJVw01tphDGs1XN0zT9pQ1E6XRuntDpdMf/3Vo6hPyDSrYYNxLDVbI/sNVK9xL0SeE9rR4Kf2pGa6ALG",
	"P5qDlvO2fZ0fD+KLUZpTovABvlGt6xl/4Swj+WVlL0TNJ++welIXe8YlxdqXwadrFI5UBQWlcD6BKbdn",
	"az/kJ+x+fQbUuHYkldz2P6hLFiy/r+yM8NW3cTUm2UYtSAJMOXgVq0uBky0E1/MFCpGRBYrRVmuh4ih6",
	"fn6eY7c85zKPqndV9HX15fbb5nZ2PV/Mt5oWnfpAlUsUon9AKg/oar6YL1w7CWBYEBSjT/Mr59CqkKM4",
	"qjHGe5SPTT53btpSAS6KoOjH9TdzEgQS12Mr+h30sgm6N9xcLxZnzTREA534JarnjTpVWEq8Gxt5KtxB",
	"DQw5Czd0HfPUxBD1pjM3KxlKsdxZ8onSnqGaTbteUxvtSVoe5VfW/PrZ/nEXuF4+Quvn3erGpa89NhwZ",
	"yVqTqDlWlA9vTMrpXLh58Sj1F2f+boy9MkSCqxGu4QUSo0G155c+zXeGLeuVN1H8ZEDpzzzdXZjddmIa",
	"odibBM18EGCWBvWEcHgeKweVcHV5rG4s/bhikKaphGEDRvWgc6oR+2dcNdaLd96kUrr/uCfPEMomJVOl",
	"0pIRkOqVS/brIclH0xXt3X3CZP1sAI+kbc2gl7k3Ji6caNverHyA/k7oundK6WD7UymNlDtCqDM7Mqhf",
	"O9WYm8buAzN8+pXqimmCpb8V+2CB6JzrzpeJJjfvKhetl0GJVXdDNQlTFMPaBqq+zTkyd/UupP6P01cH",
	"4PE0dUN9n+7vebDZSQ5PmlVKBjyPnzLfv/D7R+EJJZ84bBcfXno4Au/Eui//DQAA//+Y9yjRMxgAAA==",
}

// GetSwagger returns the content of the embedded swagger specification file
// or error if failed to decode
func decodeSpec() ([]byte, error) {
	zipped, err := base64.StdEncoding.DecodeString(strings.Join(swaggerSpec, ""))
	if err != nil {
		return nil, fmt.Errorf("error base64 decoding spec: %w", err)
	}
	zr, err := gzip.NewReader(bytes.NewReader(zipped))
	if err != nil {
		return nil, fmt.Errorf("error decompressing spec: %w", err)
	}
	var buf bytes.Buffer
	_, err = buf.ReadFrom(zr)
	if err != nil {
		return nil, fmt.Errorf("error decompressing spec: %w", err)
	}

	return buf.Bytes(), nil
}

var rawSpec = decodeSpecCached()

// a naive cached of a decoded swagger spec
func decodeSpecCached() func() ([]byte, error) {
	data, err := decodeSpec()
	return func() ([]byte, error) {
		return data, err
	}
}

// Constructs a synthetic filesystem for resolving external references when loading openapi specifications.
func PathToRawSpec(pathToFile string) map[string]func() ([]byte, error) {
	res := make(map[string]func() ([]byte, error))
	if len(pathToFile) > 0 {
		res[pathToFile] = rawSpec
	}

	return res
}

// GetSwagger returns the Swagger specification corresponding to the generated code
// in this file. The external references of Swagger specification are resolved.
// The logic of resolving external references is tightly connected to "import-mapping" feature.
// Externally referenced files must be embedded in the corresponding golang packages.
// Urls can be supported but this task was out of the scope.
func GetSwagger() (swagger *openapi3.T, err error) {
	resolvePath := PathToRawSpec("")

	loader := openapi3.NewLoader()
	loader.IsExternalRefsAllowed = true
	loader.ReadFromURIFunc = func(loader *openapi3.Loader, url *url.URL) ([]byte, error) {
		pathToFile := url.String()
		pathToFile = path.Clean(pathToFile)
		getSpec, ok := resolvePath[pathToFile]
		if !ok {
			err1 := fmt.Errorf("path not found: %s", pathToFile)
			return nil, err1
		}
		return getSpec()
	}
	var specData []byte
	specData, err = rawSpec()
	if err != nil {
		return
	}
	swagger, err = loader.LoadFromData(specData)
	if err != nil {
		return
	}
	return
}
