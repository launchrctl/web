import { createContext, useState, useContext } from 'react'

const FlowClickedActionIDContext = createContext()

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

export const useFlowClickedActionID = () =>
  useContext(FlowClickedActionIDContext)
