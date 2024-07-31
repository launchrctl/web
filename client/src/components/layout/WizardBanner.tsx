import { Box, Typography } from '@mui/material'
import type { FC } from 'react'

import bgWizard from '/images/bg-wizard.png'

const WizardBanner: FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => {
  return (
    <Box
      sx={{
        background: `url(${bgWizard})`,
        backgroundSize: '80% auto',
        backgroundRepeat: 'no-repeat',
        padding: 6,
        backgroundPosition: 'right center',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        <Typography
          variant="h3"
          sx={{
            display: 'inline-block',
            background:
              'linear-gradient(89deg, #FD6F8E 32.15%, #7A5AF8 59.68%, #1570EF 87.62%, #1AEFD5 114.33%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: '#000',
          }}
        >
          {title}
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 600 }}>
          {subtitle}
        </Typography>
      </Box>
    </Box>
  )
}

// background: url(<path-to-image>) ;

export default WizardBanner
