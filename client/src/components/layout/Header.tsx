import GitHubIcon from '@mui/icons-material/GitHub'
import ListIcon from '@mui/icons-material/List'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import { useApiUrl, useCustomMutation } from '@refinedev/core'
import { RefineThemedLayoutV2HeaderProps } from '@refinedev/mui'
import { FC } from 'react'

import { DarkModeSwitcher } from './DarkModeSwitcher'
import { ThemedTitleV2 as Title } from './Title'

export const ThemedHeaderV2: FC<RefineThemedLayoutV2HeaderProps> = () => {
  const apiUrl = useApiUrl()
  const { mutateAsync } = useCustomMutation()

  const handleStopServer = async () => {
    try {
      await mutateAsync({
        url: `${apiUrl}/shutdown`,
        method: 'post',
        values: 'stop',
        successNotification: {
          message: 'Server is shutting down.',
          description: 'The server shutdown request was successful.',
          type: 'success',
        },
        errorNotification: {
          message: 'Failed to stop server.',
          description:
            'There was an error while attempting to stop the server.',
          type: 'error',
        },
      })
      window.close()
    } catch (error) {
      console.error('Failed to stop server:', error)
    }
  }

  return (
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

          <Tooltip title="Stop Web UI">
            <IconButton onClick={handleStopServer} size="small" color="inherit">
              <PowerSettingsNewIcon />
            </IconButton>
          </Tooltip>

          <DarkModeSwitcher />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
