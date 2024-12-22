// Package web provides a launchr plugin with Web UI for launchr.
package web

import (
	"context"
	_ "embed"
	"fmt"
	"path/filepath"

	"github.com/launchrctl/launchr"
	"github.com/launchrctl/launchr/pkg/action"
)

const (
	pluginName = "web"
	stopArg    = "stop"
	pidFile    = "web.pid"

	// APIPrefix is a default api prefix on the server.
	APIPrefix = "/api"
)

//go:embed action.yaml
var actionYaml []byte

func init() {
	launchr.RegisterPlugin(&Plugin{})
}

// Plugin is [launchr.Plugin] providing web ui.
type Plugin struct {
	app launchr.App
	cfg launchr.Config
}

// PluginInfo implements [launchr.Plugin] interface.
func (p *Plugin) PluginInfo() launchr.PluginInfo {
	return launchr.PluginInfo{}
}

// OnAppInit implements [launchr.OnAppInitPlugin] interface.
func (p *Plugin) OnAppInit(app launchr.App) error {
	app.GetService(&p.cfg)

	p.app = app
	return nil
}

type webFlags struct {
	Port         int
	ProxyClient  string
	UseSwaggerUI bool
	PluginDir    string
}

// DiscoverActions implements [launchr.ActionDiscoveryPlugin] interface.
func (p *Plugin) DiscoverActions(_ context.Context) ([]*action.Action, error) {
	a := action.NewFromYAML("web", actionYaml)
	a.SetRuntime(action.NewFnRuntime(func(ctx context.Context, a *action.Action) error {
		pluginTmpDir := p.cfg.Path(pluginName)
		webPidFile := filepath.Join(pluginTmpDir, pidFile)
		input := a.Input()
		webRunFlags := webFlags{
			PluginDir:    pluginTmpDir,
			Port:         input.Opt("port").(int),
			UseSwaggerUI: input.Opt("swagger-ui").(bool),
			ProxyClient:  input.Opt("proxy-client").(string),
		}
		foreground := input.Opt("foreground").(bool)

		// If 'stop' arg passed, try to interrupt process and remove PID file.
		op := input.Arg("op")
		switch op {
		case stopArg:
			return stopWeb(webPidFile, webRunFlags.PluginDir)
		}

		if url, _ := getExistingWeb(webPidFile, webRunFlags.PluginDir); url != "" {
			return fmt.Errorf("another web UI is already running at %s\nPlease stop the existing server before starting a new one", url)
		}

		if foreground {
			return p.runWeb(ctx, webRunFlags)
		}

		return p.runBackgroundWeb(ctx, webRunFlags, webPidFile)
	}))
	return []*action.Action{a}, nil
}
