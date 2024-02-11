//go:build !embed

package web

import (
	"io/fs"
	"os"
)

func defaultSwaggerUIFS() fs.FS {
	return os.DirFS("./swagger-ui")
}

func defaultClientFS() fs.FS {
	return os.DirFS("./client/dist")
}
