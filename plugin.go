// Package web provides a launchr plugin with Web UI for launchr.
package web

import (
	"fmt"
	"os"
	"os/exec"

	"github.com/launchrctl/launchr/pkg/log"

	"github.com/launchrctl/launchr"
	"github.com/launchrctl/web/server"
	"github.com/spf13/cobra"
)

const (
	// APIPrefix is a default api prefix on the server.
	APIPrefix             = "/api"
	stopArg               = "stop"
	webPidFile            = "/tmp/launchr-web.pid"
	cobraBackgroundEnvVar = "BACKGROUND"
)

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
	var background bool
	var cmd = &cobra.Command{
		Use:       "web",
		Short:     "Starts web server",
		Args:      cobra.MatchAll(cobra.RangeArgs(0, 1), cobra.OnlyValidArgs),
		ValidArgs: []string{stopArg},
		RunE: func(cmd *cobra.Command, args []string) error {
			// Don't show usage help on a runtime error.
			cmd.SilenceUsage = true

			// If 'stop' arg passed, try to kill process and remove PID file.
			if len(args) > 0 && args[0] == stopArg {
				return stopServer()
			}

			runOpts := &server.RunOptions{
				Addr:        fmt.Sprintf(":%s", port), // @todo use proper addr
				APIPrefix:   APIPrefix,
				SwaggerJSON: useSwaggerUI,
				ProxyClient: proxyClient,
				// @todo use embed fs for client or provide path ?
			}
			prepareRunOption(p, runOpts)

			if !background {
				return server.Run(cmd.Context(), p.app, runOpts)
			}

			if len(os.Getenv(cobraBackgroundEnvVar)) == 0 {
				return runBackground(cmd)
			}

			return server.Run(cmd.Context(), p.app, runOpts)
		},
	}
	cmd.Flags().StringVarP(&port, "port", "p", "8080", `Web server port`)
	cmd.Flags().BoolVarP(&useSwaggerUI, "swagger-ui", "", false, `Serve swagger.json on /api/swagger.json and Swagger UI on /api/swagger-ui`)
	cmd.Flags().BoolVarP(&background, "background", "", false, `Create background process to run server`)
	cmd.Flags().StringVarP(&proxyClient, "proxy-client", "", "", `Proxies to client web server, useful in local development`)
	// Command flags.
	rootCmd.AddCommand(cmd)
	return nil
}

func runBackground(cmd *cobra.Command) error {
	if pidFileExists(webPidFile) {
		// if pid file exists, check if process is running, otherwise allow to run new background process.
		pid, err := readPidFile(webPidFile)
		if err != nil {
			return err
		}

		if isProcessRunning(pid) {
			return fmt.Errorf("PID file already exists %s and running, please stop background web", webPidFile)
		}
	}

	// Prepare the command to restart itself in the background
	args := append([]string{cmd.Name()}, os.Args[2:]...)
	command := prepareCommand(os.Args[0], args)
	err := command.Start()
	if err != nil {
		cmd.Println("Failed to start in background:", err)
		return err
	}

	permissions := os.FileMode(0640)
	err = os.WriteFile(webPidFile, []byte(fmt.Sprintf("%d", command.Process.Pid)), permissions)
	if err != nil {
		cmd.Println("Failed to write PID file:", err)
		return err
	}

	cmd.Println("Web running in background with PID:", command.Process.Pid)
	return nil
}

func prepareCommand(name string, args []string) *exec.Cmd {
	command := exec.Command(name, args...)
	command.Env = append(os.Environ(), fmt.Sprintf("%s=1", cobraBackgroundEnvVar))

	// Set platform-specific process ID
	setSysProcAttr(command)

	return command
}

func stopServer() error {
	pid, err := readPidFile(webPidFile)
	if err != nil {
		return err
	}

	err = killProcess(pid)
	if err != nil {
		log.Info(err.Error())
	}

	err = removePidFile(webPidFile)
	if err != nil {
		return err
	}

	fmt.Println("Web stopped successfully.")
	return err
}
