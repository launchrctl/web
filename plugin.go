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
	stopArg    = "stop"
	pidFile    = "web.pid"

	// APIPrefix is a default api prefix on the server.
	APIPrefix = "/api"
)

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

// CobraAddCommands implements [launchr.CobraPlugin] interface to provide web functionality.
func (p *Plugin) CobraAddCommands(rootCmd *launchr.Command) error {
	pluginTmpDir := p.cfg.Path(pluginName)
	webPidFile := filepath.Join(pluginTmpDir, pidFile)

	webRunFlags := webFlags{
		PluginDir: pluginTmpDir,
	}

	var foreground bool
	var cmd = &launchr.Command{
		Use:       "web [stop]",
		Short:     "Starts Web UI",
		Args:      cobra.MatchAll(cobra.RangeArgs(0, 1), cobra.OnlyValidArgs),
		ValidArgs: []string{stopArg},
		Aliases:   []string{"ui"},
		Example: `web
web --foreground
web stop`,
		RunE: func(cmd *launchr.Command, args []string) error {
			// Don't show usage help on a runtime error.
			cmd.SilenceUsage = true

			// If 'stop' arg passed, try to interrupt process and remove PID file.
			if len(args) > 0 && args[0] == stopArg {
				return stopWeb(webPidFile, webRunFlags.PluginDir)
			}

			if url, _ := getExistingWeb(webPidFile, webRunFlags.PluginDir); url != "" {
				return fmt.Errorf("Another web UI is already running at %s\nPlease stop the existing server before starting a new one.", url)
			}

			if foreground {
				return p.runWeb(cmd.Context(), webRunFlags)
			}

			return p.runBackgroundWeb(cmd, webRunFlags, webPidFile)
		},
	}

	cmd.Flags().IntVarP(&webRunFlags.Port, "port", "p", 8080, `Web server port`)
	// Check if swagger assets are available before adding option.
	if _, err := GetSwaggerUIAssetsFS(); err == nil {
		cmd.Flags().BoolVarP(&webRunFlags.UseSwaggerUI, "swagger-ui", "", false, `Serve swagger.json on /api/swagger.json and Swagger UI on /api/swagger-ui`)
	}
	cmd.Flags().StringVarP(&webRunFlags.ProxyClient, "proxy-client", "", "", `Proxies to client web server, useful in local development`)
	cmd.Flags().BoolVarP(&foreground, "foreground", "", false, `Run server in foreground`)
	// Command flags.
	rootCmd.AddCommand(cmd)
	return nil
}
