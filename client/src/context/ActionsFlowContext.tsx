import { createContext, useState } from 'react'

export const FlowClickedActionIDContext = createContext()

interface State {
  id: string
  isActive: boolean
}

export const FlowClickedActionIDProvider = ({ children }) => {
  const [flowClickedActionId, setFlowClickedActionId] = useState<State>({
    id: '',
    isActive: false,
  })

  return (
    <FlowClickedActionIDContext.Provider
      value={{ flowClickedActionId, setFlowClickedActionId }}
    >
      {children}
    </FlowClickedActionIDContext.Provider>
  )
}
