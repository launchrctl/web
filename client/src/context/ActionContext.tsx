import { createContext, Dispatch, FC, ReactNode, useReducer } from 'react'
export interface State {
  id: string
  type?: 'set-actions-sidebar' | ''
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
    case 'clear-actions': {
      return {
        ...state,
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
