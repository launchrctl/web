package server

import (
	"context"
	"sync"
)

// StateManager is a definition of manager for actions states
type StateManager struct {
	// @todo merge state into action manager
	actionState map[string]*ActionState
	mx          sync.Mutex
}

// NewStateManager constructs a new state manager.
func NewStateManager() *StateManager {
	return &StateManager{
		actionState: make(map[string]*ActionState),
	}
}

func (m *StateManager) registerState(id string) *ActionState {
	m.mx.Lock()
	defer m.mx.Unlock()

	ctx, cancel := context.WithCancel(context.Background())

	as := &ActionState{
		id:           id,
		context:      ctx,
		cancelSwitch: cancel,
	}
	m.actionState[id] = as

	return as
}

func (m *StateManager) removeActionState(id string) {
	m.mx.Lock()
	defer m.mx.Unlock()
	delete(m.actionState, id)
}

func (m *StateManager) actionStateByID(id string) (*ActionState, bool) {
	m.mx.Lock()
	defer m.mx.Unlock()
	ri, ok := m.actionState[id]
	return ri, ok
}

// ActionState defines running action state
type ActionState struct {
	id           string
	context      context.Context
	cancelSwitch context.CancelFunc
}
