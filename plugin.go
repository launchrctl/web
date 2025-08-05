// Package web provides a launchr plugin with Web UI for launchr.
package web

import (
	"context"
	_ "embed"
	"fmt"
	"os"
	"path/filepath"

	"github.com/launchrctl/keyring"
	"github.com/launchrctl/launchr"
	"github.com/launchrctl/launchr/pkg/action"

	"github.com/launchrctl/web/server"
)

const (
	pluginName         = "web"
	stopArg            = "stop"
	pidFile            = "web.pid"
	runningInstanceDir = "instance"

	// APIPrefix is a default api prefix on the server.
	APIPrefix = "/api"
)

//go:embed action.yaml
var actionYaml []byte

//go:embed ui-schema.default.yaml
var defaultUISchema []byte

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
	action.WithLogger
	action.WithTerm

	// Common Web flags.
	Auth            keyring.CredentialsItem
	NoUI            bool
	Port            int
	IsPortSet       bool
	ProxyClient     string
	InstanceDir     string
	WebCustomize    server.WebCustomize
	DefaultUISchema []byte
}

// @todo move to launchr core action.utils.
func getActionLoggers(a *action.Action) (*launchr.Logger, *launchr.Terminal) {
	// Fallback to default launchr logger.
	log := launchr.Log()
	if rt, ok := a.Runtime().(action.RuntimeLoggerAware); ok {
		log = rt.LogWith()
	}

	// Fallback to default launchr term.
	term := launchr.Term()
	if rt, ok := a.Runtime().(action.RuntimeTermAware); ok {
		term = rt.Term()
	}

	return log, term
}

// DiscoverActions implements [launchr.ActionDiscoveryPlugin] interface.
func (p *Plugin) DiscoverActions(_ context.Context) ([]*action.Action, error) {
	a := action.NewFromYAML("web", actionYaml)
	a.SetRuntime(action.NewFnRuntime(func(ctx context.Context, a *action.Action) error {
		instanceDir := p.cfg.Path(pluginName, runningInstanceDir)
		webPidFile := filepath.Join(instanceDir, pidFile)
		input := a.Input()

		ci := keyring.CredentialsItem{
			Username: input.Opt("auth_user").(string),
			Password: input.Opt("auth_password").(string),
		}

		wf := webFlags{
			Auth:        ci,
			NoUI:        input.Opt("no-ui").(bool),
			InstanceDir: instanceDir,
			Port:        input.Opt("port").(int),
			IsPortSet:   input.IsOptChanged("port"),
			ProxyClient: input.Opt("proxy-client").(string),
			WebCustomize: server.WebCustomize{
				Variables:       make(map[string]any),
				ExcludedActions: make(map[string]bool),
			},
			DefaultUISchema: defaultUISchema,
		}

		// Retrieve a list of excluded actions from config.
		var excludedActions []string
		err := p.cfg.Get("web.excluded_actions", &excludedActions)
		if err != nil {
			return err
		}
		for _, ea := range excludedActions {
			wf.WebCustomize.ExcludedActions[ea] = true
		}

		var variables map[string]any
		err = p.cfg.Get("web.variables", &variables)
		if err != nil {
			return err
		}
		if variables != nil {
			wf.WebCustomize.Variables = variables
		}

		log, term := getActionLoggers(a)
		wf.SetLogger(log)
		wf.SetTerm(term)

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
			return stopWeb(webPidFile, wf)
		}

		url, err := getExistingWeb(webPidFile, wf.InstanceDir, wf.Auth)
		if err != nil {
			launchr.Log().Debug("error on getting server run info", "error", err)
		}

		if url != "" {
			return fmt.Errorf("another web UI is already running at %s\nPlease stop the existing server before starting a new one", url)
		}

		if foreground {
			return p.runWeb(ctx, wf)
		}

		return p.runBackgroundWeb(ctx, wf, webPidFile)
	}))
	return []*action.Action{a}, nil
}
