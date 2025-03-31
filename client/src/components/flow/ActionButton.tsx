import { components } from '../../../openapi'
import { ListItemButton, ListItemText } from '@mui/material'
import BoltIcon from '@mui/icons-material/Bolt'
import CheckIcon from '@mui/icons-material/Check'
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { useAction, useActionDispatch } from '../../hooks/ActionHooks'

export default function ActionButton({
  action,
}: {
  action: components['schemas']['ActionShort']
}) {
  const dispatch = useActionDispatch()
  const { id: activeNodeId, running } = useAction()

  const isRunning = running?.has(action.id)

  const actionClickHandler = (id: string) => {
    dispatch?.({
      type: 'set-active-action',
      id,
    })
  }

  return (
    <ListItemButton
      key={action.id}
      onClick={() => actionClickHandler(action.id)}
      className={`flow-directory__action ${
        activeNodeId === action.id ? 'flow-directory__action--active' : ''
      }`}
    >
      <ListItemText
        primary={action.title}
        secondary={action.description}
        slotProps={{
          primary: { noWrap: true },
          secondary: { noWrap: true },
        }}
      />
      {isRunning ? (
        <AutorenewIcon
          sx={{
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        />
      ) : action.id === activeNodeId ? (
        <CheckIcon />
      ) : (
        <BoltIcon />
      )}
    </ListItemButton>
  )
}
