import CloseIcon from '@mui/icons-material/Close'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { GetListResponse } from '@refinedev/core'
import { type FC, useEffect, useState } from 'react'

import { useActionDispatch } from '../hooks/ActionHooks'
import { useFlowClickedActionID } from '../hooks/ActionsFlowHooks'
import { useSidebarTreeItemClickStates } from '../hooks/SidebarTreeItemStatesHooks'
import { IAction } from '../types'
import { ActionsListFlow } from './ActionsListFlow'
import { FormFlow } from './FormFlow'

export type IActionsGroup = {
  id: string
  list: IAction[]
}

const isAction = (id: string) => id.split(':')[1]?.length

export const SecondSidebarFlow: FC<{
  actions: GetListResponse
  nodeId: string
}> = ({ actions, nodeId }) => {
  const [actionsGroup, setActionsGroup] = useState<IActionsGroup>({
    id: '',
    list: [],
  })
  const dispatch = useActionDispatch()
  const { flowClickedActionId, setFlowClickedActionId } =
    useFlowClickedActionID()
  const { handleUnselect } = useSidebarTreeItemClickStates()

  useEffect(() => {
    if (actions.data && nodeId && !isAction(nodeId)) {
      setActionsGroup({
        id: nodeId,
        list: Object.values(actions.data)
          .filter(
            (a) =>
              a.id &&
              typeof a.id === 'string' &&
              a.id.includes(':') &&
              a.id.startsWith(`${nodeId}`)
          )
          .map((a) => ({
            id: String(a.id),
            title: a.title,
            description: a.description,
          })),
      })
    }
  }, [actions, nodeId])

  const onClose = () => {
    dispatch?.({
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

  if (!nodeId) {
    return null
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
      {isAction(nodeId) ? (
        <FormFlow actionId={nodeId} />
      ) : (
        <ActionsListFlow actionsGroup={actionsGroup} />
      )}
    </Box>
  )
}
