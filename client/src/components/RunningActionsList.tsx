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

  const queryRunning = useCustom<IRunInfo[]>({
    url: `${apiUrl}/actions/${actionId}/running`,
    method: 'get',
  })

  useEffect(() => {
    if (actionRunning) {
      const { refetch } = queryRunning

      const fetchData = async () => {
        const { data } = await refetch()

        const runningActions = data?.data?.some((a) => a.status === 'running')
        if (!runningActions) {
          onActionRunFinished()
        }
        setRunning(data?.data)
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
      {running
        ?.sort((a, b) => a.status.localeCompare(b.status))
        .map((info) => (
          <RunningAction
            actionId={actionId}
            key={info.id?.toString()}
            id={info.id?.toString()}
            status={info.status.toString()}
          />
        ))}
    </>
  )
}
