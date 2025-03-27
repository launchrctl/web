// Package web provides a launchr plugin with Web UI for launchr.
package web

import (
	"context"
	_ "embed"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/launchrctl/launchr"
	"github.com/launchrctl/launchr/pkg/action"

	"github.com/launchrctl/web/server"
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

//go:embed action.terminate.yaml
var actionTerminateYaml []byte

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
	Port              int
	IsPortSet         bool
	ProxyClient       string
	PluginDir         string
	FrontendCustomize server.FrontendCustomize
}

// DiscoverActions implements [launchr.ActionDiscoveryPlugin] interface.
func (p *Plugin) DiscoverActions(_ context.Context) ([]*action.Action, error) {
	a := action.NewFromYAML("web", actionYaml)
	a.SetRuntime(action.NewFnRuntime(func(ctx context.Context, a *action.Action) error {
		pluginTmpDir := p.cfg.Path(pluginName)
		webPidFile := filepath.Join(pluginTmpDir, pidFile)
		input := a.Input()
		webRunFlags := webFlags{
			PluginDir:   pluginTmpDir,
			Port:        input.Opt("port").(int),
			IsPortSet:   input.IsOptChanged("port"),
			ProxyClient: input.Opt("proxy-client").(string),
			FrontendCustomize: server.FrontendCustomize{
				VarsFile:  input.Opt("vars-file").(string),
				Variables: action.InputOptSlice[string](input, "variables"),
			},
		}
		foreground := input.Opt("foreground").(bool)
		// Override client assets.
		clientAssets := input.Opt("ui-assets").(string)
		if clientAssets != "" {
			path := launchr.MustAbs(clientAssets)
			_, err := os.Stat(path)
			if os.IsNotExist(err) {
				return fmt.Errorf("ui assets are not available on path: %s", path)
			}
			SetClientAssetsFS(os.DirFS(path))
		}

		swaggerUI := input.Opt("swagger-ui").(string)
		if swaggerUI != "" {
			path := launchr.MustAbs(swaggerUI)
			_, err := os.Stat(path)
			if os.IsNotExist(err) {
				return fmt.Errorf("swagger UI is not available on path: %s", path)
			}

			SetSwaggerUIAssetsFS(os.DirFS(path))
		}

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

	terminateA := action.NewFromYAML("test:terminate", actionTerminateYaml)
	terminateA.SetRuntime(action.NewFnRuntime(func(ctx context.Context, a *action.Action) error {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()

		for i := 1; i <= 6; i++ {
			select {
			case <-ctx.Done():
				fmt.Println("someFunction: Context cancelled, stopping early")
				str := []byte("someFunction: Context cancelled, stopping early")
				_, _ = a.Input().Streams().Out().Write(str)
				return ctx.Err()
			case <-ticker.C:
				fmt.Printf("someFunction: Running... %d0 seconds\n", i)
				str := []byte(fmt.Sprintf("someFunction: Running... %d0 seconds\n", i))
				_, err := a.Input().Streams().Out().Write(str)
				if err != nil {
					return err
				}
			}
		}

		return nil
	}))

	return []*action.Action{a, terminateA}, nil
}
