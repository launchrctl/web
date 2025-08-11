// Package web provides a launchr plugin with Web UI for launchr.
package web

import (
	"context"
	_ "embed"
	"fmt"
	"os"
	"path/filepath"
	"time"

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

//go:embed action.web.yaml
var actionWebYaml []byte

//go:embed action.token.yaml
var actionWebTokenYaml []byte

//go:embed ui-schema.default.yaml
var defaultUISchema []byte

func init() {
	launchr.RegisterPlugin(&Plugin{})
}

// Plugin is [launchr.Plugin] providing web ui.
type Plugin struct {
	app launchr.App
}

// PluginInfo implements [launchr.Plugin] interface.
func (p *Plugin) PluginInfo() launchr.PluginInfo {
	return launchr.PluginInfo{}
}

// OnAppInit implements [launchr.OnAppInitPlugin] interface.
func (p *Plugin) OnAppInit(app launchr.App) error {

	p.app = app
	return nil
}

type webFlags struct {
	action.WithLogger
	action.WithTerm

	// Common Web flags.
	NoUI            bool
	Port            int
	IsPortSet       bool
	ProxyClient     string
	InstanceDir     string
	WebCustomize    server.WebCustomize
	DefaultUISchema []byte
}

// DiscoverActions implements [launchr.ActionDiscoveryPlugin] interface.
func (p *Plugin) DiscoverActions(_ context.Context) ([]*action.Action, error) {
	var cfg launchr.Config
	var k keyring.Keyring

	p.app.GetService(&cfg)
	p.app.GetService(&k)

	aw := action.NewFromYAML("web", actionWebYaml)
	aw.SetRuntime(action.NewFnRuntime(func(ctx context.Context, a *action.Action) error {
		instanceDir := cfg.Path(pluginName, runningInstanceDir)
		webPidFile := filepath.Join(instanceDir, pidFile)
		input := a.Input()

		wf := webFlags{
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
		err := cfg.Get("web.excluded_actions", &excludedActions)
		if err != nil {
			return err
		}
		for _, ea := range excludedActions {
			wf.WebCustomize.ExcludedActions[ea] = true
		}

		var variables map[string]any
		err = cfg.Get("web.variables", &variables)
		if err != nil {
			return err
		}
		if variables != nil {
			wf.WebCustomize.Variables = variables
		}

		log, term := action.GetLoggerAndTerminal(a)
		wf.SetLogger(log)
		wf.SetTerm(term)

		foreground := input.Opt("foreground").(bool)
		// Override client assets.
		clientAssets := input.Opt("ui-assets").(string)
		if clientAssets != "" {
			path := launchr.MustAbs(clientAssets)
			_, err = os.Stat(path)
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

		url, err := getExistingWeb(webPidFile, wf.InstanceDir)
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

	at := action.NewFromYAML("web-token", actionWebTokenYaml)
	at.SetRuntime(action.NewFnRuntime(func(_ context.Context, a *action.Action) error {
		input := a.Input()
		operation := input.Arg("operation")

		tokenStore, err := server.NewTokenStore(k)
		if err != nil {
			return fmt.Errorf("failed to initialize token store: %w", err)
		}

		logger, _ := action.GetLoggerAndTerminal(a)
		tokenStore.SetLogger(logger)

		switch operation {
		case "create":
			return createToken(tokenStore, a)
		case "list":
			return listTokens(tokenStore, a)
		case "revoke":
			return revokeToken(tokenStore, a)
		case "delete":
			return deleteToken(tokenStore, a)
		case "purge":
			return purgeTokens(tokenStore, a)
		default:
			return fmt.Errorf("unknown operation: %s", operation)
		}
	}))

	return []*action.Action{aw, at}, nil
}

func createToken(store *server.TokenStore, a *action.Action) error {
	_, term := action.GetLoggerAndTerminal(a)
	name := a.Input().Arg("name").(string)
	if name == "" {
		return fmt.Errorf("token name is required")
	}
	size := a.Input().Arg("size").(int)

	var expiresIn *time.Duration
	expiresInStr := a.Input().Opt("expires-in").(string)
	if expiresInStr != "0" {
		if expiresInStr == "" {
			// Default expiration (e.g., 30 days)
			defaultDuration := 30 * 24 * time.Hour
			expiresIn = &defaultDuration
		} else {
			duration, err := server.ParseDurationWithDays(expiresInStr)
			if err != nil {
				return fmt.Errorf("invalid expiration duration: %w", err)
			}
			expiresIn = &duration
		}
	}

	token, info, err := store.CreateToken(name, size, expiresIn)
	if err != nil {
		return fmt.Errorf("failed to create token: %w", err)
	}

	term.Success().Printfln("Token created successfully!")
	term.Info().Printfln("Name: %s", info.Name)
	term.Info().Printfln("Token: %s", token)
	term.Warning().Printfln("Save this token in a safe place. It will not be shown again.")
	if info.ExpiresAt != nil {
		term.Info().Printfln("Expires: %s", info.ExpiresAt.Format("2006-01-02 15:04:05"))
	} else {
		term.Info().Printfln("Expires: Never")
	}

	return nil
}

func listTokens(store *server.TokenStore, a *action.Action) error {
	_, term := action.GetLoggerAndTerminal(a)

	tokens := store.ListTokens()
	if len(tokens) == 0 {
		term.Info().Println("No tokens found.")
		return nil
	}

	term.Info().Printfln("Found %d token(s):", len(tokens))
	for _, token := range tokens {
		status := "Active"
		if !token.Active {
			status = "Revoked"
		}

		term.Info().Printfln("  • %s (%s)", token.Name, status)
		term.Info().Printfln("    Created: %s", token.CreatedAt.Format("2006-01-02 15:04:05"))
		if token.ExpiresAt != nil {
			term.Info().Printfln("    Expires: %s", token.ExpiresAt.Format("2006-01-02 15:04:05"))
		} else {
			term.Info().Printfln("    Expires: Never")
		}

		term.Info().Println()
	}

	return nil
}

func revokeToken(store *server.TokenStore, a *action.Action) error {
	_, term := action.GetLoggerAndTerminal(a)

	name := a.Input().Arg("name").(string)
	if name == "" {
		return fmt.Errorf("token name is required")
	}

	if store.RevokeToken(name) {
		term.Success().Printfln("Token '%s' has been revoked.", name)
	} else {
		term.Error().Printfln("Token '%s' not found.", name)
	}

	return nil
}

func deleteToken(store *server.TokenStore, a *action.Action) error {
	_, term := action.GetLoggerAndTerminal(a)

	name := a.Input().Arg("name").(string)
	if name == "" {
		return fmt.Errorf("token name is required")
	}

	if store.DeleteToken(name) {
		term.Success().Printfln("Token '%s' has been deleted.", name)
	} else {
		term.Error().Printfln("Token '%s' not found.", name)
	}

	return nil
}

func purgeTokens(store *server.TokenStore, a *action.Action) error {
	_, term := action.GetLoggerAndTerminal(a)
	exp, rem := store.PurgeInactiveTokens()
	if exp > 0 {
		term.Success().Printfln("Expired tokens: %d", exp)
	}
	if rem > 0 {
		term.Success().Printfln("Revoked tokens purged: %d", rem)
	}

	return nil
}
