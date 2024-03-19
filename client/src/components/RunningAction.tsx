import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import type { FC } from 'react'

interface IRunningActiontProps {
  id: string | undefined
  key: string | undefined
  status: string | undefined
}

export const RunningAction: FC<IRunningActiontProps> = ({ id, status }) => (
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
      <AccordionDetails>TODO: Stdout</AccordionDetails>
    </Accordion>
  </>
)
