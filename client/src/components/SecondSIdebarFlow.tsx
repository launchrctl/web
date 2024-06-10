import CloseIcon from '@mui/icons-material/Close'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { type FC, useEffect, useState } from 'react'

import { useActionDispatch } from '../hooks/ActionHooks'
import { useFlowClickedActionID } from '../hooks/ActionsFlowHooks'
import { useSidebarTreeItemClickStates } from '../hooks/SidebarTreeItemStatesHooks'
import { ActionsListFlow } from './ActionsListFlow'
import { FormFlow } from './FormFlow'

export type IActionsGroup = {
  id: string
  list: string[]
}

export const SecondSIdebarFlow: FC = ({ action }) => {
  const [actionsGroup, setActionsGroup] = useState<IActionsGroup>({
    id: '',
    list: [],
  })
  const [actionId, setActionId] = useState('')
  const dispatch = useActionDispatch()
  const { flowClickedActionId, setFlowClickedActionId } =
    useFlowClickedActionID()
  const { handleUnselect } = useSidebarTreeItemClickStates()
  const isAction = () => actionId.split(':')[1]?.length

  useEffect(() => {
    if (action?.type === 'action' && action?.id?.length > 0) {
      setActionId(action.id)
    } else if (
      action?.type === 'actions-list' &&
      action?.id?.length > 0 &&
      action?.actionsList?.length
    ) {
      setActionsGroup({
        id: action.id,
        list: action.actionsList,
      })
    }
  }, [action])

  const onClose = () => {
    dispatch({
      type: 'default',
      id: '',
    })
    if (flowClickedActionId) {
      setFlowClickedActionId({
        ...flowClickedActionId,
        isActive: false,
      })
      handleUnselect(flowClickedActionId.id)
    }
  }

  let content

  if (action?.type === 'action' && actionId.length > 0 && isAction()) {
    content = <FormFlow actionId={actionId} />
  } else if (action?.type === 'actions-list' && actionsGroup.list.length > 0) {
    content = <ActionsListFlow actionsGroup={actionsGroup} />
  } else {
    return
  }

  return (
    <Box
      role="presentation"
      sx={{ py: 2, overflowY: 'scroll', height: '100%', position: 'relative' }}
    >
      <IconButton
        size="small"
        onClick={() => onClose()}
        sx={{
          position: 'absolute',
          right: 8,
          top: 11,
          zIndex: 1,
        }}
      >
        <CloseIcon />
      </IconButton>
      {content}
    </Box>
  )
}
