//go:build dev || embed

package web

import (
	"embed"
	"github.com/launchrctl/web/server"
	"io/fs"
)

//go:embed swagger-ui/*
var swaggerUIFS embed.FS

//go:embed client/dist/*
var clientFS embed.FS

func prepareRunOption(_ *Plugin, opts *server.RunOptions) {
	opts.SwaggerUIFS = defaultSwaggerUIFS()
	opts.ClientFS = defaultClientFS()
}

func defaultSwaggerUIFS() fs.FS {
	sub, err := fs.Sub(swaggerUIFS, "swagger-ui")
	if err != nil {
		panic(err)
	}
	return sub
}

func defaultClientFS() fs.FS {
	sub, err := fs.Sub(clientFS, "client/dist")
	if err != nil {
		panic(err)
	}
	return sub
}
