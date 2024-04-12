import { type ReactNode, createContext, useContext, useReducer, type FC } from 'react'

interface Props {
  children: ReactNode
}

export const ActionContext = createContext("")

export const ActionDispatchContext = createContext(null)

const reducer = (state: { id: string }, action: { type: string; id: string }) => {
  if (action?.type === 'set-action' && action.id) {
    return {
      id: action.id
    };
  }
}

export const ActionProvider:FC<Props> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { id: ""})

  return (
    <ActionContext.Provider value={state}>
      <ActionDispatchContext.Provider value={dispatch}>
        {children}
      </ActionDispatchContext.Provider>
    </ActionContext.Provider>
  )
}

export function useAction() {
  return useContext(ActionContext)
}

export function useActionDispatch() {
  return useContext(ActionDispatchContext)
}

