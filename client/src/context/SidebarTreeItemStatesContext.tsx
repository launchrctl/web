import { createContext, type FC, type ReactNode, useState } from 'react'

type ItemId = string

interface MouseItemProps {
  id: ItemId
  isHovered: boolean
  useDebounce: boolean
}

interface ClickItemProps {
  id: ItemId
  isActive: boolean
  isActionsGroup: boolean
}

interface ISidebarTreeItemClickStatesContext {
  state: ClickItemProps | undefined
  handleSelect: (id: ItemId, isActionsGroup?: boolean) => void
  handleUnselect: (id: ItemId, isActionsGroup?: boolean) => void
}

interface ISidebarTreeItemMouseStatesContext {
  state: MouseItemProps | undefined
  handleMouseEnter: (id: ItemId) => void
  handleMouseLeave: (id: ItemId, useDebounce?: boolean) => void
}

interface Props {
  children: ReactNode
}

export const ClickStatesContext =
  createContext<ISidebarTreeItemClickStatesContext>({
    state: undefined,
    handleSelect: () => {
      /* nothing */
    },
    handleUnselect: () => {
      /* nothing */
    },
  })

export const MouseStatesContext =
  createContext<ISidebarTreeItemMouseStatesContext>({
    state: undefined,
    handleMouseEnter: () => {
      /* nothing */
    },
    handleMouseLeave: () => {
      /* nothing */
    },
  })

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
