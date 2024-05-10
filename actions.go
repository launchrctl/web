package web

import (
	"context"
	"embed"
	"io/fs"

	"github.com/launchrctl/launchr/pkg/action"
	"github.com/launchrctl/launchr/pkg/cli"
	"gopkg.in/yaml.v3"
)

const (
	webTestAct = "web.test"
)

//go:embed actions.yaml
var actionsFs embed.FS

func (p *Plugin) addActions(actManager action.Manager) {
	data, err := fs.ReadFile(actionsFs, "actions.yaml")
	if err != nil {
		panic(err)
	}

	var cfg action.CallbackDefinitions
	err = yaml.Unmarshal(data, &cfg)
	if err != nil {
		panic(err)
	}

	definitionsMap := map[string]*action.Definition{}
	for _, v := range cfg.Definition {
		definitionsMap[v.ID] = v.Definition
	}

	actions := prepareActions(definitionsMap)
	for _, a := range actions {
		actManager.Add(a)
	}
}

func prepareActions(definitions map[string]*action.Definition) []action.Action {
	var testFunc action.ServiceCallbackFunc = func(ctx context.Context, input action.Input) error {
		cli.Println("Executing example function...")
		cli.Println("%v", input)
		input.IO.Out().Write([]byte("test"))

		return nil
	}

	var testAction action.Action = action.NewCallbackAction(webTestAct, definitions[webTestAct], testFunc)

	return []action.Action{testAction}
}
