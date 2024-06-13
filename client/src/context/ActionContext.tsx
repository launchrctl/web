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
  type?: 'set-actions-sidebar' | ''
  runningActions?: RunningActionDetails[]
}

export interface Action {
  id?: string
  type?: string
  output?: string
}

interface Props {
  children: ReactNode
}

const initialState: State = {
  id: '',
  type: '',
  runningActions: [],
}

export const ActionContext = createContext<State>(initialState)
export const ActionDispatchContext = createContext<Dispatch<Action> | null>(
  null
)

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'set-actions-sidebar': {
      return {
        id: action.id || '',
      }
    }
    case 'start-action': {
      return {
        ...state,
        runningActions: [
          ...(state.runningActions ?? []),
          {
            id: action.id as string,
            state: 'running',
            output: [],
            runId: '',
          },
        ],
      }
    }
    case 'finish-action': {
      return {
        ...state,
        runningActions: state.runningActions
          ? state.runningActions.map((act) =>
              act.id === action.id ? { ...act, state: 'finished' } : act
            )
          : [],
      }
    }
    case 'error-action': {
      return {
        ...state,
        runningActions: state.runningActions
          ? state.runningActions.map((act) =>
              act.id === action.id ? { ...act, state: 'error' } : act
            )
          : [],
      }
    }
    case 'update-output': {
      return {
        ...state,
        runningActions: state.runningActions
          ? state.runningActions.map((act) =>
              act.id === action.id
                ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  { ...act, output: [...act.output, action.output!] }
                : act
            )
          : [],
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
