//go:build !dev && !embed

package web

import (
	"github.com/launchrctl/web/server"
	"io/fs"
)

func prepareRunOption(p *Plugin, opts *server.RunOptions) {
	assetsFs := p.app.GetPluginAssets(p)
	opts.SwaggerUIFS = defaultSwaggerUIFS(assetsFs)
	opts.ClientFS = defaultClientFS(assetsFs)
}

func defaultSwaggerUIFS(assets fs.FS) fs.FS {
	sub, err := fs.Sub(assets, "swagger-ui")
	if err != nil {
		panic(err)
	}
	return sub
}

func defaultClientFS(assets fs.FS) fs.FS {
	sub, err := fs.Sub(assets, "dist")
	if err != nil {
		panic(err)
	}
	return sub
}
