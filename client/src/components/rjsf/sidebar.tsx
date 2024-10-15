import { Box, Typography } from '@mui/material'
import { DescriptionFieldProps, TitleFieldProps } from '@rjsf/utils'

export const TitleFieldTemplate = (props: TitleFieldProps) => {
  const { id, title } = props
  if (id === 'root__title') {
    return (
      <>
        <Typography
          id={id}
          sx={{
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.6,
            color: (theme) => (theme.palette.mode === 'dark' ? '#fff' : '#000'),
          }}
        >
          {title}
        </Typography>
      </>
    )
  }
  return (
    <Box id={id}>
      <Typography variant="subtitle2">{title}</Typography>
    </Box>
  )
}

export const DescriptionFieldTemplate = (props: DescriptionFieldProps) => {
  const { description, id } = props
  return (
    <Typography id={id} sx={{ display: 'block', mt: 1 }} variant="caption">
      {description}
    </Typography>
  )
}
