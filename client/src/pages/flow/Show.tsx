import { AlertColor } from '@mui/material/Alert/Alert'
import Grid from '@mui/material/Grid'
import { Box } from '@mui/system'
import { GetListResponse, useList } from '@refinedev/core'
import { type FC, useEffect, useState } from 'react'

import { ActionsFlow } from '../../components/ActionsFlow'
import { AlertBanner } from '../../components/AlertBanner'
import { SecondSidebarFlow } from '../../components/SecondSidebarFlow'
import { SidebarFlow } from '../../components/SidebarFlow'
import { FlowClickedActionIDProvider } from '../../context/ActionsFlowContext'
import {
  SidebarTreeItemClickStatesProvider,
  SidebarTreeItemMouseStatesProvider,
} from '../../context/SidebarTreeItemStatesContext'
import { useAction } from '../../hooks/ActionHooks'
import { checkIfDuplicatedActions } from '../../utils/helpers'

export const FlowShow: FC = () => {
  const { data: actions } = useList({
    resource: 'actions',
  })
  const [dataReceived, setData] = useState<GetListResponse>()
  const { id: nodeId } = useAction()
  const [renderEndSidebar, setRenderEndSidebar] = useState(false)
  const [alert, setAlert] = useState<
    | boolean
    | {
        title: string
        content?: string
        type?: AlertColor
      }
  >(false)

  useEffect(() => {
    setRenderEndSidebar(nodeId !== '')
  }, [nodeId])

  useEffect(() => {
    if (actions && !dataReceived) {
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
      if (!actions.data || actions.data.length === 0) {
        setAlert({
          title: 'No data actions',
          type: 'warning',
        })
      }
      if (actions.data && actions.data.length > 0) {
        const duplicatedIds: string[] = checkIfDuplicatedActions(actions)
        if (duplicatedIds.length > 0) {
          setAlert({
            title: 'Duplicated IDs of actions detected',
            content: duplicatedIds
              .map((a, i) => `${i === 0 ? '' : '<br/>'}- ${a}`)
              .join(''),
          })
        } else {
          setData(actions)
        }
      }
    }
  }, [actions, dataReceived])

  return (
    <FlowClickedActionIDProvider>
      <SidebarTreeItemMouseStatesProvider>
        <SidebarTreeItemClickStatesProvider>
          <Grid
            container
            sx={{ height: 'calc(100vh - 68px)' }}
            columns={{ xs: 36 }}
          >
            {alert && typeof alert !== 'boolean' && (
              <AlertBanner data={alert} />
            )}
            {dataReceived && (
              <>
                <Grid item xs={7} sx={{ height: 'calc(100vh - 68px)' }}>
                  <SidebarFlow actions={dataReceived} />
                </Grid>
                <Grid item xs={29} sx={{ height: 'calc(100vh - 68px)' }}>
                  <ActionsFlow actions={dataReceived} />
                </Grid>
                {renderEndSidebar && (
                  <Box
                    sx={{
                      height: 'calc(100vh - 68px)',
                      position: 'fixed',
                      right: 0,
                      top: 68,
                    }}
                  >
                    <SecondSidebarFlow actions={dataReceived} nodeId={nodeId} />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </SidebarTreeItemClickStatesProvider>
      </SidebarTreeItemMouseStatesProvider>
    </FlowClickedActionIDProvider>
  )
}
