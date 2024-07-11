import TerminalIcon from '@mui/icons-material/Terminal'
import Badge from '@mui/material/Badge'
import Fab from '@mui/material/Fab'
import { styled } from '@mui/system'
import { useEffect, useState } from 'react'

const AnimatedBadge = styled(Badge)(() => ({
  transition: 'transform 0.3s ease-in-out',
  '&.animate': {
    transform: 'scale(1.5)',
  },
}))

interface IAnimatedFabProps {
  badgeLength: number
  handleOpen: () => void
}

const AnimatedFab = ({ badgeLength, handleOpen }: IAnimatedFabProps) => {
  const [animate, setAnimate] = useState(false)
  const [prevBadgeLength, setPrevBadgeLength] = useState(badgeLength)

  useEffect(() => {
    if (badgeLength !== prevBadgeLength && badgeLength > 0) {
      setAnimate(true)
      const timeout = setTimeout(() => setAnimate(false), 300)
      return () => clearTimeout(timeout)
    }
    setPrevBadgeLength(badgeLength)
  }, [badgeLength, prevBadgeLength])

  return (
    <Fab
      color="primary"
      aria-label="status"
      onClick={handleOpen}
      style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
    >
      <AnimatedBadge
        badgeContent={badgeLength}
        color="secondary"
        className={animate ? 'animate' : ''}
      >
        <TerminalIcon />
      </AnimatedBadge>
    </Fab>
  )
}

export { AnimatedFab }
