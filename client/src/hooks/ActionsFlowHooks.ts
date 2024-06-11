import { useContext } from 'react'

import { FlowClickedActionIDContext } from '../context/ActionsFlowContext'

export const useFlowClickedActionID = () =>
  useContext(FlowClickedActionIDContext)
