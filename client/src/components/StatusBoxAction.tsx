import { Box, Chip, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useApiUrl, useCustom, useSubscription } from '@refinedev/core'
import { FC, SyntheticEvent, useCallback, useEffect, useState } from 'react'

import { components } from '../../openapi'
import { ACTION_STATE_COLORS } from '../constants'
import { extractDateTimeFromId, splitRunId } from '../utils/helpers'
import StatusBoxProcess from './StatusBoxProcess'

interface IStatusBoxActionProps {
  action: string
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
}): components['schemas']['ActionRunInfo'][] => {
  return payload.processes.map((process) => ({
    id: process.ID,
    status: process.Status as components['schemas']['ActionRunStatus'],
  }))
}

const getNewActiveTabId = (event: SyntheticEvent) => {
  let target = event.target as HTMLElement
  while (target && !target.dataset.processId) {
    target = target.parentElement as HTMLElement
  }

  return target.dataset.processId || undefined
}

type IActiveTab =
  | false
  | {
      index: number
      id: string
    }

const StatusBoxAction: FC<IStatusBoxActionProps> = ({ action }) => {
  const apiUrl = useApiUrl()
  const [running, setRunning] = useState<
    components['schemas']['ActionRunInfo'][]
  >([])
  const [activeRunningTab, setRunningTab] = useState<IActiveTab>(false)
  const [activeArchiveTab, setArchiveTab] = useState<IActiveTab>(false)
  const { refetch: queryRunning } = useCustom<
    components['schemas']['ActionRunInfo'][]
  >({
    url: `${apiUrl}/actions/${action}/running`,
    method: 'get',
  })

  useEffect(() => {
    queryRunning().then((response) => {
      if (response?.data?.data) {
        const data = [...response.data.data]
        let related
        setRunning(data.reverse())
        if (data.filter((a) => a.status === 'running').length === 0) {
          setRunningTab(false)
          related = data.find((a) => ['error', 'finished', 'canceled'].includes(a.status))
          if (related && related.id) {
            setArchiveTab({
              index: 0,
              id: related.id,
            })
          }
        } else {
          setArchiveTab(false)
          related = data.find((a) => a.status === 'running')
          if (related && related.id) {
            setRunningTab({
              index: 0,
              id: related.id,
            })
          }
        }
      }
    })
  }, [action, queryRunning])

  useEffect(() => {
    if (typeof activeRunningTab === 'object') {
      const prevProcessData = running.find((a) => a.id === activeRunningTab.id)

      if (prevProcessData && prevProcessData.status !== 'running') {
        setRunningTab(false)

        const filterOfArchivedProcess = running.filter((a) =>
          ['error', 'finished', 'canceled'].includes(a.status)
        )

        setArchiveTab({
          index: filterOfArchivedProcess.findIndex(
            (a) => a.id === prevProcessData.id
          ),
          id: prevProcessData.id,
        })
      }
    }
  }, [running, activeRunningTab])

  useSubscription({
    channel: 'processes',
    types: ['send-processes', 'send-processes-finished'],
    onLiveEvent: ({ payload, type }) => {
      if (
        action === payload?.data?.action &&
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
            setRunning(response.data.data.reverse())
          }
        })
      }
    },
  })

  const handleRunningTabChange = useCallback(
    (event: SyntheticEvent, newValue: number) => {
      const id = getNewActiveTabId(event)

      if (
        id &&
        running &&
        Array.isArray(running) &&
        newValue < running.length
      ) {
        setArchiveTab(false)
        setRunningTab({
          index: newValue,
          id: id,
        })
      }
    },
    [running]
  )

  const handleArchiveTabChange = useCallback(
    (event: SyntheticEvent, newValue: number) => {
      const id = getNewActiveTabId(event)

      if (
        id &&
        running &&
        Array.isArray(running) &&
        newValue < running.length
      ) {
        setRunningTab(false)
        setArchiveTab({
          index: newValue,
          id: id,
        })
      }
    },
    [running]
  )

  const TabPanelContent = (
    array: components['schemas']['ActionRunInfo'][],
    index: number
  ) => {
    return array.map((info, idx) => {
      return (
        <TabPanel value={index} index={idx} key={info.id}>
          <StatusBoxProcess ri={info} actionId={action} />
        </TabPanel>
      )
    })
  }

  const TabPanels = () => {
    if (Array.isArray(running)) {
      if (
        running.some((a) => a.status === 'running') &&
        typeof activeRunningTab === 'object' &&
        activeRunningTab.index >= 0
      ) {
        return TabPanelContent(
          running.filter((a) => a.status === 'running'),
          activeRunningTab.index
        )
      } else if (
        running.some((a) => ['error', 'finished', 'canceled'].includes(a.status)) &&
        typeof activeArchiveTab === 'object' &&
        activeArchiveTab.index >= 0
      ) {
        return TabPanelContent(
          running.filter((a) => ['error', 'finished', 'canceled'].includes(a.status)),
          activeArchiveTab.index
        )
      }
    } else {
      return 'No processes running'
    }
  }

  const ProcessesSection = ({
    title,
    noMessage,
    list,
    activeTab,
    onChangeHandler,
  }: {
    title: string
    noMessage: string
    list: components['schemas']['ActionRunInfo'][]
    activeTab: IActiveTab
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChangeHandler: (event: React.SyntheticEvent, value: any) => void
  }) => {
    return (
      <Box>
        <Typography
          sx={{
            px: 2,
            py: 1,
            color: (theme) => theme.palette.primary.contrastText,
            backgroundColor: (theme) => theme.palette.primary.main,
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.45,
          }}
        >
          {title}
        </Typography>
        {list.length === 0 ? (
          <Typography
            sx={{
              px: 2,
              py: 1,
              fontSize: 11,
              fontWeight: 600,
              lineHeight: 1.45,
              letterSpacing: '0.22px',
            }}
          >
            - {noMessage}
          </Typography>
        ) : (
          <Tabs
            orientation="vertical"
            variant="scrollable"
            value={activeTab === false ? activeTab : activeTab.index}
            onChange={onChangeHandler}
            sx={{
              p: 0,
              borderLeft: 1,
              borderColor: 'divider',
              '& .MuiTabs-indicator': { left: 0 },
            }}
          >
            {list.map((info) => (
              <Tab
                key={running.findIndex((a) => a.id === info.id)}
                data-process-id={info.id}
                label={
                  <>
                    <Typography
                      component="div"
                      sx={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        textTransform: 'lowercase',
                        pb: 0.5,
                      }}
                      color={ACTION_STATE_COLORS[info.status]}
                    >
                      { splitRunId(info.id).id }
                      <Chip
                        variant="outlined"
                        label={info.status}
                        size="small"
                        sx={{
                          mx: 1,
                          color: ACTION_STATE_COLORS[info.status],
                          borderColor: ACTION_STATE_COLORS[info.status],
                        }}
                      />
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        textTransform: 'lowercase',
                        textAlign: 'start',
                      }}
                    >
                      started: {extractDateTimeFromId(info.id)}
                    </Typography>
                  </>
                }
                sx={{
                  alignItems: 'start',
                  minHeight: 10,
                  px: 2,
                  py: 1,
                }}
              />
            ))}
          </Tabs>
        )}
      </Box>
    )
  }

  const RunningActions = () => {
    return ProcessesSection({
      title: 'Running actions',
      noMessage: 'No Running actions',
      list: running.filter((a) => a.status === 'running'),
      activeTab: activeRunningTab,
      onChangeHandler: handleRunningTabChange,
    })
  }

  const FinishedActions = () => {
    return ProcessesSection({
      title: 'Finished actions',
      noMessage: 'No finished actions',
      list: running.filter((a) => ['error', 'finished', 'canceled'].includes(a.status)),
      activeTab: activeArchiveTab,
      onChangeHandler: handleArchiveTabChange,
    })
  }

  return (
    <Stack
      direction={'row'}
      sx={{
        flexGrow: 1,
        bgcolor: 'background.paper',
        display: 'flex',
        height: '100%',
      }}
    >

      <Box
        sx={{
          width: '80vw',
          whiteSpace: 'pre-line',
          fontFamily: 'mono',
          backgroundColor: '#1e1e1e',
          overflow: 'auto',
          color: '#fff',
          fontSize: '12px',
          lineHeight: '1.5',
          padding: '15px',
        }}
      >
        {TabPanels()}
      </Box>

      <Stack
        spacing={2}
        sx={{
          flexGrow: 0,
          height: 'calc(62.5vh - 48px)',
          width: '20vw',
          overflow: 'auto',
        }}
      >
        {RunningActions()}
        {FinishedActions()}
      </Stack>
    </Stack>
  )
}

export default StatusBoxAction
