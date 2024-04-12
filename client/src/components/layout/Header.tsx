import AddToPhotosIcon from '@mui/icons-material/AddToPhotos'
import GitHubIcon from '@mui/icons-material/GitHub'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import type { RefineThemedLayoutV2HeaderProps } from '@refinedev/mui'
import type { FC } from 'react'

import { DarkModeSwitcher } from './DarkModeSwitcher'
// import { HamburgerMenu } from './HamburgerMenu'
import { ThemedTitleV2 as Title } from './Title'

export const ThemedHeaderV2: FC<RefineThemedLayoutV2HeaderProps> = () => (
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
        <List
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            flexGrow: 0,
          }}
        >
          <ListItem disablePadding>
            <ListItemButton href="/flow">
              <ListItemIcon>
                <AddToPhotosIcon />
              </ListItemIcon>
              <ListItemText primary="Applications" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding disableGutters>
            <ListItemButton
              href="https://github.com/launchrctl/web/issues/new"
              target={'_blank'}
            >
              <ListItemIcon>
                <GitHubIcon />
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
        </List>
        <DarkModeSwitcher />
        {/* <HamburgerMenu /> */}
      </Box>
    </Toolbar>
  </AppBar>
)
