import { createContext, Dispatch, FC, ReactNode, useReducer } from 'react'
import { useNotification, useSubscription } from '@refinedev/core'

import { components } from '../../openapi'
import { setStorageItem } from '../utils/helpers'
export interface State {
  id: string
  processes?: components['schemas']['ActionRunInfo'][]
  started?: Set<string>
  running: Set<string>
  currentStreams?: {
    id: string
    streams: components['schemas']['ActionRunStreamData'][]
  }[]
}

export interface Action {
  id?: string
  type?:
    | 'set-active-action'
    | 'set-process'
    | 'start-action'
    | 'stop-action'
    | 'stop-process'
    | ''
  process?: components['schemas']['ActionRunInfo']
  streams?: components['schemas']['ActionRunStreamData']
}

interface Props {
  children: ReactNode
}

const initialState: State = {
  id: '',
  processes: [],
  started: new Set(),
  running: new Set(),
  currentStreams: [],
}

export const ActionContext = createContext<State>(initialState)
export const ActionDispatchContext = createContext<Dispatch<Action> | null>(
  null
)

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'set-active-action': {
      if (action.id === state.id) {
        return state
      }
      return {
        ...state,
        id: action.id || '',
      }
    }
    case 'start-action': {
      const running = state.running ? new Set(state.running) : new Set<string>()
      const started = state.started ? new Set(state.started) : new Set<string>()
      if (action.id && !running.has(action.id)) {
        running.add(action.id)
      }
      if (action.id && !started.has(action.id)) {
        started.add(action.id)
      }
      return {
        ...state,
        running,
        started,
      }
    }
    case 'stop-action': {
      const running = state.running ? new Set(state.running) : new Set<string>()
      if (action.id) {
        running.delete(action.id)
      }
      return {
        ...state,
        running,
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
        return {
          ...state,
          processes: updatedProcesses,
        }
      }
      return state
    }
    case 'stop-process': {
      console.log('stop-process', action.process)
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
  const { open } = useNotification()
  useSubscription({
    channel: 'process',
    types: ['send-process', 'send-process-finished'],
    onLiveEvent: ({ payload, type }) => {
      if (payload?.data?.action) {
        if (type === 'send-process') {
          dispatch?.({
            type: 'set-process',
            process: {
              id: payload.data.action,
              status: payload.data.status,
            }
          })
        }
        if (type === 'send-process-finished') {
          dispatch?.({
            type: 'set-process',
            process: {
              id: payload.data.action,
              status: payload.data.status,
            }
          })

          setStorageItem(
            payload.data.action,
            payload.data.data
          )

          if (payload.data.status === 'error') {
            let errorMessage = ''
            for (const stream of payload.data.data) {
              errorMessage += stream.content
            }
            open?.({
              type: 'error',
              message: errorMessage,
              description: 'Error',
            })
          }
        }
      }
    },
  })

  useSubscription({
    channel: 'processes',
    types: ['send-processes', 'send-processes-finished'],
    onLiveEvent: ({ payload, type }) => {
      if (type === 'send-processes' && payload.data.processes) {
        // console.log('send-processes', payload?.data)
        // payload.data.processes.forEach(
        //   (process: {
        //     ID: string
        //     Status: components['schemas']['ActionRunStatus']
        //   }) => {

        //   }
        // )
      }
      if (type === 'send-processes-finished' && payload?.data?.processes) {
        dispatch?.({
          type: 'stop-action',
          id: payload.data.action,
        })
      }
    },
  })

  return (
    <ActionContext.Provider value={state}>
      <ActionDispatchContext.Provider value={dispatch}>
        {children}
      </ActionDispatchContext.Provider>
    </ActionContext.Provider>
  )
}
