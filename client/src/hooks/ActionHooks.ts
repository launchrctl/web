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

export const useClearActions = () => {
  const dispatch = useActionDispatch()
  return useCallback(() => {
    dispatch?.({ type: 'clear-actions' })
  }, [dispatch])
}
