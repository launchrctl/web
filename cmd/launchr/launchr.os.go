//go:build !dev

// Package executes Launchr application.
package main

import (
	"embed"
	"os"

	"github.com/launchrctl/launchr"
	_ "github.com/launchrctl/web"
)

//go:embed assets/*
var assets embed.FS

func main() {
	os.Exit(launchr.Run(&launchr.AppOptions{AssetsFs: assets}))
}
