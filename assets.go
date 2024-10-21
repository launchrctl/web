package web

import (
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
	// If client assets were not set, we are in the development environment.
	path := filepath.Join("client", "dist")
	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		panic(path + " assets are not available")
	}
	SetClientAssetsFS(os.DirFS(path))
	return clientAssetsFS
}

// GetSwaggerUIAssetsFS returns web assets for swagger-ui.
func GetSwaggerUIAssetsFS() (fs.FS, error) {
	if swaggerAssetsFS != nil {
		return swaggerAssetsFS, nil
	}
	// If client assets were not set, we are in the development environment.
	path := filepath.Join("swagger-ui")
	_, err := os.Stat(path)
	if err != nil {
		return nil, err
	}
	SetSwaggerUIAssetsFS(os.DirFS(path))
	return swaggerAssetsFS, nil
}

// MustSubFS returns fs by subpath.
func MustSubFS(orig fs.FS, path string) fs.FS {
	sub, err := fs.Sub(orig, path)
	if err != nil {
		panic(err)
	}
	return sub
}
