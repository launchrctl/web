import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import { type FC, useState, useEffect } from 'react'
import { useAction } from '../context/ActionContext'
import { withTheme } from '@rjsf/core'
import { Theme } from '@rjsf/mui'


const Form = withTheme(Theme)

export const FormFlow: FC = () => {
  const [open, setOpen] = useState(false)
  const [actionId, setActionId] = useState('')
  const action = useAction()

  useEffect(() => {
    if (action?.id?.length > 0) {
      setOpen(true)
      setActionId(action.id)
      console.log(actionId)
    }
  }, [action])

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen)
  }

  return (
    <div>
      <Drawer open={open} onClose={toggleDrawer(false)} anchor="right">
        <Box
          sx={{ width: 350 }}
          role="presentation"
          onClick={toggleDrawer(false)}
        >
          {actionId} Form
        </Box>
      </Drawer>
    </div>
  )
}
