import { Dispatch, useCallback, useContext } from 'react'

import {
  Action,
  ActionContext,
  ActionDispatchContext,
  State,
} from '../context/ActionContext'

export const useAction = (): State => useContext(ActionContext)
export const useActionDispatch = (): Dispatch<Action> | null =>
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
