import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  FC,
} from 'react'

interface State {
  id: string
}

interface Action {
  type: string
  id: string
}

interface Props {
  children: ReactNode
}

const initialState: State = {
  id: '',
}

const ActionContext = createContext<State>(initialState)
const ActionDispatchContext = createContext<React.Dispatch<Action> | null>(null)

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'set-action':
      return {
        ...state,
        id: action.id,
      }
    default:
      return state
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
