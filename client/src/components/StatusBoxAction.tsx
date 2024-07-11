import { Box, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useApiUrl, useCustom, useSubscription } from '@refinedev/core'
import { FC, SyntheticEvent, useCallback, useEffect, useState } from 'react'

import { ACTION_STATE_COLORS } from '../constants'
import { ActionState, IAction, IActionProcess } from '../types'
import { extractDateTimeFromId } from '../utils/helpers'
import StatusBoxProcess from './StatusBoxProcess'

interface IStatusBoxActionProps {
  action: IAction
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div role="tabpanel" hidden={value !== index} {...other}>
    {value === index && <>{children}</>}
  </div>
)

const transformPayload = (payload: {
  processes: [{ ID: string; Status: string }]
}): IActionProcess[] => {
  return payload.processes.map((process) => ({
    id: process.ID,
    status: process.Status as ActionState,
  }))
}

const StatusBoxAction: FC<IStatusBoxActionProps> = ({ action }) => {
  const apiUrl = useApiUrl()
  const [running, setRunning] = useState<IActionProcess[]>([])
  const [value, setValue] = useState(0)

  const { refetch: queryRunning } = useCustom<IActionProcess[]>({
    url: `${apiUrl}/actions/${action.id}/running`,
    method: 'get',
  })

  useEffect(() => {
    queryRunning().then((response) => {
      if (response?.data?.data) {
        setRunning(response.data.data)
      }
    })
  }, [action.id, queryRunning])

  useSubscription({
    channel: 'processes',
    types: ['send-processes', 'send-processes-finished'],
    onLiveEvent: ({ payload, type }) => {
      if (
        action.id === payload?.data?.action &&
        type === 'send-processes' &&
        payload?.data?.processes?.length > 0
      ) {
        const newData = transformPayload(payload.data)
        setRunning((prevRunning) => {
          if (JSON.stringify(newData) !== JSON.stringify(prevRunning)) {
            return newData
          }
          return prevRunning
        })
      }
      if (type === 'send-processes-finished') {
        queryRunning().then((response) => {
          if (response?.data) {
            setRunning(response?.data?.data)
          }
        })
      }
    },
  })

  const handleChange = useCallback(
    (event: SyntheticEvent, newValue: number) => {
      if (running && Array.isArray(running) && newValue < running.length) {
        setValue(newValue)
      }
    },
    [running]
  )

  return (
    <Box
      sx={{
        flexGrow: 1,
        bgcolor: 'background.paper',
        display: 'flex',
        height: '100%',
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          display: 'grid',
          overflow: 'scroll',
          whiteSpace: 'pre-line',
          fontFamily: 'mono',
          backgroundColor: '#1e1e1e',
          color: '#fff',
          fontSize: '12px',
          lineHeight: '1.5',
          padding: '15px',
        }}
      >
        {Array.isArray(running) && running.length > 0
          ? running
              .sort((a, b) => a.status.localeCompare(b.status))
              .map((info, idx) => (
                <TabPanel value={value} index={idx} key={info.id}>
                  <StatusBoxProcess ri={info} actionId={action.id} />
                </TabPanel>
              ))
          : 'No processes running'}
      </Box>
      <Stack
        spacing={2}
        sx={{ flexGrow: 0, height: 'calc(62.5vh - 48px)', flexBasis: '20vw' }}
      >
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={value}
          onChange={handleChange}
          sx={{
            borderLeft: 1,
            borderColor: 'divider',
            '& .MuiTabs-indicator': { left: 0 },
          }}
        >
          {Array.isArray(running) && running.length > 0
            ? running
                .sort((a, b) => a.status.localeCompare(b.status))
                .map((info) => (
                  <Tab
                    key={info.id}
                    label={
                      <>
                        <Typography
                          sx={{
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            textTransform: 'lowercase',
                          }}
                          color={ACTION_STATE_COLORS[info.status]}
                        >
                          {info.id}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            textTransform: 'lowercase',
                          }}
                        >
                          started: {extractDateTimeFromId(info.id)}
                        </Typography>
                      </>
                    }
                    sx={{ alignItems: 'start', minHeight: 10 }}
                  />
                ))
            : null}
        </Tabs>
      </Stack>
    </Box>
  )
}

export default StatusBoxAction
