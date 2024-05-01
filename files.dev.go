//go:build dev

package web

import (
	"github.com/launchrctl/web/server"
	"io/fs"
	"os"
)

func prepareRunOption(_ *Plugin, opts *server.RunOptions) {
	opts.SwaggerUIFS = defaultSwaggerUIFS()
	opts.ClientFS = defaultClientFS()
}

func defaultSwaggerUIFS() fs.FS {
	return os.DirFS("./cmd/launchr/assets/github.com/launchrctl/web/swagger-ui/swagger-ui")
}

func defaultClientFS() fs.FS {
	return os.DirFS("./client/dist")
}
