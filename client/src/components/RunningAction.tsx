import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import { useApiUrl, useCustom } from '@refinedev/core'
import type { FC } from 'react'
import { useEffect, useState } from 'react'

interface IRunningActiontProps {
  actionId: string | undefined
  id: string | undefined
  key: string | undefined
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
      <Accordion defaultExpanded={status !== 'finished'}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            color: 'primary.contrastText',
            backgroundColor:
              status === 'finished' ? 'success.light' : 'info.light',
          }}
        >
          {id} {status}
        </AccordionSummary>
        <AccordionDetails>
          {output.length > 0 ? (
            <div
              style={{
                whiteSpace: 'pre-line',
                fontFamily: 'mono',
                backgroundColor: '#1e1e1e',
                color: '#fff',
                fontSize: '12px',
                lineHeight: '1.5',
                padding: '20px',
              }}
            >
              {output}
            </div>
          ) : (
            'No output'
          )}
        </AccordionDetails>
      </Accordion>
    </>
  )
}
