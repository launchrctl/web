import SpeedDial from '@mui/material/SpeedDial'
import SpeedDialAction from '@mui/material/SpeedDialAction'

import TerminalIcon from '@mui/icons-material/Terminal'
import BoltIcon from '@mui/icons-material/Bolt'
interface IAnimatedFabProps {
  startedLength: number
  runningLength?: number
  errorLength?: number
  finishedLength?: number
  handleOpen: () => void
}

const AnimatedFab = ({
  startedLength,
  runningLength,
  errorLength,
  finishedLength,
  handleOpen,
}: IAnimatedFabProps) => {

  return (
    <SpeedDial
      ariaLabel="Actions state"
      sx={{ position: 'absolute', bottom: 16, right: 16 }}
      icon={<TerminalIcon />}
    >
      <SpeedDialAction
        icon={<BoltIcon />}
        onClick={handleOpen}
        slotProps={{
          tooltip: {
            title: `${startedLength} launched`,
            open: true,
          },
        }}
      />
      <SpeedDialAction
        icon={<BoltIcon />}
        onClick={handleOpen}
        slotProps={{
          tooltip: {
            title: `${runningLength} running`,
            open: true,
          },
        }}
      />
      <SpeedDialAction
        icon={<BoltIcon />}
        onClick={handleOpen}
        slotProps={{
          tooltip: {
            title: `${errorLength} errors`,
            open: true,
          },
        }}
      />
      <SpeedDialAction
        icon={<BoltIcon />}
        onClick={handleOpen}
        slotProps={{
          tooltip: {
            title: `${finishedLength} finished`,
            open: true,
          },
        }}
      />
    </SpeedDial>
  )
}

export { AnimatedFab }
