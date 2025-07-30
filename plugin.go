// Package web provides a launchr plugin with Web UI for launchr.
package web

import (
	"context"
	_ "embed"
	"fmt"
	"os"
	"path/filepath"
	"time"

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

	// API only related flags.
	NoUI             bool
	TokensDir        string
	TokensPassphrase string

	// Common Web flags.
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
	pluginDir := p.cfg.Path(pluginName)
	aw := action.NewFromYAML("web", actionWebYaml)
	aw.SetRuntime(action.NewFnRuntime(func(ctx context.Context, a *action.Action) error {
		instanceDir := p.cfg.Path(pluginName, runningInstanceDir)
		webPidFile := filepath.Join(instanceDir, pidFile)
		input := a.Input()

		tokensDir := input.Opt("tokens-dir").(string)
		if tokensDir == "" {
			tokensDir = pluginDir
		}

		wf := webFlags{
			NoUI:             input.Opt("no-ui").(bool),
			TokensPassphrase: input.Opt("passphrase").(string),
			InstanceDir:      instanceDir,
			TokensDir:        tokensDir,
			Port:             input.Opt("port").(int),
			IsPortSet:        input.IsOptChanged("port"),
			ProxyClient:      input.Opt("proxy-client").(string),
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
		tokensDir := input.Opt("tokens-dir").(string)
		if tokensDir == "" {
			tokensDir = pluginDir
		}
		passphrase := input.Opt("passphrase").(string)
		tokenStore, err := server.NewTokenStore(tokensDir, passphrase)
		if err != nil {
			return fmt.Errorf("failed to initialize token store: %w", err)
		}

		logger, _ := getActionLoggers(a)
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

	return []*action.Action{at, aw}, nil
}

func createToken(store *server.TokenStore, a *action.Action) error {
	_, term := getActionLoggers(a)
	name := a.Input().Arg("token").(string)
	if name == "" {
		return fmt.Errorf("token name is required")
	}

	var expiresIn *time.Duration
	if !a.Input().Opt("no-expiration").(bool) {
		expiresInStr := a.Input().Opt("expires-in").(string)
		if expiresInStr != "" {
			duration, err := time.ParseDuration(expiresInStr)
			if err != nil {
				return fmt.Errorf("invalid expiration duration: %w", err)
			}
			expiresIn = &duration
		} else {
			// Default expiration (e.g., 30 days)
			defaultDuration := 30 * 24 * time.Hour
			expiresIn = &defaultDuration
		}
	}

	token, err := store.CreateToken(name, expiresIn)
	if err != nil {
		return fmt.Errorf("failed to create token: %w", err)
	}

	term.Success().Printfln("Token created successfully!")
	term.Info().Printfln("Name: %s", token.Name)
	term.Info().Printfln("Token: %s", token.Token)
	if token.ExpiresAt != nil {
		term.Info().Printfln("Expires: %s", token.ExpiresAt.Format("2006-01-02 15:04:05"))
	} else {
		term.Info().Printfln("Expires: Never")
	}

	return nil
}

func listTokens(store *server.TokenStore, a *action.Action) error {
	_, term := getActionLoggers(a)

	tokens := store.ListTokens()
	revealTokens := a.Input().Opt("reveal-tokens").(bool)

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

		tokenDisplay := token.Token[:10] + "..."
		if revealTokens {
			tokenDisplay = token.Token
		}

		term.Info().Printfln("  • %s (%s)", token.Name, status)
		term.Info().Printfln("    Token: %s", tokenDisplay)
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
	_, term := getActionLoggers(a)

	tokenOrName := a.Input().Arg("token").(string)
	if tokenOrName == "" {
		return fmt.Errorf("token or name is required")
	}

	if store.RevokeToken(tokenOrName) {
		term.Success().Printfln("Token '%s' has been revoked.", tokenOrName)
	} else {
		term.Error().Printfln("Token '%s' not found.", tokenOrName)
	}

	return nil
}

func deleteToken(store *server.TokenStore, a *action.Action) error {
	_, term := getActionLoggers(a)

	tokenOrName := a.Input().Arg("token").(string)
	if tokenOrName == "" {
		return fmt.Errorf("token or name is required")
	}

	if store.DeleteToken(tokenOrName) {
		term.Success().Printfln("Token '%s' has been deleted.", tokenOrName)
	} else {
		term.Error().Printfln("Token '%s' not found.", tokenOrName)
	}

	return nil
}

func purgeTokens(store *server.TokenStore, a *action.Action) error {
	_, term := getActionLoggers(a)
	exp, rem := store.PurgeInactiveTokens()
	if exp > 0 {
		term.Success().Printfln("Expired tokens: %d", exp)
	}
	if rem > 0 {
		term.Success().Printfln("Revoked tokens purged: %d", rem)
	}

	return nil
}
