import Grid from '@mui/material/Grid2'
import { useList } from '@refinedev/core'
import { components } from '../../../openapi'
import { ActionsFlow } from '../../components/ActionsFlow'
import { SecondSidebarFlow } from '../../components/SecondSidebarFlow'
import { SidebarFlow } from '../../components/SidebarFlow'
import { Box } from '@mui/system'

export const FlowShow = () => {
  const { data: actions, isLoading } = useList<components['schemas']['ActionShort']>({
    resource: 'actions',
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!actions) {
    return null
  }

  return (
    <Grid container sx={{ height: 'calc(100vh - 68px)' }} columns={{ xs: 36 }}>
      <Grid size={7} sx={{ height: 'calc(100vh - 68px)' }}>
        <SidebarFlow actions={actions} />
      </Grid>
      <Grid size={29} sx={{ height: 'calc(100vh - 68px)' }}>
        <ActionsFlow actions={actions} />
      </Grid>
      <Box sx={{ height: 'calc(100vh - 68px)', position: 'fixed', right: 0 }}>
        <SecondSidebarFlow actions={actions} />
      </Box>
    </Grid>
  )
}
