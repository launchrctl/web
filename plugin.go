// Package web provides a launchr plugin with Web UI for launchr.
package web

import (
	"fmt"
	"path/filepath"

	"github.com/launchrctl/launchr"
	"github.com/spf13/cobra"
)

const (
	pluginName = "web"

	// APIPrefix is a default api prefix on the server.
	APIPrefix = "/api"

	stopArg = "stop"
)

func init() {
	launchr.RegisterPlugin(&Plugin{})
}

// Plugin is launchr plugin providing web ui.
type Plugin struct {
	app launchr.App
	cfg launchr.Config
}

// PluginInfo implements launchr.Plugin interface.
func (p *Plugin) PluginInfo() launchr.PluginInfo {
	return launchr.PluginInfo{}
}

// OnAppInit implements launchr.Plugin interface.
func (p *Plugin) OnAppInit(app launchr.App) error {
	app.GetService(&p.cfg)

	p.app = app
	return nil
}

type webFlags struct {
	Port         int
	ProxyClient  string
	UseSwaggerUI bool
	RunInfoDir   string
}

// CobraAddCommands implements launchr.CobraPlugin interface to provide web functionality.
func (p *Plugin) CobraAddCommands(rootCmd *cobra.Command) error {
	pluginTmpDir := p.getPluginTempDir()
	webPidFile := filepath.Join(pluginTmpDir, "web.pid")

	webRunFlags := webFlags{
		RunInfoDir: pluginTmpDir,
	}

	var foreground bool
	var cmd = &cobra.Command{
		Use:       "web [stop]",
		Short:     "Starts web server",
		Args:      cobra.MatchAll(cobra.RangeArgs(0, 1), cobra.OnlyValidArgs),
		ValidArgs: []string{stopArg},
		Aliases:   []string{"ui"},
		Example: `web
web --foreground
web stop`,
		RunE: func(cmd *cobra.Command, args []string) error {
			// Don't show usage help on a runtime error.
			cmd.SilenceUsage = true

			// If 'stop' arg passed, try to interrupt process and remove PID file.
			if len(args) > 0 && args[0] == stopArg {
				return stopWeb(webPidFile, webRunFlags.RunInfoDir)
			}

			if ok, url := isWebRunning(webPidFile, webRunFlags.RunInfoDir); ok {
				return fmt.Errorf("another server is already running at the URL: %s. please stop the existing server before starting a new one", url)
			}

			if foreground {
				//@TODO refactor to pass only plugin.app instead of full plugin.
				return runWeb(cmd.Context(), p, &webRunFlags)
			}

			return runBackgroundWeb(cmd, p, &webRunFlags, webPidFile)
		},
	}

	cmd.Flags().IntVarP(&webRunFlags.Port, "port", "p", 8080, `Web server port`)
	cmd.Flags().BoolVarP(&webRunFlags.UseSwaggerUI, "swagger-ui", "", false, `Serve swagger.json on /api/swagger.json and Swagger UI on /api/swagger-ui`)
	cmd.Flags().StringVarP(&webRunFlags.ProxyClient, "proxy-client", "", "", `Proxies to client web server, useful in local development`)
	cmd.Flags().BoolVarP(&foreground, "foreground", "", false, `Run server as foreground process`)
	// Command flags.
	rootCmd.AddCommand(cmd)
	return nil
}

func (p *Plugin) getPluginTempDir() string {
	return p.cfg.Path(pluginName)
}
