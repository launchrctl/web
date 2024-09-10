import { Typography } from '@mui/material'
import { TitleFieldProps } from '@rjsf/utils'

export const TitleFieldTemplate = ({ id, title }: TitleFieldProps) => {
  if (id === 'root__title') {
    return (
      <Typography id={id} sx={{ fontSize: '1.125rem' }} className="root-title">
        {title}
      </Typography>
    )
  }
  return (
    <Typography id={id} className="visually-hidden">
      {title}
    </Typography>
  )
}
