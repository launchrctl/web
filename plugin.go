// Package web provides a launchr plugin with Web UI for launchr.
package web

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/launchrctl/launchr/pkg/cli"
	"github.com/launchrctl/launchr/pkg/log"

	"github.com/launchrctl/launchr"
	"github.com/launchrctl/web/server"
	"github.com/spf13/cobra"
)

const (
	// APIPrefix is a default api prefix on the server.
	APIPrefix             = "/api"
	stopArg               = "stop"
	pluginName            = "web"
	cobraBackgroundEnvVar = "BACKGROUND"
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

// CobraAddCommands implements launchr.CobraPlugin interface to provide web functionality.
func (p *Plugin) CobraAddCommands(rootCmd *cobra.Command) error {
	// Flag options.
	var port int
	var proxyClient string
	var useSwaggerUI bool
	var foreground bool
	var all bool
	var cmd = &cobra.Command{
		Use:       "web",
		Short:     "Starts web server",
		Args:      cobra.MatchAll(cobra.RangeArgs(0, 1), cobra.OnlyValidArgs),
		ValidArgs: []string{stopArg},
		RunE: func(cmd *cobra.Command, args []string) error {
			// Don't show usage help on a runtime error.
			cmd.SilenceUsage = true

			pidFile := p.buildPidPath(strings.ToLower(cmd.Name()))
			tmpFolder := filepath.Dir(pidFile)
			existingRunInfo, _ := server.GetRunInfo(tmpFolder)

			attachBackgroundLogs(tmpFolder)

			// If 'stop' arg passed, try to kill process and remove PID file.
			if len(args) > 0 && args[0] == stopArg {
				err := stopBackgroundServer(pidFile, existingRunInfo)
				if err != nil {
					return err
				}

				cli.Println("Web server stopped successfully")
				return nil
			}

			if isServerRunning(pidFile, existingRunInfo) {
				return fmt.Errorf("server is already running by address %s, please stop it before running new one", existingRunInfo.BaseURL)
			}

			if !server.IsPortFree(port) {
				log.Info("web server port %d you are trying to use is not available", port)
				port = server.GetFreePort(port, 20)
			}

			runOpts := &server.RunOptions{
				Addr:          fmt.Sprintf(":%d", port), // @todo use proper addr
				APIPrefix:     APIPrefix,
				SwaggerJSON:   useSwaggerUI,
				ProxyClient:   proxyClient,
				RunInfoFolder: tmpFolder,
				// @todo use embed fs for client or provide path ?
			}
			prepareRunOption(p, runOpts)

			if foreground {
				return server.Run(cmd.Context(), p.app, runOpts)
			}

			if len(os.Getenv(cobraBackgroundEnvVar)) == 0 {
				pid, err := p.runBackgroundCmd(cmd, pidFile)
				if err != nil {
					return err
				}
				cmd.Println("Web running in background with PID:", pid)

				return nil
			}

			return server.Run(cmd.Context(), p.app, runOpts)
		},
	}

	cmd.Flags().IntVarP(&port, "port", "p", 8080, `Web server port`)
	cmd.Flags().BoolVarP(&useSwaggerUI, "swagger-ui", "", false, `Serve swagger.json on /api/swagger.json and Swagger UI on /api/swagger-ui`)
	cmd.Flags().BoolVarP(&foreground, "foreground", "", false, `Run server as foreground process`)
	cmd.Flags().BoolVarP(&all, "all", "", false, `Stop all background applications`)
	cmd.Flags().StringVarP(&proxyClient, "proxy-client", "", "", `Proxies to client web server, useful in local development`)
	// Command flags.
	rootCmd.AddCommand(cmd)
	return nil
}

func (p *Plugin) runBackgroundCmd(cmd *cobra.Command, pidFile string) (int, error) {
	err := os.MkdirAll(filepath.Dir(pidFile), 0750)
	if err != nil {
		return 0, fmt.Errorf("not possible to create tmp directory for %s", pidFile)
	}

	// Prepare the command to restart itself in the background
	args := append([]string{cmd.Name()}, os.Args[2:]...)
	command := prepareBackgroundCommand(os.Args[0], args)
	err = command.Start()
	if err != nil {
		cmd.Println("Failed to start in background:", err)
		return 0, err
	}

	permissions := os.FileMode(0640)
	err = os.WriteFile(pidFile, []byte(fmt.Sprintf("%d", command.Process.Pid)), permissions)
	if err != nil {
		cmd.Println("Failed to write PID file:", err)
		return 0, err
	}

	return command.Process.Pid, nil
}

func prepareBackgroundCommand(name string, args []string) *exec.Cmd {
	command := exec.Command(name, args...)
	command.Env = append(os.Environ(), fmt.Sprintf("%s=1", cobraBackgroundEnvVar))

	// Set platform-specific process ID
	setSysProcAttr(command)

	return command
}

func attachBackgroundLogs(tmpFolder string) {
	if len(os.Getenv(cobraBackgroundEnvVar)) == 0 {
		return
	}

	out, _ := os.Create(fmt.Sprintf("%s/out.log", tmpFolder))
	err, _ := os.Create(fmt.Sprintf("%s/error.log", tmpFolder))

	os.Stdout = out
	os.Stderr = err
}

func (p *Plugin) buildPidPath(name string) string {
	return p.cfg.Path(fmt.Sprintf("%s/%s.pid", pluginName, name))
}

func isServerRunning(pidFile string, info *server.RunInfo) bool {
	if len(os.Getenv(cobraBackgroundEnvVar)) == 1 {
		return false
	}

	if pidFileExists(pidFile) {
		pid, err := readPidFile(pidFile)
		if err == nil {
			if isProcessRunning(pid) {
				return true
			}
		}
	}

	if info == nil || info.BaseURL == "" {
		return false
	}

	ping, err := server.PingServer(info.BaseURL)
	if err != nil {
		log.Debug(err.Error())
	}

	return ping
}

func stopBackgroundServer(pidFile string, info *server.RunInfo) error {
	if pidFileExists(pidFile) {
		pid, err := readPidFile(pidFile)
		if err == nil {
			if isProcessRunning(pid) {
				err = interruptProcess(pid)
				if err != nil {
					log.Debug(err.Error())
				}
				return nil
			}
		}
	}

	if info == nil || info.BaseURL == "" {
		return nil
	}

	ping, err := server.PingServer(info.BaseURL)
	if err != nil {
		log.Debug(err.Error())
	}

	if ping {
		return fmt.Errorf("foreground server is running by address %s, please stop it via UI or terminate process", info.BaseURL)
	}

	return nil
}
