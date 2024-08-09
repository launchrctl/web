// Package web provides a launchr plugin with Web UI for launchr.
package web

import (
	"fmt"

	"github.com/launchrctl/launchr"
	"github.com/launchrctl/web/server"
	"github.com/spf13/cobra"
)

// APIPrefix is a default api prefix on the server.
const APIPrefix = "/api"

func init() {
	launchr.RegisterPlugin(&Plugin{})
}

// Plugin is launchr plugin providing web ui.
type Plugin struct {
	app launchr.App
}

// PluginInfo implements launchr.Plugin interface.
func (p *Plugin) PluginInfo() launchr.PluginInfo {
	return launchr.PluginInfo{}
}

// OnAppInit implements launchr.Plugin interface.
func (p *Plugin) OnAppInit(app launchr.App) error {
	p.app = app
	return nil
}

// CobraAddCommands implements launchr.CobraPlugin interface to provide web functionality.
func (p *Plugin) CobraAddCommands(rootCmd *cobra.Command) error {
	// Flag options.
	var port string
	var proxyClient string
	var useSwaggerUI bool
	var cmd = &cobra.Command{
		Use:     "web",
		Short:   "Starts web server",
		Aliases: []string{"ui"},
		RunE: func(cmd *cobra.Command, args []string) error {
			// Don't show usage help on a runtime error.
			cmd.SilenceUsage = true

			runOpts := &server.RunOptions{
				Addr:        fmt.Sprintf(":%s", port), // @todo use proper addr
				APIPrefix:   APIPrefix,
				SwaggerJSON: useSwaggerUI,
				ProxyClient: proxyClient,
				// @todo use embed fs for client or provide path ?
			}

			prepareRunOption(p, runOpts)

			return server.Run(cmd.Context(), p.app, runOpts)
		},
	}
	cmd.Flags().StringVarP(&port, "port", "p", "8080", `Web server port`)
	cmd.Flags().BoolVarP(&useSwaggerUI, "swagger-ui", "", false, `Serve swagger.json on /api/swagger.json and Swagger UI on /api/swagger-ui`)
	cmd.Flags().StringVarP(&proxyClient, "proxy-client", "", "", `Proxies to client web server, useful in local development`)
	// Command flags.
	rootCmd.AddCommand(cmd)
	return nil
}
