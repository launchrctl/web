package web

import (
	"github.com/spf13/cobra"

	"github.com/launchrctl/launchr"
	"github.com/launchrctl/web/server"
)

// ID is a plugin id.
const ID = "web"

func init() {
	launchr.RegisterPlugin(&Plugin{})
}

// Plugin is launchr plugin providing web ui.
type Plugin struct {
	app *launchr.App
}

// PluginInfo implements launchr.Plugin interface.
func (p *Plugin) PluginInfo() launchr.PluginInfo {
	return launchr.PluginInfo{
		ID: ID,
	}
}

// InitApp implements launchr.Plugin interface.
func (p *Plugin) InitApp(app *launchr.App) error {
	p.app = app
	return nil
}

// CobraAddCommands implements launchr.CobraPlugin interface to provide web functionality.
func (p *Plugin) CobraAddCommands(rootCmd *cobra.Command) error {
	// Flag options.
	var port string
	var cmd = &cobra.Command{
		Use:   "web",
		Short: "Starts web server",
		RunE: func(cmd *cobra.Command, args []string) error {
			// Don't show usage help on a runtime error.
			cmd.SilenceUsage = true
			return server.Run(port)
		},
	}
	cmd.Flags().StringVarP(&port, "port", "p", "8080", `Web server port`)
	// Command flags.
	rootCmd.AddCommand(cmd)
	return nil
}
