import CloseIcon from '@mui/icons-material/Close'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import { Box, IconButton, Modal, Tab } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { FC, SyntheticEvent, useState } from 'react'

import { AnimatedFab } from '../components/AnimatedFab'
import { useAction } from '../hooks/ActionHooks'
import StatusBoxAction from './StatusBoxAction'

const StatusBox: FC = () => {
  const { started, processes } = useAction()
  const renderAnimatedFab = started && started.size > 0

  const [open, setOpen] = useState(false)
  const [selectedActionIndex, setSelectedActionIndex] = useState('1')
  const theme = useTheme()

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)
  const handleChange = (event: SyntheticEvent, newValue: string) => {
    setSelectedActionIndex(newValue)
  }

  if (!started || started.size === 0) {
    return null
  }

  return (
    <>
      {renderAnimatedFab && (
        <AnimatedFab
          handleOpen={handleOpen}
          startedLength={processes?.length}
          runningLength={processes?.filter((process) => process.status === 'running').length}
          errorLength={processes?.filter((process) => process.status === 'error').length}
          finishedLength={processes?.filter((process) => process.status === 'finished').length}
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
                sx={{ width: 'calc(100% - 40px)', minHeight: '36px' }}
              >
                {[...started].map((action, index) => (
                  <Tab
                    key={action}
                    label={action || 'No Id'}
                    value={(index + 1).toString()}
                    sx={{
                      px: 1,
                      py: 1,
                      minHeight: '36px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  />
                ))}
              </TabList>
              <IconButton size="small" onClick={handleClose} sx={{ mx: 1 }}>
                <CloseIcon />
              </IconButton>
            </Box>
            {[...started].map((action, index) => (
              <TabPanel
                value={(index + 1).toString()}
                key={action}
                sx={{ padding: 0, height: 'calc(100% - 50px)', width: '100vw' }}
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
