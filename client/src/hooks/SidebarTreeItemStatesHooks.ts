import { useContext } from 'react'

import {
  ClickStatesContext,
  MouseStatesContext,
} from '../context/SidebarTreeItemStatesContext'

export const useSidebarTreeItemClickStates = () => {
  const context = useContext(ClickStatesContext)
  return context || undefined
}

export const useSidebarTreeItemMouseStates = () => {
  const context = useContext(MouseStatesContext)
  return context || undefined
}
