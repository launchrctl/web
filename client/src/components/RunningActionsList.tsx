import type { BaseRecord } from '@refinedev/core'
import { useApiUrl, useCustom } from '@refinedev/core'
import type { FC } from 'react'
import { useEffect, useState } from 'react'

import { RunningAction } from './RunningAction'

interface IRunInfo extends BaseRecord {
  status: string
}

interface IRunningActionsListProps {
  actionId: string
}

export const RunningActionsList: FC<IRunningActionsListProps> = ({
  actionId,
}) => {
  const apiUrl = useApiUrl()
  const [running, setRunning] = useState<IRunInfo[] | undefined>()
  const queryRunning = useCustom<IRunInfo[]>({
    url: `${apiUrl}/actions/${actionId}/running`,
    method: 'get',
  })
  const { refetch } = queryRunning

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await refetch()
      setRunning(data?.data)
    }

    const intervalId = setInterval(
      fetchData,
      import.meta.env.VITE_API_POLL_INTERVAL
    )

    return () => clearInterval(intervalId)
  }, [refetch])

  return (
    <>
      {running
        ?.sort((a, b) => a.status.localeCompare(b.status))
        .map((info) => (
          <RunningAction
            key={info.id?.toString()}
            id={info.id?.toString()}
            status={info.status.toString()}
          />
        ))}
    </>
  )
}
