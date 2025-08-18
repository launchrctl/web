package web

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"time"

	"github.com/launchrctl/launchr"

	"github.com/launchrctl/web/server"
)

const (
	backgroundEnvVar   = launchr.EnvVar("web_background")
	serverInfoFilename = "server-info.json"
)

func isBackGroundEnv() bool {
	return len(backgroundEnvVar.Get()) == 1
}

func (p *Plugin) runWeb(ctx context.Context, webOpts webFlags) error {
	var err error

	port := webOpts.Port
	if !isAvailablePort(port) {
		if webOpts.IsPortSet {
			return fmt.Errorf("requested port %d is not available", port)
		}
		port, err = getAvailablePort(port)
		if err != nil {
			return err
		}
	}

	serverOpts := &server.RunOptions{
		Addr:            fmt.Sprintf(":%d", port), // @todo use proper addr
		APIPrefix:       APIPrefix,
		NoUI:            webOpts.NoUI,
		ProxyClient:     webOpts.ProxyClient,
		SwaggerUIFS:     GetSwaggerUIAssetsFS(),
		Customize:       webOpts.WebCustomize,
		DefaultUISchema: webOpts.DefaultUISchema,
		LogsDirPath:     filepath.Join(webOpts.InstanceDir, "logs"),
	}
	serverOpts.SetLogger(webOpts.Log())
	serverOpts.SetTerm(webOpts.Term())

	err = storeServerInfo(serverInfo{URL: serverOpts.BaseURL()}, webOpts.InstanceDir)
	if err != nil {
		return err
	}
	defer cleanupPluginTemp(webOpts.InstanceDir)

	if !serverOpts.NoUI {
		go func() {
			time.Sleep(time.Second)
			err = openInBrowserWhenReady(serverOpts.BaseURL())
			if err != nil {
				launchr.Term().Error().Println(err)
			}
		}()

		serverOpts.ClientFS = GetClientAssetsFS()
	}

	return server.Run(ctx, p.app, serverOpts)
}

func (p *Plugin) runBackgroundWeb(ctx context.Context, flags webFlags, pidFile string) error {
	if isBackGroundEnv() {
		err := redirectOutputs(p.app, flags)
		if err != nil {
			return err
		}

		return p.runWeb(ctx, flags)
	}

	pid, err := runBackgroundCmd(pidFile)
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
			cleanupPluginTemp(flags.InstanceDir)
			return errors.New("couldn't start background process")
		case <-ticker.C:
			info, _ := getServerInfo(flags.InstanceDir)
			if info == nil {
				continue
			}

			launchr.Term().Info().Printfln("Web is running in the background (pid: %d)\nURL: %s", pid, info.URL)
			return nil
		}
	}
}

func stopWeb(pidFile string, webOpts webFlags) (err error) {
	onSuccess := "The web UI has been successfully shut down."

	// Try to finish the background process.
	pid, ok := pidFileInfo(pidFile)
	if pid != 0 && ok {
		err = interruptProcess(pid)
		if err != nil {
			return err
		}

		launchr.Term().Success().Println(onSuccess)
		return nil
	}

	// If we don't have pid, probably there is a server running in foreground.
	// We may also not have access to the pid file, prompt user the same.
	serverRunInfo, err := getServerInfo(webOpts.InstanceDir)
	if err != nil {
		return err
	}

	if serverRunInfo == nil || serverRunInfo.URL == "" {
		launchr.Term().Warning().Println("There is no active Web UI that can be stopped.")
		return nil
	}

	if err = checkHealth(serverRunInfo.URL); err == nil {
		return fmt.Errorf("the web UI is currently running at %s\nPlease stop it through the user interface or terminate the process", serverRunInfo.URL)
	}
	cleanupPluginTemp(webOpts.InstanceDir)
	launchr.Term().Success().Println(onSuccess)
	return nil
}

func runBackgroundCmd(pidFile string) (int, error) {
	err := launchr.EnsurePath(filepath.Dir(pidFile))
	if err != nil {
		return 0, fmt.Errorf("cannot create tmp directory for %q", pidFile)
	}

	// Prepare the command to restart itself in the background
	command := exec.Command(os.Args[0], os.Args[1:]...) //nolint G204
	command.Env = append(os.Environ(), backgroundEnvVar.EnvString("1"))

	// Set platform-specific process ID
	setSysProcAttr(command)

	err = command.Start()
	if err != nil {
		return 0, fmt.Errorf("failed to start the process in background: %w", err)
	}

	err = os.WriteFile(pidFile, []byte(strconv.Itoa(command.Process.Pid)), os.FileMode(0644))
	if err != nil {
		return 0, fmt.Errorf("failed to write PID file: %w", err)
	}

	return command.Process.Pid, nil
}

func redirectOutputs(app launchr.App, webOpts webFlags) error {
	err := launchr.EnsurePath(webOpts.InstanceDir)
	if err != nil {
		return fmt.Errorf("can't create plugin temporary directory")
	}

	outLog, err := os.Create(filepath.Join(webOpts.InstanceDir, "out.log")) //nolint G304 // Path is clean.
	if err != nil {
		return err
	}

	// Redirect log messages to a file.
	launchr.Log().SetOutput(app.SensitiveWriter(outLog))
	// Discard console output because it's intended for user interaction.
	launchr.Term().SetOutput(io.Discard)

	return nil
}

// serverInfo is structure that stores current running server metadata.
type serverInfo struct {
	// URL holds the server's publicly accessible URL.
	URL string `json:"url"`
}

func storeServerInfo(ri serverInfo, storePath string) error {
	out, err := json.Marshal(&ri)
	if err != nil {
		return err
	}

	err = os.MkdirAll(storePath, 0750)
	if err != nil {
		return err
	}
	err = os.WriteFile(filepath.Join(storePath, serverInfoFilename), out, os.FileMode(0640))
	if err != nil {
		return err
	}

	return nil
}

func cleanupPluginTemp(dir string) {
	err := os.RemoveAll(dir)
	if err != nil {
		launchr.Log().Warn("error on server info cleanup", "error", err)
	}
}

// checkHealth helper to check if a server is available by request.
func checkHealth(url string) error {
	req, err := http.NewRequest(http.MethodHead, url, nil) //nolint G107 // @todo URL may come from user input, potential vulnerability.
	if err != nil {
		return err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	_ = resp.Body.Close()

	if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusUnauthorized {
		return nil
	}
	return fmt.Errorf("bad response code %d", resp.StatusCode)
}

// getServerInfo lookups server run info metadata and tries to get it from storage.
func getServerInfo(dir string) (*serverInfo, error) {
	path := filepath.Clean(filepath.Join(dir, serverInfoFilename))

	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		return nil, nil
	} else if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("error reading plugin storage path: %w", err)
	}

	var info serverInfo
	err = json.Unmarshal(data, &info)
	if err != nil {
		return nil, fmt.Errorf("error unmarshalling json: %w", err)
	}

	return &info, nil
}

func getExistingWeb(pidFile string, pluginDir string) (string, error) {
	if isBackGroundEnv() {
		// The case was checked on the init step.
		return "", nil
	}

	serverRunInfo, err := getServerInfo(pluginDir)
	if err != nil {
		return "", err
	}
	if serverRunInfo == nil || serverRunInfo.URL == "" {
		// No server.
		return "", nil
	}

	if _, ok := pidFileInfo(pidFile); ok {
		return serverRunInfo.URL, nil
	}

	if err = checkHealth(serverRunInfo.URL); err != nil {
		return serverRunInfo.URL, fmt.Errorf("web unhealthy response: %w", err)
	}

	return serverRunInfo.URL, nil
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

func openInBrowserWhenReady(url string) error {
	// Wait until the service is healthy.
	retries := 0
	for err := checkHealth(url); err != nil; {
		time.Sleep(time.Second)
		if retries == 10 {
			return fmt.Errorf("web is unhealthy: %w", err)
		}
		retries++
		if retries == 3 {
			launchr.Term().Info().Println("The server isn't ready yet, please standby...")
		}
		launchr.Log().Debug("waiting for server to start", "retries", retries)
	}
	// Open the browser
	launchr.Term().Info().Printfln("You can reach the web server at this URL: %s", url)
	if err := openBrowser(url); err != nil {
		launchr.Log().Error("failed to open browser", "error", err)
		return fmt.Errorf("failed to open browser: %w", err)
	}
	return nil
}

func openBrowser(url string) error {
	switch runtime.GOOS {
	case "linux":
		return exec.Command("xdg-open", url).Start()
	case "windows":
		return exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		return exec.Command("open", url).Start()
	default:
		return fmt.Errorf("unsupported platform")
	}
}
