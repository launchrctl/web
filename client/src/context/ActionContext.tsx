import { createContext, Dispatch, FC, ReactNode, useReducer } from 'react'

type ActionState = 'running' | 'finished' | 'error'
type TerminalOutput = string[]

interface RunningActionDetails {
  id: string
  runId: string
  state: ActionState
  output: TerminalOutput
}

export interface State {
  id: string
  type: 'action' | 'actions-list' | 'default'
  runningActions: RunningActionDetails[]
  actionsList: {
    id: string
    title: string
    description: string
  }[]
}

export interface Action {
  type: string
  id: string
  output?: string
  actionsList: {
    id: string
    title: string
    description: string
  }[]
}

interface Props {
  children: ReactNode
}

const initialState: State = {
  id: '',
  type: 'default',
  runningActions: [],
  actionsList: []
}

export const ActionContext = createContext<State>(initialState)
export const ActionDispatchContext = createContext<Dispatch<Action> | null>(
  null
)

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'set-action': {
      return {
        ...state,
        id: action.id,
        type: 'action',
      }
    }
    case 'set-actions-list': {
      return {
        ...state,
        id: action.id,
        actionsList: action.actionsList,
        type: 'actions-list',
      }
    }
    case 'start-action': {
      return {
        ...state,
        runningActions: [
          ...state.runningActions,
          {
            id: action.id, state: 'running', output: [],
            runId: ''
          },
        ],
      }
    }
    case 'finish-action': {
      return {
        ...state,
        runningActions: state.runningActions.map((act) =>
          act.id === action.id ? { ...act, state: 'finished' } : act
        ),
      }
    }
    case 'error-action': {
      return {
        ...state,
        runningActions: state.runningActions.map((act) =>
          act.id === action.id ? { ...act, state: 'error' } : act
        ),
      }
    }
    case 'update-output': {
      return {
        ...state,
        runningActions: state.runningActions.map((act) =>
          act.id === action.id
            ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              { ...act, output: [...act.output, action.output!] }
            : act
        ),
      }
    }
    case 'clear-actions': {
      return {
        ...state,
        runningActions: [],
      }
    }
    default: {
      return {
        ...state,
        id: '',
        type: 'default',
      }
    }
  }
}

export const ActionProvider: FC<Props> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <ActionContext.Provider value={state}>
      <ActionDispatchContext.Provider value={dispatch}>
        {children}
      </ActionDispatchContext.Provider>
    </ActionContext.Provider>
  )
}
