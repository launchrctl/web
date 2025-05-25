import { Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/system/Box'
import { GetListResponse } from '@refinedev/core'
import type { FC } from 'react'

import { SidebarTree } from './SidebarTree'

interface ISidebarFlowProps {
  actions: GetListResponse | undefined
}

const getKeyboardShortcut = () =>
  navigator.userAgent.toLowerCase().includes('mac') ? '⌘ + K' : 'Ctrl + K'

export const SidebarFlow: FC<ISidebarFlowProps> = ({ actions }) => {
  return (
    <Stack sx={{ height: '100%' }}>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <SidebarTree actions={actions} />
      </Box>

      <Box sx={{ marginBlockStart: 'auto', padding: 3 }}>
        <Typography variant="body2">
          Press {getKeyboardShortcut()} to open Search
        </Typography>
      </Box>
    </Stack>
  )
}
