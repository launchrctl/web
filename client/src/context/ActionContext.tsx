import { createContext, Dispatch, FC, ReactNode, useReducer } from 'react'
import { useSubscription } from '@refinedev/core'

import { components } from '../../openapi'
import { splitRunId } from '../utils/helpers'
export interface State {
  id: string
  processes?: components['schemas']['ActionRunInfo'][]
  started?: Set<string>
  running: Set<string>
  proc: {
    created: Set<string>
    running: Set<string>
    finished: Set<string>
    error: Set<string>
  }
}

export interface Action {
  id?: string
  type?:
    | 'set-active-action'
    | 'set-process'
    | 'change-process-state'
    | 'start-action'
    | 'stop-action'
    | ''
  process?: components['schemas']['ActionRunInfo']
}

interface Props {
  children: ReactNode
}

const initialState: State = {
  id: '',
  processes: [],
  started: new Set(),
  running: new Set(),
  proc: {
    created: new Set(),
    running: new Set(),
    finished: new Set(),
    error: new Set(),
  },
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
      if (action.id) {
        running.add(action.id)
      }
      return {
        ...state,
        running,
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
    case 'change-process-state': {
      const processId = action.process?.id
      const status = action.process?.status

      if (!processId || !status) {
        return state
      }
      const updatedProcesses: State['proc'] = state.proc
        ? { ...state.proc }
        : {
            created: new Set(),
            running: new Set(),
            finished: new Set(),
            error: new Set(),
          }

      if (updatedProcesses[status].has(processId)) {
        return state
      }

      Object.keys(updatedProcesses).forEach((key) => {
        ;(updatedProcesses[key as keyof State['proc']] as Set<string>).delete(
          processId
        )
      })
      updatedProcesses[status].add(processId)

      return {
        ...state,
        proc: updatedProcesses,
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
        const actionId = splitRunId(action.process.id).id
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
      }
    }
  }
}

export const ActionProvider: FC<Props> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  useSubscription({
    channel: 'process',
    types: ['send-process', 'send-process-finished'],
    onLiveEvent: ({ payload, type }) => {
      if (payload?.data?.action) {
        if (type === 'send-process') {
          console.log('send-process', payload?.data)
        }
        if (type === 'send-process-finished') {
          // console.log('send-process-finished', payload?.data)
          //   publish({
          //     channel: 'process',
          //     type: 'process-finished',
          //     payload: { actionId: payload.data.action },
          //     date: new Date(),
          //   })
        }
      }
    },
  })

  useSubscription({
    channel: 'processes',
    types: ['send-processes', 'send-processes-finished'],
    onLiveEvent: ({ payload, type }) => {
      if (type === 'send-processes' && payload.data.processes) {
        payload.data.processes.forEach(
          (process: {
            ID: string
            Status: components['schemas']['ActionRunStatus']
          }) => {
            if (state.proc?.[process.Status]?.has(process.ID)) {
              return
            }
            // dispatch?.({
            //   type: 'change-process-state',
            //   process: {
            //     id: process.ID,
            //     status: process.Status,
            //   },
            // })
          }
        )
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
