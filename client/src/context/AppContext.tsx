import { createContext, FC, ReactNode, useEffect, useState } from 'react'

import { IAction } from '../types'

interface AppState {
  runningActions: IAction[]
}

interface AppContextValue {
  appState: AppState
  addAction: (action: IAction) => void
}

export const AppContext = createContext<AppContextValue>({
  appState: { runningActions: [] },
  addAction: (action: IAction) => {
    console.warn('addAction function not yet implemented. Action:', action)
  },
})
interface AppProviderProps {
  children: ReactNode
}

const AppProvider: FC<AppProviderProps> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>({
    runningActions: [],
  })

  useEffect(() => {
    const storedState = sessionStorage.getItem('appState')
    if (storedState) {
      setAppState(JSON.parse(storedState))
    }
  }, [])

  const addAction = (action: IAction) => {
    setAppState((prevState) => {
      const existingActionIndex = prevState.runningActions.findIndex(
        (a) => a.id === action.id
      )
      if (existingActionIndex === -1) {
        const updatedRunningActions = [action, ...prevState.runningActions]
        const updatedState = {
          ...prevState,
          runningActions: updatedRunningActions,
        }
        sessionStorage.setItem('appState', JSON.stringify(updatedState))
        return updatedState
      }

      const [matchingItem] = prevState.runningActions.splice(
        existingActionIndex,
        1
      )
      prevState.runningActions.unshift(matchingItem)
      console.log(prevState)
      return prevState
    })
  }

  return (
    <AppContext.Provider value={{ appState, addAction }}>
      {children}
    </AppContext.Provider>
  )
}

export default AppProvider
