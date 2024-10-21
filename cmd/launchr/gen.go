//go:build ignore

package main

import (
	"github.com/launchrctl/launchr"

	_ "github.com/launchrctl/web"
)

func main() {
	launchr.GenAndExit()
}
