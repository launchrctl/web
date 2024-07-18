// Package server provides primitives to interact with the openapi HTTP API.
//
// Code generated by github.com/oapi-codegen/oapi-codegen/v2 version v2.4.1 DO NOT EDIT.
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
	Changed   *[]string       `json:"changed,omitempty"`
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

// WizardFull defines model for WizardFull.
type WizardFull struct {
	Description string       `json:"description"`
	ID          string       `json:"id"`
	Steps       []ActionFull `json:"steps"`
	Success     string       `json:"success"`
	Title       string       `json:"title"`
}

// WizardShort defines model for WizardShort.
type WizardShort struct {
	Description string `json:"description"`
	ID          string `json:"id"`
	Success     string `json:"success"`
	Title       string `json:"title"`
}

// ActionId defines model for ActionId.
type ActionId = string

// ActionRunInfoId defines model for ActionRunInfoId.
type ActionRunInfoId = string

// Limit defines model for Limit.
type Limit = int

// Offset defines model for Offset.
type Offset = int

// WizardId defines model for WizardId.
type WizardId = string

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
	// Lists all wizards
	// (GET /wizard)
	GetWizards(w http.ResponseWriter, r *http.Request)
	// Returns wizard by id
	// (GET /wizard/{id})
	GetWizardByID(w http.ResponseWriter, r *http.Request, id WizardId)
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

// Lists all wizards
// (GET /wizard)
func (_ Unimplemented) GetWizards(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotImplemented)
}

// Returns wizard by id
// (GET /wizard/{id})
func (_ Unimplemented) GetWizardByID(w http.ResponseWriter, r *http.Request, id WizardId) {
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

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.GetActions(w, r)
	}))

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		handler = siw.HandlerMiddlewares[i](handler)
	}

	handler.ServeHTTP(w, r)
}

// GetActionByID operation middleware
func (siw *ServerInterfaceWrapper) GetActionByID(w http.ResponseWriter, r *http.Request) {

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

	handler.ServeHTTP(w, r)
}

// RunAction operation middleware
func (siw *ServerInterfaceWrapper) RunAction(w http.ResponseWriter, r *http.Request) {

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

	handler.ServeHTTP(w, r)
}

// GetRunningActionsByID operation middleware
func (siw *ServerInterfaceWrapper) GetRunningActionsByID(w http.ResponseWriter, r *http.Request) {

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

	handler.ServeHTTP(w, r)
}

// GetOneRunningActionByID operation middleware
func (siw *ServerInterfaceWrapper) GetOneRunningActionByID(w http.ResponseWriter, r *http.Request) {

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

	handler.ServeHTTP(w, r)
}

// GetRunningActionStreams operation middleware
func (siw *ServerInterfaceWrapper) GetRunningActionStreams(w http.ResponseWriter, r *http.Request) {

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

	handler.ServeHTTP(w, r)
}

// GetActionJSONSchema operation middleware
func (siw *ServerInterfaceWrapper) GetActionJSONSchema(w http.ResponseWriter, r *http.Request) {

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

	handler.ServeHTTP(w, r)
}

// GetCustomisationConfig operation middleware
func (siw *ServerInterfaceWrapper) GetCustomisationConfig(w http.ResponseWriter, r *http.Request) {

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.GetCustomisationConfig(w, r)
	}))

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		handler = siw.HandlerMiddlewares[i](handler)
	}

	handler.ServeHTTP(w, r)
}

// GetWizards operation middleware
func (siw *ServerInterfaceWrapper) GetWizards(w http.ResponseWriter, r *http.Request) {

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.GetWizards(w, r)
	}))

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		handler = siw.HandlerMiddlewares[i](handler)
	}

	handler.ServeHTTP(w, r)
}

// GetWizardByID operation middleware
func (siw *ServerInterfaceWrapper) GetWizardByID(w http.ResponseWriter, r *http.Request) {

	var err error

	// ------------- Path parameter "id" -------------
	var id WizardId

	err = runtime.BindStyledParameterWithOptions("simple", "id", chi.URLParam(r, "id"), &id, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationPath, Explode: false, Required: true})
	if err != nil {
		siw.ErrorHandlerFunc(w, r, &InvalidParamFormatError{ParamName: "id", Err: err})
		return
	}

	handler := http.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.GetWizardByID(w, r, id)
	}))

	for i := len(siw.HandlerMiddlewares) - 1; i >= 0; i-- {
		handler = siw.HandlerMiddlewares[i](handler)
	}

	handler.ServeHTTP(w, r)
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
	r.Group(func(r chi.Router) {
		r.Get(options.BaseURL+"/wizard", wrapper.GetWizards)
	})
	r.Group(func(r chi.Router) {
		r.Get(options.BaseURL+"/wizard/{id}", wrapper.GetWizardByID)
	})

	return r
}

// Base64 encoded, gzipped, json marshaled Swagger object
var swaggerSpec = []string{

	"H4sIAAAAAAAC/8xZyXLjNhN+FRb+/0iLsuemm2bspJSaGk9ZSeXg+ACTLRIzBMDBEltR8d1TWLiJpEXF",
	"kpKTTaKJ/vrrBd3QDsWcFpwBUxItdqjAAlNQIOzTMlaEs1Vi/k9AxoIU5gVaoNVtwDcBtuuB4sEGVJyh",
	"EBGzWGBl/meYAlogkqAQCfihiYAELZTQECIZZ0Cx2VdtCyMllSAsRWUZeq0Pmq3Yho8rVxkEQjNGWOqB",
	"DOsX2lhwHITPhBLVV8w0fQZhlEMO1HBmbBegtKiV/9Agto323O7U1kbxK6GaosX1fB4iSph/CischClI",
	"QVgg95uNhMlI5HdSjODgbqMBs9vqfid/YZGMc/5i10/r8NIIy4IzCTbobmGDda7uhODCPMecKWCWA1wU",
	"OYmxgRR9kwbXrrXx/wVs0AL9L2pCOnKrMnK7WWVduzSD1wJiBUkAXqYC20qBn3SeWwB5fr9Bi8e3lblv",
	"1hkXCpXhDhWCFyAUcfYZ4D02+PM3iI17Xq9SfuWJ/GV9/2XtJP2Cl262mPXXrwgtjGabzSpDC5QSlenn",
	"WcxplGPN4kzEKq/+jYrvadTCZOzXZBrA31aD8CguHp17n0xwiQ2OYVd2MJpIveLWCTi/KriVc7HiAqKK",
	"nsc2X0/hHpzyab9edL3UZZ4k/fjrGrS6Rcb9CistD4VUrXbtxPdx2zTwWx0A/tVUXfkWdCxSTasiPegS",
	"/9JVwtmv2wKWIpXvDQxfWI1tcYZZCpZCooDKgVyurcRC4K15di4+BvV9oU6Hes8lDYsNsgOuWdexAMyU",
	"6UcUC8AKbI1zpw8K0YYwIjP70lWRZteGm9aeAjC9xQq/5fJW3ettFXPdWalreFgV+sE196YxRarkXttD",
	"QSUr5v7eiSH0e0Ta1bCGGDbHi0P2FqmuLr5heKdADxg/NY0VUTkMn++9PHWy3cNh2IhPWipOicR7+AYL",
	"ZEf4E2cbkp62VoaoPif3oyextm+4oFi5MPhwg8KBqKAgJU4nMGX3bOT7/ITtI6tHTd1fHHeaum/GTlOp",
	"oJCdmnS4Zlv9vWI1fuyEXstwQLTxXSCqpY5jkCPV950R3+w+ZKrZhvgjtttELVmw/LoyDeJnV4V9Q27q",
	"bE5iYNKi8nYsCxxnENzM5ihEWuRogTKlCrmIopeXlxm2yzMu0sh/K6PPq093X9Z3Vzez+SxTNG8Zi7xK",
	"FKI/QUgH6Ho2n83d+QMMFwQt0IfZtVVoDhHLXlRhXOxQOtRjP9i+XgY4z4O8a9cfzJ4gIHA1IKGfQS1r",
	"ozsN7c18flQfe0QkV1mxH8q9NtfjDipgyErYRntMU21D1OnIbX+sKcVia8gnUjmGKjbNekVttCNJOcqv",
	"qPh1U+TzNrCBOULrx+3q1rqvGVBHCkcjEtUDbPn0TqdMrSpj1J+c+Ych9soQFVwOcA2vEGsFspmUuzQ/",
	"aLasVt5F8Q8NUn3kyfbE7DZd8gDFTiSo27sAsySoGrz9WbTsRcL16bHaUeRywSB0HQn9BIyqPvVQInZv",
	"U+RQLj44EV/p/uWcPKJQ1i6ZWioNGQHxn5wyX/dJHnVXtLM3V5PrZw14wG33DDqee6fjwomyzR3eBerv",
	"hKw7k0t72x9yaSTtBCiPzMig+uxQYq5ruQt6+PAn/jJzgqS7f71wgWiN5ceXido3Zy0XjZZeiPn7wIqE",
	"KRXDyAb1jDPSd3UuIf+L3VcL4Lib2qaeJ/s7Gox34v2LAu+SHs/DlwTnD/zuTcaEkI8ttpM3Lx0cgVPi",
	"KHQ/N0wa0KjOFTFj+tsjmhvWLzOidS8uDrLrjD3niOY1tLmdNqH5n31GJzRn6T9qKupfnM5aI1r3TqPM",
	"n21C67BXlmX5dwAAAP//iOiFGHUdAAA=",
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
