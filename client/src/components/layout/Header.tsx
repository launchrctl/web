import GitHubIcon from '@mui/icons-material/GitHub'
import ListIcon from '@mui/icons-material/List'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip' // Added for tooltips
import { RefineThemedLayoutV2HeaderProps } from '@refinedev/mui'
import { FC } from 'react'

import { DarkModeSwitcher } from './DarkModeSwitcher'
import { ThemedTitleV2 as Title } from './Title'

export const ThemedHeaderV2: FC<RefineThemedLayoutV2HeaderProps> = () => (
  <AppBar
    position="sticky"
    color="secondary"
    sx={{
      boxShadow: 'none',
      borderBottom: (theme) => `1px solid ${theme.palette.action.focus}`,
    }}
  >
    <Toolbar>
      <Title collapsed={false} />
      <Box sx={{ flexGrow: 1 }} />
      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title="Actions list">
          <IconButton href="/actions" size="small" color="inherit">
            <ListIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Report bug">
          <IconButton
            href="https://github.com/launchrctl/web/issues/new"
            target="_blank"
            size="small"
            color="inherit"
          >
            <GitHubIcon />
          </IconButton>
        </Tooltip>

        <DarkModeSwitcher />
      </Stack>
    </Toolbar>
  </AppBar>
)
