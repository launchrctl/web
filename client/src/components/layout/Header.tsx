import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Hidden from '@mui/material/Hidden'
import Toolbar from '@mui/material/Toolbar'
import type { RefineThemedLayoutV2HeaderProps } from '@refinedev/mui'
import type { FC } from 'react'

import { DarkModeSwitcher } from './DarkModeSwitcher'
import { HamburgerMenu } from './HamburgerMenu'
import { ThemedTitleV2 as Title } from './Title'

export const ThemedHeaderV2: FC<RefineThemedLayoutV2HeaderProps> = () => (
  <Hidden mdUp>
    <AppBar position="sticky" color="secondary">
      <Toolbar>
        <Title collapsed={false} />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '6px',
            flexGrow: 1,
          }}
        >
          <DarkModeSwitcher />
          <HamburgerMenu />
        </Box>
      </Toolbar>
    </AppBar>
  </Hidden>
)
