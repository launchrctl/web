import { createContext, FC, ReactNode, useEffect, useState } from 'react'

import { components } from '../../openapi'

interface AppState {
  runningActions: components['schemas']['ActionShort'][]
}

interface AppContextValue {
  appState: AppState
  addAction: (action: components['schemas']['ActionShort']) => void
}

export const AppContext = createContext<AppContextValue>({
  appState: { runningActions: [] },
  addAction: (action: components['schemas']['ActionShort']) => {
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

  const addAction = (action: components['schemas']['ActionShort']) => {
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
      if (matchingItem) {
        prevState.runningActions.unshift(matchingItem)
      }

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
