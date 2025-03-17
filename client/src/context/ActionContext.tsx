import { createContext, Dispatch, FC, ReactNode, useReducer } from 'react'

import { components } from '../../openapi'
export interface State {
  id: string
  processes?: components['schemas']['ActionRunInfo'][]
  started?: Set<string>
  hoverId?: string
  type?: 'set-active-action' | 'set-hover-action' | 'set-process' | ''
}

export interface Action {
  id?: string
  hoverId?: string
  type?: string
  process?: components['schemas']['ActionRunInfo']
}

interface Props {
  children: ReactNode
}

const initialState: State = {
  id: '',
  processes: [],
  started: new Set(),
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
        ...state,
        id: action.id || '',
      }
    }
    case 'set-hover-action': {
      return {
        ...state,
        hoverId: action.id || '',
      }
    }
    case 'set-process': {
      if (action.process) {
        const updatedProcesses = state.processes ? [...state.processes] : []

        const existingIndex = updatedProcesses.findIndex(
          (obj) => obj.id === action.process?.id
        )

        if (existingIndex !== -1 && updatedProcesses[existingIndex]) {
          if (
            updatedProcesses[existingIndex].status !== action.process.status
          ) {
            updatedProcesses[existingIndex] = {
              ...updatedProcesses[existingIndex],
              status: action.process.status,
            }
          }
        } else {
          updatedProcesses.push(action.process)
        }

        const processId = action.process.id.split('-');
        processId.shift();
        const actionId = processId.join('-')
        return {
          ...state,
          processes: updatedProcesses,
          started: actionId ? state.started?.add(actionId) : state.started,
        }
      }
      return state
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
