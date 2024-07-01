import { useEffect, useState } from 'react'
import Fab from '@mui/material/Fab'
import Badge from '@mui/material/Badge'
import TerminalIcon from '@mui/icons-material/Terminal'
import { styled } from '@mui/system'

const AnimatedBadge = styled(Badge)(({ theme }) => ({
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

  useEffect(() => {
    if (badgeLength > 0) {
      setAnimate(true)
      const timeout = setTimeout(() => setAnimate(false), 300) // duration of the animation
      return () => clearTimeout(timeout)
    }
  }, [badgeLength])

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

export  { AnimatedFab }
