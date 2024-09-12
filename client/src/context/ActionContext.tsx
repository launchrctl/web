import { createContext, Dispatch, FC, ReactNode, useReducer } from 'react'
export interface State {
  id: string
  hoverId?: string
  type?: 'set-active-action' | 'set-hover-action' | 'clear-actions' | ''
}

export interface Action {
  id?: string
  hoverId?: string
  type?: string
}

interface Props {
  children: ReactNode
}

const initialState: State = {
  id: '',
  hoverId: '',
  type: '',
}

export const ActionContext = createContext<State>(initialState)
export const ActionDispatchContext = createContext<Dispatch<Action> | null>(
  null
)

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'set-active-action': {
      return {
        id: action.id || '',
      }
    }
    case 'set-hover-action': {
      return {
        ...state,
        hoverId: action.id || '',
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
        hoverId: '',
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
