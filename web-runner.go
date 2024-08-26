package web

import (
	"context"
	"errors"
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/launchrctl/launchr/pkg/cli"
	"github.com/launchrctl/launchr/pkg/log"
	"github.com/spf13/cobra"

	"github.com/launchrctl/web/server"
)

const (
	launchrBackgroundEnvVar = "LAUNCHR_BACKGROUND"
)

func isBackGroundEnv() bool {
	return len(os.Getenv(launchrBackgroundEnvVar)) == 1
}

func runWeb(ctx context.Context, p *Plugin, webOpts *webFlags) error {
	var err error

	port := webOpts.Port
	if !isAvailablePort(port) {
		log.Info("The port %d you are trying to use for the web server is not available.", port)
		port, err = getAvailablePort(port)
		if err != nil {
			return err
		}
	}

	serverOpts := &server.RunOptions{
		Addr:        fmt.Sprintf(":%d", port), // @todo use proper addr
		APIPrefix:   APIPrefix,
		SwaggerJSON: webOpts.UseSwaggerUI,
		ProxyClient: webOpts.ProxyClient,
		RunInfoDir:  webOpts.RunInfoDir,
		// @todo use embed fs for client or provide path ?
	}

	// @todo to consider renaming and removing access to plugin and overall global assets.
	prepareRunOption(p, serverOpts)

	return server.Run(ctx, p.app, serverOpts)
}

func runBackgroundWeb(cmd *cobra.Command, p *Plugin, flags *webFlags, pidFile string) error {
	if isBackGroundEnv() {
		// @TODO rework logs, to replace with global launchr logging.
		err := redirectOutputs(flags.RunInfoDir)
		if err != nil {
			return err
		}

		return runWeb(cmd.Context(), p, flags)
	}

	pid, err := runBackgroundCmd(cmd, pidFile)
	if err != nil {
		return err
	}

	// Wait until background server is up.
	// Check if run info created and server is reachable.
	// Print server URL in CLI.
	// Kill process in case of timeout
	timeout := time.After(10 * time.Second)
	ticker := time.NewTicker(1 * time.Second)

	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			// Kill existing process
			_ = killProcess(pid)

			// Cleanup temp dir
			err = os.RemoveAll(flags.RunInfoDir)
			if err != nil {
				log.Debug(err.Error())
			}

			return errors.New("couldn't start background process")
		case <-ticker.C:
			runInfo, _ := server.GetRunInfo(flags.RunInfoDir)
			if runInfo == nil {
				continue
			}

			cli.Println("Web running in background with PID:%d", pid)
			cli.Println(runInfo.BaseURL)

			return nil
		}
	}
}

func runBackgroundCmd(cmd *cobra.Command, pidFile string) (int, error) {
	err := os.MkdirAll(filepath.Dir(pidFile), 0750)
	if err != nil {
		return 0, fmt.Errorf("not possible to create tmp directory for %s", pidFile)
	}

	// Prepare the command to restart itself in the background
	args := append([]string{cmd.Name()}, os.Args[2:]...)

	command := exec.Command(os.Args[0], args...) //nolint G204
	command.Env = append(os.Environ(), fmt.Sprintf("%s=1", launchrBackgroundEnvVar))

	// Set platform-specific process ID
	setSysProcAttr(command)

	err = command.Start()
	if err != nil {
		cmd.Println("Failed to start in background:", err)
		return 0, err
	}

	err = os.WriteFile(pidFile, []byte(fmt.Sprintf("%d", command.Process.Pid)), os.FileMode(0644))
	if err != nil {
		return 0, fmt.Errorf("failed to write PID file: %w", err)
	}

	return command.Process.Pid, nil
}

func redirectOutputs(dir string) error {
	err := os.MkdirAll(dir, 0750)
	if err != nil {
		return fmt.Errorf("can't create plugin temporary directory")
	}

	outLog, err := os.Create(fmt.Sprintf("%s/out.log", dir))
	if err != nil {
		return err
	}

	errLog, err := os.Create(fmt.Sprintf("%s/error.log", dir))
	if err != nil {
		return err
	}

	os.Stdout = outLog
	os.Stderr = errLog

	return nil
}

func isWebRunning(pidFile string, runInfoDir string) (bool, string) {
	url := ""
	if isBackGroundEnv() {
		return false, url
	}

	serverRunInfo, err := server.GetRunInfo(runInfoDir)
	if err != nil {
		log.Debug(err.Error())
		return false, url
	}

	if serverRunInfo != nil {
		url = serverRunInfo.BaseURL
	}

	if pidFileExists(pidFile) {
		pid, errPid := readPidFile(pidFile)
		if errPid == nil {
			if isProcessRunning(pid) {
				return true, url
			}
		}
	}

	if url == "" {
		return false, url
	}

	isHealthy, err := server.CheckHealth(serverRunInfo.BaseURL)
	if err != nil {
		log.Debug(err.Error())
	}

	return isHealthy, url
}

func stopWeb(pidFile, runInfoDir string) error {
	onSuccess := "The web server has been successfully shut down."

	if pidFileExists(pidFile) {
		pid, err := readPidFile(pidFile)
		if err != nil {
			return err
		}

		if isProcessRunning(pid) {
			err = interruptProcess(pid)
			if err != nil {
				return err
			}

			cli.Println(onSuccess)
			return nil
		}
	}

	serverRunInfo, err := server.GetRunInfo(runInfoDir)
	if err != nil {
		return err
	}

	if serverRunInfo == nil {
		cli.Println("At present, there is no active server that can be stopped.")
		return nil
	}

	if serverRunInfo.BaseURL == "" {
		panic("An instance of 'run-info' with an empty URL has been detected. Please remove it.")
	}

	isHealthy, err := server.CheckHealth(serverRunInfo.BaseURL)
	if err != nil {
		return err
	}

	if isHealthy {
		return fmt.Errorf("A foreground server is currently running at the address '%s'. Please stop it via the user interface or terminate the process", serverRunInfo.BaseURL)
	}

	cli.Println(onSuccess)
	return nil
}

func getAvailablePort(port int) (int, error) {
	// Quick check if port available and return if yes.
	if isAvailablePort(port) {
		return port, nil
	}

	maxPort := 65535
	newPort := 49152

	// Check available port from pool.
	for !isAvailablePort(newPort) && newPort < maxPort {
		log.Debug("port %d is not available", newPort)
		newPort++
	}

	if newPort >= maxPort && !isAvailablePort(newPort) {
		panic("port limit exceeded")
	}

	return newPort, nil
}

func isAvailablePort(port int) bool {
	listener, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		return false
	}

	_ = listener.Close()
	return true
}
