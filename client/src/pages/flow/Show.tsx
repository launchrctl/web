import { useList } from '@refinedev/core'
import { type FC } from 'react'
import { ActionProvider } from '../../context/ActionContext'
import { SidebarTreeItemStatesProvider } from '../../context/SidebarTreeItemStatesContext'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'

import { ActionsFlow } from '../../components/ActionsFlow'
import { SecondSIdebarFlow } from '../../components/SecondSIdebarFlow'
import { SidebarFlow } from '../../components/SidebarFlow'

export const FlowShow: FC = () => {
  const { data: actions } = useList({
    resource: 'actions',
  })
  return (
    <ActionProvider>
      <SidebarTreeItemStatesProvider>
        <Grid
          container
          sx={{ height: 'calc(100vh - 68px)' }}
          columns={{ xs: 36 }}
        >
          <Grid item xs={7} sx={{ height: 'calc(100vh - 68px)' }}>
            <SidebarFlow actions={actions} />
          </Grid>
          <Grid item xs={21} sx={{ height: 'calc(100vh - 68px)' }}>
            <ActionsFlow actions={actions} />
          </Grid>
          <Grid item xs={8} sx={{ height: 'calc(100vh - 68px)' }}>
            <SecondSIdebarFlow />
          </Grid>
        </Grid>
      </SidebarTreeItemStatesProvider>
    </ActionProvider>
  )
}
