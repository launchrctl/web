import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  FC,
  useCallback,
} from 'react'

type ActionState = 'running' | 'finished' | 'error'
type TerminalOutput = string[]

interface ActionDetails {
  id: string
  state: ActionState
  output: TerminalOutput
}

interface State {
  id: string
  type: 'action' | 'actions-list' | 'default'
  runningActions: ActionDetails[]
}

interface Action {
  type: string
  id: string
  output?: string
}

interface Props {
  children: ReactNode
}

const initialState: State = {
  id: '',
  type: 'default',
  runningActions: [],
}

const ActionContext = createContext<State>(initialState)
const ActionDispatchContext = createContext<React.Dispatch<Action> | null>(null)

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'set-action':
      return {
        ...state,
        id: action.id,
        type: 'action',
      }
    case 'set-actions-list':
      return {
        ...state,
        id: action.id,
        type: 'actions-list',
      }
    case 'start-action':
      return {
        ...state,
        runningActions: [
          ...state.runningActions,
          { id: action.id, state: 'running', output: [] },
        ],
      }
    case 'finish-action':
      return {
        ...state,
        runningActions: state.runningActions.map((act) =>
          act.id === action.id ? { ...act, state: 'finished' } : act
        ),
      }
    case 'error-action':
      return {
        ...state,
        runningActions: state.runningActions.map((act) =>
          act.id === action.id ? { ...act, state: 'error' } : act
        ),
      }
    case 'update-output':
      return {
        ...state,
        runningActions: state.runningActions.map((act) =>
          act.id === action.id
            ? { ...act, output: [...act.output, action.output!] }
            : act
        ),
      }
    case 'clear-actions':
      return {
        ...state,
        runningActions: [],
      }
    default:
      return {
        ...state,
        id: '',
        type: 'default',
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

export const useAction = (): State => useContext(ActionContext)
export const useActionDispatch = (): React.Dispatch<Action> | null =>
  useContext(ActionDispatchContext)

// Custom hooks for easier usage
export const useStartAction = () => {
  const dispatch = useActionDispatch()
  return useCallback(
    (id: string) => {
      dispatch?.({ type: 'start-action', id })
    },
    [dispatch]
  )
}

export const useFinishAction = () => {
  const dispatch = useActionDispatch()
  return useCallback(
    (id: string) => {
      dispatch?.({ type: 'finish-action', id })
    },
    [dispatch]
  )
}

export const useErrorAction = () => {
  const dispatch = useActionDispatch()
  return useCallback(
    (id: string) => {
      dispatch?.({ type: 'error-action', id })
    },
    [dispatch]
  )
}

export const useUpdateOutput = () => {
  const dispatch = useActionDispatch()
  return useCallback(
    (id: string, output: string) => {
      dispatch?.({ type: 'update-output', id, output })
    },
    [dispatch]
  )
}

export const useClearActions = () => {
  const dispatch = useActionDispatch()
  return useCallback(() => {
    dispatch?.({ type: 'clear-actions' })
  }, [dispatch])
}
