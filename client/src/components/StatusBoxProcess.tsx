import {
  HttpError,
  useApiUrl,
  useCustom,
  useCustomMutation,
  useSubscription,
} from '@refinedev/core'
import { FC, useEffect, useState } from 'react'
import { components } from '../../openapi'
import TerminalBox from './TerminalBox'
import { Fab, Stack } from '@mui/material'
import { splitRunId } from '../utils/helpers'

interface IStatusBoxProcessProps {
  ri: components['schemas']['ActionRunInfo']
  actionId: string
}

const StatusBoxProcess: FC<IStatusBoxProcessProps> = ({ ri, actionId }) => {
  const [streams, setStreams] = useState<
    components['schemas']['ActionRunStreamData'][]
  >([])
  const apiUrl = useApiUrl()
  const { mutateAsync } = useCustomMutation()

  const { refetch: queryRunning } = useCustom<
    components['schemas']['ActionRunStreamData'][],
    HttpError
  >({
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

  const stopProcess = async (processId: string) => {
    try {
      await mutateAsync({
        url: `${apiUrl}/actions/${splitRunId(processId).id}/running/${processId}/cancel`,
        method: 'post',
        values: 'stop',
        successNotification: {
          message: 'Process is shutting down.',
          description: 'The process shutdown request was successful.',
          type: 'success',
        },
        errorNotification: {
          message: 'Failed to stop process.',
          description:
            'There was an error while attempting to stop the process.',
          type: 'error',
        },
      })
    } catch (error) {
      console.error('Failed to stop process:', error)
    }
  }

  const handleStopProcess = () => {
    stopProcess(ri.id)
      .then(() => {
        // dispatch?.({
        //   type: 'stop-process',
        //   process: ri,
        // })
      })
      .catch((error) => {
        console.error('Error stopping process:', error)
      })
  }

  return (
    <Stack style={{ position: 'relative', height: '100%' }}>
      {ri.status === 'running' && (
        <Fab
          variant="extended"
          aria-label="stop"
          size="small"
          sx={{ position: 'absolute', top: 16, right: 16 }}
          onClick={handleStopProcess}
        >
          cancel
        </Fab>
      )}

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
    </Stack>
  )
}

export default StatusBoxProcess
