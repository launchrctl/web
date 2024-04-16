import { ExpandLess, ExpandMore } from '@mui/icons-material'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import { useTheme } from '@mui/material/styles'
import type { BaseRecord } from '@refinedev/core'
import { useApiUrl, useCustom } from '@refinedev/core'
import type { FC } from 'react'
import { useEffect, useState } from 'react'

import { RunningAction } from './RunningAction'

interface IRunInfo extends BaseRecord {
  status: string
}

interface IRunningActionsListProps {
  actionRunning: boolean
  actionId: string
  onActionRunFinished: () => void
}

export const RunningActionsList: FC<IRunningActionsListProps> = ({
  actionId,
  actionRunning,
  onActionRunFinished,
}) => {
  const apiUrl = useApiUrl()
  const [running, setRunning] = useState<IRunInfo[] | undefined>()
  const [expanded, setExpanded] = useState(false)
  const theme = useTheme()
  const [value, setValue] = useState('')

  const queryRunning = useCustom<IRunInfo[]>({
    url: `${apiUrl}/actions/${actionId}/running`,
    method: 'get',
  })

  const handleExpandClick = () => {
    setExpanded(!expanded)
  }

  useEffect(() => {
    if (actionRunning) {
      const { refetch } = queryRunning

      const fetchData = async () => {
        const { data } = await refetch()

        const runningActions = data?.data?.some((a) => a.status === 'running')
        if (!runningActions) {
          onActionRunFinished()
        }
        setRunning(data?.data?.sort((a, b) => a.status.localeCompare(b.status)))
      }
      const intervalId = setInterval(
        fetchData,
        import.meta.env.VITE_API_POLL_INTERVAL
      )

      return () => clearInterval(intervalId)
    }
  }, [actionRunning, queryRunning, onActionRunFinished])

  return (
    <>
      <Paper
        hidden={!running?.length}
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1300 }}
        elevation={5}
      >
        <BottomNavigation
          showLabels
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue)
          }}
        >
          {running?.map((info) => (
            <BottomNavigationAction
              label={info.id?.toString()}
              value={info.id?.toString()}
              key={info.id?.toString()}
              sx={{
                color:
                  info.status === 'running'
                    ? theme.palette.success.main
                    : theme.palette.text.disabled,
              }}
            />
          ))}

          <Box sx={{ ml: 'auto', alignSelf: 'center' }}>
            <IconButton onClick={handleExpandClick}>
              {expanded ? <ExpandMore /> : <ExpandLess />}
            </IconButton>
          </Box>
        </BottomNavigation>
        <Collapse in={expanded} sx={{ width: '100%', maxHeight: '50vh' }}>
          {running?.map((info) => (
            <div
              hidden={value !== info.id?.toString()}
              key={info.id?.toString()}
            >
              <RunningAction
                actionId={actionId}
                id={info.id?.toString()}
                status={info.status.toString()}
              />
            </div>
          ))}
        </Collapse>
      </Paper>
    </>
  )
}
