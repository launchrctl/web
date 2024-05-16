import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import { type FC, useState, useEffect } from 'react'
import { ActionShow } from '../pages/actions/Show'
import { useAction } from '../context/ActionContext'
import { withTheme } from '@rjsf/core'
import { Theme } from '@rjsf/mui'

const Form = withTheme(Theme)

export const FormFlow: FC = () => {
  const [actionsGroup, setActionsGroup] = useState(false)
  const [actionId, setActionId] = useState('Form')
  const action = useAction()

  useEffect(() => {
    if (action?.id?.length > 0) {
      if (action.type === 'set-actions-list') {
        setActionId(`List of actions id=${action.id}`)
      } else {
        setActionId(`Action id=${action.id}`)
        setActionsGroup(true)
        return
      }
      setActionsGroup(false)
    } else {
      setActionId('Form')
      setActionsGroup(false)
    }
  }, [action])

  return (
    <Box role="presentation">
      {actionId}
      {/*{actionsGroup && (*/}
      {/*  <ActionShow actionId={action.id} actionIdentifier={'actions'} />*/}
      {/*)}*/}
    </Box>
  )
}
