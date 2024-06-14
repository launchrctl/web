import {
  HttpError,
  useApiUrl,
  useCustom,
  useSubscription,
} from '@refinedev/core'
import { FC, useEffect, useState } from 'react'

import { IActionProcess } from '../types'
import TerminalBox from './TerminalBox'

interface IStatusBoxProcessProps {
  ri: IActionProcess
  actionId: string
}

interface StreamData {
  content: string
  count: number
  offset: number
  type: 'stdOut' | 'stdErr'
}

const StatusBoxProcess: FC<IStatusBoxProcessProps> = ({ ri, actionId }) => {
  const [streams, setStreams] = useState<StreamData[]>([])
  const apiUrl = useApiUrl()

  const { refetch: queryRunning } = useCustom<StreamData[], HttpError>({
    url: `${apiUrl}/actions/${actionId}/running/${ri.id}/streams`,
    method: 'get',
  })

  useSubscription({
    channel: 'process',
    types: ['send-process', 'send-process-finished'],
    onLiveEvent: ({ payload, type }) => {
      if (payload?.data?.action === ri.id) {
        if (type === 'send-process' && payload?.data?.data) {
          setStreams(payload.data.data)
        }

        if (type === 'send-process-finished') {
          queryRunning().then((response) => {
            if (response?.data?.data) {
              setStreams(response.data.data)
            }
          })
        }
      }
    },
  })

  useEffect(() => {
    if (ri.status === 'finished' || ri.status === 'error') {
      queryRunning().then((response) => {
        if (response?.data?.data) {
          setStreams(response.data.data)
        }
      })
    }
  }, [ri.status, ri.id, queryRunning])

  return (
    <>
      {streams.length > 0 ? (
        streams.map((stream, index) => (
          <div key={index}>
            {stream?.content.length > 0 ? (
              <TerminalBox text={stream.content} />
            ) : (
              ''
            )}
          </div>
        ))
      ) : (
        <>loading</>
      )}
    </>
  )
}

export default StatusBoxProcess
