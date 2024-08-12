import { Alert, AlertTitle } from '@mui/material'
import { AlertColor } from '@mui/material/Alert/Alert'
import { Box } from '@mui/system'
import { FC } from 'react'

export const AlertBanner: FC<{
  data: {
    title: string
    content?: string
    type?: AlertColor
  }
}> = ({ data }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: (theme) => ({
          xs: theme.spacing(9),
          sm: theme.spacing(11),
        }),
        left: (theme) => ({
          xs: theme.spacing(2),
          sm: theme.spacing(3),
        }),
        zIndex: 'modal',
      }}
    >
      <Alert severity={data.type || 'error'}>
        {data.title && <AlertTitle>{data.title}</AlertTitle>}
        {data.content && (
          <span dangerouslySetInnerHTML={{ __html: data.content }} />
        )}
      </Alert>
    </Box>
  )
}
