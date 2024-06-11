import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
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
              <ToggleButton
                value="3"
                sx={{
                  textTransform: 'capitalize',
                  flex: 1,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                Flows
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <TabPanel value="1" sx={{ p: 2, overflowY: 'auto' }}>
            <SidebarTree actions={actions} />
          </TabPanel>
          <TabPanel value="2" sx={{ p: 2, overflowY: 'auto' }}>
            <SidebarActions actions={actions} />
          </TabPanel>
          <TabPanel value="3" sx={{ p: 2, overflowY: 'auto' }}>
            TBD
          </TabPanel>
        </Stack>
      </TabContext>
    </>
  )
}
