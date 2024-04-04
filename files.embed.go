//go:build embed

package web

import (
	"embed"
	"io/fs"
)

//go:embed swagger-ui/*
var swaggerUIFS embed.FS

//go:embed client/dist/*
var clientFS embed.FS

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
