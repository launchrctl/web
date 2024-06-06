import Box from '@mui/material/Box'
import { type FC, useState, useEffect } from 'react'
import { useAction } from '../context/ActionContext'
import { withTheme } from '@rjsf/core'
import { Theme } from '@rjsf/mui'
import { FormFlow } from './FormFlow'
import { ActionsListFlow } from './ActionsListFlow'

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
      action?.actionsListIds?.length
    ) {
      setActionsGroup({
        id: action.id,
        list: action.actionsListIds,
      })
    }
  }, [action])

  let content

  if (action?.type === 'action' && actionId.length && isAction()) {
    content = <FormFlow actionId={actionId} />
  } else if (action?.type === 'actions-list' && actionsGroup.list.length > 0) {
    content = <ActionsListFlow actionsGroup={actionsGroup} />
  } else {
    content = <h1>Default</h1>
  }

  return (
    <Box role="presentation" sx={{ p: 2, overflowY: 'scroll', height: '100%' }}>
      {content}
    </Box>
  )
}
