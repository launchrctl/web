import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import { Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Box from '@mui/system/Box'
import { GetListResponse } from '@refinedev/core'
import type { FC, SyntheticEvent } from 'react'
import { useState } from 'react'

import { SidebarActions } from './SidebarActions'
import { SidebarTree } from './SidebarTree'

interface ISidebarFlowProps {
  actions: GetListResponse | undefined
}

const getKeyboardShortcut = () =>
  navigator.userAgent.toLowerCase().includes('mac') ? '⌘ + K' : 'Ctrl + K'

export const SidebarFlow: FC<ISidebarFlowProps> = ({ actions }) => {
  const [value, setValue] = useState('1')

  const handleChange = (event: SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  return (
    <>
      <TabContext value={value}>
        <Stack sx={{ height: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}>
            <ToggleButtonGroup
              color="primary"
              value={value}
              exclusive
              onChange={handleChange}
              size="small"
              sx={{ display: 'flex' }}
              className={'sidebar-flow-tabs'}
            >
              <ToggleButton
                value="1"
                sx={{
                  textTransform: 'capitalize',
                  flex: 1,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                Layers
              </ToggleButton>
              <ToggleButton
                value="2"
                sx={{
                  textTransform: 'capitalize',
                  flex: 1,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                Actions
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <TabPanel value="1" sx={{ p: 2, overflowY: 'auto' }}>
            <SidebarTree actions={actions} />
          </TabPanel>
          <TabPanel value="2" sx={{ p: 2, overflowY: 'auto' }}>
            <SidebarActions actions={actions} />
          </TabPanel>
          <Box sx={{ marginBlockStart: 'auto', padding: 3 }}>
            <Typography variant="body2">
              Press {getKeyboardShortcut()} to open Search
            </Typography>
          </Box>
        </Stack>
      </TabContext>
    </>
  )
}
