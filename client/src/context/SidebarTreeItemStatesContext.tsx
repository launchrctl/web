import {
  createContext,
  useContext,
  useState,
  type FC,
  type ReactNode,
} from 'react'

type ItemId = string

interface MouseItemProps {
  id: ItemId
  isHovered: boolean
  useDebounce: true
}

interface ClickItemProps {
  id: ItemId
  isActive: boolean
  isActionsGroup: boolean
}

interface ISidebarTreeItemClickStatesContext {
  state: ClickItemProps
  handleSelect: (id: ItemId) => void
  handleUnselect: (id: ItemId) => void
}

interface ISidebarTreeItemMouseStatesContext {
  state: MouseItemProps
  handleMouseEnter: (id: ItemId) => void
  handleMouseLeave: (id: ItemId) => void
}

interface Props {
  children: ReactNode
}

const ClickStatesContext =
  createContext<ISidebarTreeItemClickStatesContext>(null)

const MouseStatesContext =
  createContext<ISidebarTreeItemMouseStatesContext>(null)

export const SidebarTreeItemClickStatesProvider: FC<Props> = ({ children }) => {
  const [state, setState] = useState<ClickItemProps>({
    isActive: false,
    id: '',
    isActionsGroup: false,
  })

  const handleSelect = (id: string, isActionsGroup = false) => {
    setState((prev) => {
      return {
        ...prev,
        id,
        isActive: true,
        isActionsGroup,
      }
    })
  }

  const handleUnselect = (id: string, isActionsGroup = false) => {
    setState((prev) => ({
      ...prev,
      id,
      isActive: false,
      isActionsGroup,
    }))
  }

  return (
    <ClickStatesContext.Provider
      value={{
        state,
        handleSelect,
        handleUnselect,
      }}
    >
      {children}
    </ClickStatesContext.Provider>
  )
}

export const SidebarTreeItemMouseStatesProvider: FC<Props> = ({ children }) => {
  const [state, setState] = useState<MouseItemProps>({
    isHovered: false,
    id: '',
    useDebounce: true,
  })

  const handleMouseEnter = (id: string) => {
    setState((prev) => {
      return {
        ...prev,
        id,
        isHovered: true,
        useDebounce: true,
      }
    })
  }

  const handleMouseLeave = (id: string, useDebounce = true) => {
    setState((prev) => {
      return {
        ...prev,
        id,
        isHovered: false,
        useDebounce,
      }
    })
  }

  return (
    <MouseStatesContext.Provider
      value={{
        state,
        handleMouseEnter,
        handleMouseLeave,
      }}
    >
      {children}
    </MouseStatesContext.Provider>
  )
}

export const useSidebarTreeItemClickStates = () => {
  const context = useContext(ClickStatesContext)
  return context || undefined
}

export const useSidebarTreeItemMouseStates = () => {
  const context = useContext(MouseStatesContext)
  return context || undefined
}
