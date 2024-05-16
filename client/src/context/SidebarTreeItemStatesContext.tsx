import {
  createContext,
  useContext,
  useState,
  type FC,
  type ReactNode,
} from 'react'

type ItemId = string

interface ItemProps {
  isHovered: boolean
  isActive: boolean
  id: ItemId
}

interface ISidebarTreeItemStatesContext {
  state: ItemProps
  handleSelect: (id: ItemId) => void
  handleUnselect: (id: ItemId) => void
  handleMouseEnter: (id: ItemId) => void
  handleMouseLeave: (id: ItemId) => void
}

interface Props {
  children: ReactNode
}

const StatesContext = createContext<ISidebarTreeItemStatesContext>(null)

export const SidebarTreeItemStatesProvider: FC<Props> = ({ children }) => {
  const [state, setState] = useState<ItemProps>({
    isHovered: false,
    isActive: false,
    id: '',
  })

  const handleSelect = (id: string) => {
    setState((prev) => {
      return {
        ...prev,
        id,
        isActive: true,
      }
    })
  }

  const handleUnselect = (id: string) => {
    setState((prev) => ({
      ...prev,
      id,
      isActive: false,
    }))
  }

  const handleMouseEnter = (id: string) => {
    setState((prev) => {
      return {
        ...prev,
        id,
        isHovered: true,
      }
    })
  }

  const handleMouseLeave = (id: string) => {
    setState((prev) => ({
      ...prev,
      id,
      isHovered: false,
    }))
  }

  return (
    <StatesContext.Provider
      value={{
        state,
        handleSelect,
        handleUnselect,
        handleMouseEnter,
        handleMouseLeave,
      }}
    >
      {children}
    </StatesContext.Provider>
  )
}

export const useSidebarTreeItemStates = () => {
  const context = useContext(StatesContext)
  return context || undefined
}
