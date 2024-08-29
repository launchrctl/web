import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useLink, useRouterContext, useRouterType } from '@refinedev/core'
import type { RefineLayoutThemedTitleProps } from '@refinedev/mui'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'

import Logo from '/images/logo.svg'

import { getCustomisation } from '../../utils/page-customisation'

const defaultText = import.meta.env.VITE_APP_NAME

export const ThemedTitleV2: FC<RefineLayoutThemedTitleProps> = ({
  wrapperStyles,
  text = defaultText,
}) => {
  const { t } = useTranslation()
  const routerType = useRouterType()
  const Link = useLink()
  const { Link: LegacyLink } = useRouterContext()

  const ActiveLink = routerType === 'legacy' ? LegacyLink : Link

  const logoUrl = getCustomisation()?.plasmactl_web_ui_platform_logo ?? Logo
  const logoText = getCustomisation()?.plasmactl_web_ui_platform_name ?? text

  return (
    <MuiLink
      to="/"
      component={ActiveLink}
      underline="none"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        ...wrapperStyles,
      }}
    >
      <img src={logoUrl} width="24" height="24" alt={t('Logo')} />
      <Typography
        variant="h5"
        fontWeight={700}
        color="text.primary"
        fontSize="15px"
        textOverflow="ellipsis"
        overflow="hidden"
        sx={{ textTransform: 'uppercase' }}
      >
        {logoText}
      </Typography>
    </MuiLink>
  )
}
