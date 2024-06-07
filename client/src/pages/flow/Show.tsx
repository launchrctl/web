import Grid from '@mui/material/Grid'
import { GetListResponse, useList } from '@refinedev/core'
import { type FC, useEffect, useState } from 'react'

import { ActionsFlow } from '../../components/ActionsFlow'
import { SecondSIdebarFlow } from '../../components/SecondSIdebarFlow'
import { SidebarFlow } from '../../components/SidebarFlow'
import { ActionProvider } from '../../context/ActionContext'
import { FlowClickedActionIDProvider } from '../../context/ActionsFlowContext'
import {
  SidebarTreeItemClickStatesProvider,
  SidebarTreeItemMouseStatesProvider,
} from '../../context/SidebarTreeItemStatesContext'

export const FlowShow: FC = () => {
  const { data: actions } = useList({
    resource: 'actions',
  })
  const [dataReceived, setData] = useState<GetListResponse>()
  useEffect(() => {
    if (actions) {
      // Sorting actions data to have alphabetical order and actions presented always above subfolders.
      actions.data.sort((a, b) => {
        if (typeof a.id !== 'string' || typeof b.id !== 'string') {
          return 0
        }

        const aParts = a.id.split(':')
        const bParts = b.id.split(':')
        const aType = aParts[0]
        const bType = bParts[0]

        return aType === bType
          ? aParts[1].localeCompare(bParts[1])
          : aType.localeCompare(bType)
      })
      setData(actions)
    }
  }, [actions])
  return (
    <ActionProvider>
      <FlowClickedActionIDProvider>
        <SidebarTreeItemMouseStatesProvider>
          <SidebarTreeItemClickStatesProvider>
            <Grid
              container
              sx={{ height: 'calc(100vh - 68px)' }}
              columns={{ xs: 36 }}
            >
              {dataReceived && (
                <>
                  <Grid item xs={7} sx={{ height: 'calc(100vh - 68px)' }}>
                    <SidebarFlow actions={dataReceived} />
                  </Grid>
                  <Grid item xs={21} sx={{ height: 'calc(100vh - 68px)' }}>
                    <ActionsFlow actions={dataReceived} />
                  </Grid>
                  <Grid item xs={8} sx={{ height: 'calc(100vh - 68px)' }}>
                    <SecondSIdebarFlow />
                  </Grid>
                </>
              )}
            </Grid>
          </SidebarTreeItemClickStatesProvider>
        </SidebarTreeItemMouseStatesProvider>
      </FlowClickedActionIDProvider>
    </ActionProvider>
  )
}
