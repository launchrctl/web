import { useApiUrl, useCustom } from '@refinedev/core'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface IRunningActiontProps {
  actionId: string | undefined
  id: string | undefined
  status: string | undefined
}

export const RunningAction: FC<IRunningActiontProps> = ({
  actionId,
  id,
  status,
}) => {
  const apiUrl = useApiUrl()
  const [output, setOutput] = useState('')
  const queryRunning = useCustom({
    url: `${apiUrl}/actions/${actionId}/running/${id}/streams`,
    method: 'get',
  })

  useEffect(() => {
    if (status === 'running') {
      const { refetch } = queryRunning

      const fetchData = async () => {
        const { data } = await refetch()
        setOutput(data?.data?.content)
      }

      const intervalId = setInterval(
        fetchData,
        import.meta.env.VITE_API_POLL_INTERVAL
      )

      return () => clearInterval(intervalId)
    }
  }, [status, queryRunning])
  return (
    <>
      {output.length > 0 ? (
        <SyntaxHighlighter language="shellSession" style={materialDark}>
          {output}
        </SyntaxHighlighter>
      ) : (
        'No output'
      )}
    </>
  )
}
