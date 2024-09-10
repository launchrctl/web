import { createContext, FC, ReactNode, useEffect, useState } from 'react'

import { components } from '../../openapi'

interface AppState {
  runnedActions: components['schemas']['ActionShort'][]
}

interface AppContextValue {
  appState: AppState
  addAction: (action: components['schemas']['ActionShort']) => void
}

export const AppContext = createContext<AppContextValue>({
  appState: { runnedActions: [] },
  addAction: (action: components['schemas']['ActionShort']) => {
    console.warn('addAction function not yet implemented. Action:', action)
  },
})
interface AppProviderProps {
  children: ReactNode
}

const AppProvider: FC<AppProviderProps> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>({
    runnedActions: [],
  })

  useEffect(() => {
    const storedState = sessionStorage.getItem('appState')
    if (storedState) {
      setAppState(JSON.parse(storedState))
    }
  }, [])

  const addAction = (action: components['schemas']['ActionShort']) => {
    setAppState((prevState) => {
      const existingActionIndex = prevState.runnedActions.findIndex(
        (a) => a.id === action.id
      )
      if (existingActionIndex === -1) {
        const updatedrunnedActions = [action, ...prevState.runnedActions]
        const updatedState = {
          ...prevState,
          runnedActions: updatedrunnedActions,
        }
        sessionStorage.setItem('appState', JSON.stringify(updatedState))
        return updatedState
      }

      const [matchingItem] = prevState.runnedActions.splice(
        existingActionIndex,
        1
      )
      if (matchingItem) {
        prevState.runnedActions.unshift(matchingItem)
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
