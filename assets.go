package web

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
)

var clientAssetsFS fs.FS
var swaggerAssetsFS fs.FS

// SetClientAssetsFS sets the global web client assets filesystem.
func SetClientAssetsFS(f fs.FS) {
	clientAssetsFS = f
}

// SetSwaggerUIAssetsFS sets the filesystem containing the swagger UI assets.
func SetSwaggerUIAssetsFS(f fs.FS) {
	swaggerAssetsFS = f
}

// GetClientAssetsFS returns web client assets.
func GetClientAssetsFS() fs.FS {
	if clientAssetsFS != nil {
		return clientAssetsFS
	}

	// If client assets were not set in a plugin init, we are in the development environment.
	path := filepath.Join("client", "dist")
	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		panic(fmt.Sprintf("ui assets are not available on path %q. If it's a local environment, build assets or use flag --ui-assets=your/path", path))
	}
	SetClientAssetsFS(os.DirFS(path))
	return clientAssetsFS
}

// GetSwaggerUIAssetsFS returns web assets for swagger-ui.
func GetSwaggerUIAssetsFS() fs.FS {
	return swaggerAssetsFS
}
