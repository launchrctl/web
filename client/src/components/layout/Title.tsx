import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useLink, useRouterContext, useRouterType } from '@refinedev/core'
import type { RefineLayoutThemedTitleProps } from '@refinedev/mui'
import { useState, useEffect, type FC } from 'react'
import { useTranslation } from 'react-i18next'

import Logo from '/images/logo.svg'

import { getCustomisation } from '../../utils/page-customisation'

export const ThemedTitleV2: FC<RefineLayoutThemedTitleProps> = ({
  wrapperStyles,
}) => {
  const { t } = useTranslation()
  const routerType = useRouterType()
  const Link = useLink()
  const { Link: LegacyLink } = useRouterContext()

  const ActiveLink = routerType === 'legacy' ? LegacyLink : Link

  interface Customisation {
    plasmactl_web_ui_platform_logo?: string;
    plasmactl_web_ui_platform_header_name?: string;
  }

  const [customisation, setCustomisation] = useState<Customisation | null>(null);

  useEffect(() => {
    const fetchCustomisation = async () => {
      const result = await getCustomisation();
      setCustomisation(result);
    };

    fetchCustomisation();
  }, []);

  const logoUrl = customisation?.plasmactl_web_ui_platform_logo ?? Logo;
  const logoText =
    customisation?.plasmactl_web_ui_platform_header_name ?? 'Launchr Web UI';

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
      >
        {logoText}
      </Typography>
    </MuiLink>
  )
}
