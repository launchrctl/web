// Package web provides a launchr plugin with Web UI for launchr.
package web

import (
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/launchrctl/launchr/pkg/log"

	"github.com/launchrctl/launchr"
	"github.com/launchrctl/web/server"
	"github.com/spf13/cobra"
)

const (
	// APIPrefix is a default api prefix on the server.
	APIPrefix             = "/api"
	stopArg               = "stop"
	tmpFolder             = "/tmp/launchr-web"
	tplPidFile            = "/tmp/launchr-web/app-%s.pid"
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

			// If 'stop' arg passed, try to kill process and remove PID file.
			if len(args) > 0 && args[0] == stopArg {
				return stopServer(all)
			}

			runOpts := &server.RunOptions{
				Addr:        fmt.Sprintf(":%s", port), // @todo use proper addr
				APIPrefix:   APIPrefix,
				SwaggerJSON: useSwaggerUI,
				ProxyClient: proxyClient,
				// @todo use embed fs for client or provide path ?
			}
			prepareRunOption(p, runOpts)

			if !isPortFree(port) {
				return fmt.Errorf("web server port %s you are trying to use is not available", port)
			}

			if foreground {
				return server.Run(cmd.Context(), p.app, runOpts)
			}

			if len(os.Getenv(cobraBackgroundEnvVar)) == 0 {
				return runBackground(cmd, generatePidFile(port))
			}

			return server.Run(cmd.Context(), p.app, runOpts)
		},
	}
	cmd.Flags().StringVarP(&port, "port", "p", "8080", `Web server port`)
	cmd.Flags().BoolVarP(&useSwaggerUI, "swagger-ui", "", false, `Serve swagger.json on /api/swagger.json and Swagger UI on /api/swagger-ui`)
	cmd.Flags().BoolVarP(&foreground, "foreground", "", false, `Run server as foreground process`)
	cmd.Flags().BoolVarP(&all, "all", "", false, `Stop all background applications`)
	cmd.Flags().StringVarP(&proxyClient, "proxy-client", "", "", `Proxies to client web server, useful in local development`)
	// Command flags.
	rootCmd.AddCommand(cmd)
	return nil
}

func generatePidFile(port string) string {
	return fmt.Sprintf("%s/app-%s.pid", tmpFolder, port)
}

func isPortFree(port string) bool {
	listener, err := net.Listen("tcp", ":"+port)
	if err != nil {
		return false
	}

	_ = listener.Close()
	return true
}

func runBackground(cmd *cobra.Command, pidFile string) error {
	if pidFileExists(pidFile) {
		// if pid file exists, check if process is running, otherwise allow to run new background process.
		pid, err := readPidFile(pidFile)
		if err != nil {
			return err
		}

		if isProcessRunning(pid) {
			return fmt.Errorf("PID file already exists %s and running, please stop background web", pidFile)
		}
	}

	err := os.MkdirAll(tmpFolder, 0750)
	if err != nil {
		return fmt.Errorf("not possible to create tmp directory for %s", pidFile)
	}

	// Prepare the command to restart itself in the background
	args := append([]string{cmd.Name()}, os.Args[2:]...)
	command := prepareCommand(os.Args[0], args)
	err = command.Start()
	if err != nil {
		cmd.Println("Failed to start in background:", err)
		return err
	}

	permissions := os.FileMode(0640)
	err = os.WriteFile(pidFile, []byte(fmt.Sprintf("%d", command.Process.Pid)), permissions)
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

func stopServer(all bool) error {
	var paths []string

	err := filepath.Walk(tmpFolder, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		if filepath.Ext(path) != ".pid" {
			return nil
		}
		pid, err := readPidFile(path)
		if err != nil {
			return err
		}

		if isProcessRunning(pid) {
			paths = append(paths, path)
		}

		return nil
	})

	if err != nil {
		return err
	}

	if len(paths) == 0 {
		fmt.Println("There are no web apps running on the background")
		return nil
	}

	if all || len(paths) == 1 {
		for _, path := range paths {
			err = doStopServer(path)
			if err != nil {
				return err
			}
		}

		return nil
	}

	fmt.Println("Please choose application you want to stop:")
	for _, p := range paths {
		fmt.Println("- " + filepath.Base(p))
	}

	fmt.Print("Enter: ")
	var input string
	_, err = fmt.Scanln(&input)
	if err != nil {
		fmt.Println("Error reading input:", err)
		return nil
	}

	for _, p := range paths {
		if input == filepath.Base(p) {
			err = doStopServer(p)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func doStopServer(pidFile string) error {
	pid, err := readPidFile(pidFile)
	if err != nil {
		return err
	}

	err = killProcess(pid)
	if err != nil {
		log.Info(err.Error())
	}

	err = removePidFile(pidFile)
	if err != nil {
		return err
	}

	fmt.Printf("Web %s stopped successfully\n", pidFile)
	return err
}
