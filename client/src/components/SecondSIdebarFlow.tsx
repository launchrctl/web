import Box from '@mui/material/Box'
import { type FC, useEffect, useState } from 'react'

import { useAction } from '../context/ActionContext'
import { ActionsListFlow } from './ActionsListFlow'
import { FormFlow } from './FormFlow'

export type IActionsGroup = {
  id: string
  list: string[]
}

export const SecondSIdebarFlow: FC = () => {
  const [actionsGroup, setActionsGroup] = useState<IActionsGroup>({
    id: '',
    list: [],
  })
  const [actionId, setActionId] = useState('')
  const action = useAction()

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

  let content

  if (action?.type === 'action' && actionId.length > 0 && isAction()) {
    content = <FormFlow actionId={actionId} />
  } else if (action?.type === 'actions-list' && actionsGroup.list.length > 0) {
    content = <ActionsListFlow actionsGroup={actionsGroup} />
  } else {
    content = <h1>Choose something. We don't know what to place here yet</h1>
  }

  return (
    <Box
      role="presentation"
      sx={{ py: 2, overflowY: 'scroll', height: '100%' }}
    >
      {content}
    </Box>
  )
}
