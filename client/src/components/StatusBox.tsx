import CloseIcon from '@mui/icons-material/Close'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import { Box, IconButton, Modal, Tab } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { FC, SyntheticEvent, useContext, useState } from 'react'

import { AnimatedFab } from '../components/AnimatedFab'
import { AppContext } from '../context/AppContext'
import StatusBoxAction from './StatusBoxAction'

const StatusBox: FC = () => {
  const { appState } = useContext(AppContext)
  const [open, setOpen] = useState(false)
  const [selectedActionIndex, setSelectedActionIndex] = useState('1')
  const theme = useTheme()

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)
  const handleChange = (event: SyntheticEvent, newValue: string) => {
    setSelectedActionIndex(newValue)
  }

  const renderAnimatedFab = appState.runningActions.length > 0

  if (appState.runningActions.length === 0) {
    return null
  }

  return (
    <>
      {renderAnimatedFab && (
        <AnimatedFab
          handleOpen={handleOpen}
          badgeLength={appState.runningActions.length}
        />
      )}
      <Modal
        open={open}
        onClose={handleClose}
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '62.5vh',
            bgcolor: theme.palette.background.default,
            color: theme.palette.text.primary,
          }}
        >
          <TabContext value={selectedActionIndex}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: theme.palette.background.paper,
              }}
            >
              <TabList
                onChange={handleChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ width: 'calc(100% - 40px)' }}
              >
                {appState.runningActions.map((action, index) => (
                  <Tab
                    key={action.id}
                    label={action.id || 'No Id'}
                    value={(index + 1).toString()}
                    sx={{
                      px: 0,
                      fontSize: '10px',
                      fontFamily: 'monospace',
                    }}
                  />
                ))}
              </TabList>
              <IconButton size="small" onClick={handleClose} sx={{ m: 1 }}>
                <CloseIcon />
              </IconButton>
            </Box>
            {appState.runningActions.map((action, index) => (
              <TabPanel
                value={(index + 1).toString()}
                key={action.id}
                sx={{ padding: 0, height: 'calc(100% - 50px)' }}
              >
                <StatusBoxAction action={action} />
              </TabPanel>
            ))}
          </TabContext>
        </Box>
      </Modal>
    </>
  )
}

export default StatusBox
