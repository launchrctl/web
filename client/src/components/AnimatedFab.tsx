import SpeedDial from '@mui/material/SpeedDial'
import SpeedDialAction from '@mui/material/SpeedDialAction'
import AutorenewIcon from '@mui/icons-material/Autorenew';
import DoneIcon from '@mui/icons-material/Done';
import TerminalIcon from '@mui/icons-material/Terminal'
import ErrorIcon from '@mui/icons-material/Error';
import BoltIcon from '@mui/icons-material/Bolt'
interface IAnimatedFabProps {
  startedLength?: number
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
      onClick={handleOpen}
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
        icon={<AutorenewIcon />}
        onClick={handleOpen}
        slotProps={{
          tooltip: {
            title: `${runningLength} running`,
            open: true,
          },
        }}
      />
      <SpeedDialAction
        icon={<ErrorIcon />}
        onClick={handleOpen}
        slotProps={{
          tooltip: {
            title: `${errorLength} errors`,
            open: true,
          },
        }}
      />
      <SpeedDialAction
        icon={<DoneIcon />}
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
