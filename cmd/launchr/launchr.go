// Package executes Launchr application.
package main

import (
	"github.com/launchrctl/launchr"

	_ "github.com/launchrctl/web"
)

func main() {
	launchr.RunAndExit()
}
