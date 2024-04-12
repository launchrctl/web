import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Tab from '@mui/material/Tab'
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
    <Box
      sx={{
        boxShadow: 1,
        borderRadius: 2,
        p: 2,
        minWidth: 400,
      }}
    >
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange}>
            <Tab label="Layers" value="1" />
            <Tab label="Actions" value="2" />
            <Tab label="Flows" value="3" />
          </TabList>
        </Box>
        <TabPanel value="1">
          <SidebarTree actions={actions} />
        </TabPanel>
        <TabPanel value="2">
          <SidebarActions actions={actions} />
        </TabPanel>
        <TabPanel value="3">TBD</TabPanel>
      </TabContext>
    </Box>
  )
}
