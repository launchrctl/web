import {
  createContext,
  Dispatch,
  FC,
  type ReactNode,
  SetStateAction,
  useState,
} from 'react'

interface State {
  id: string
  isActive: boolean
}

interface FlowClickedActionIDContextType {
  flowClickedActionId: State
  setFlowClickedActionId: Dispatch<SetStateAction<State>>
}

export const FlowClickedActionIDContext =
  createContext<FlowClickedActionIDContextType>({
    flowClickedActionId: {
      id: '',
      isActive: false,
    },
    setFlowClickedActionId: () => {
      // default function
    },
  })

export const FlowClickedActionIDProvider: FC<{
  children: ReactNode
}> = ({ children }) => {
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
