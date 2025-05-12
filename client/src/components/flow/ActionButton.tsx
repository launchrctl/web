import { components } from '../../../openapi'
import { ListItemButton, ListItemText, Stack } from '@mui/material'
import BoltIcon from '@mui/icons-material/Bolt'
import CircleIcon from '@mui/icons-material/Circle';
import CheckIcon from '@mui/icons-material/Check'
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { useAction, useActionDispatch } from '../../hooks/ActionHooks'
import { sentenceCase, splitRunId } from '../../utils/helpers';

export default function ActionButton({
  action,
}: {
  action: components['schemas']['ActionShort']
}) {
  const dispatch = useActionDispatch()
  const { id: activeNodeId, running, processes } = useAction()

  const isRunning = running?.has(action.id)

  const activeProcesses: { id: string; status: components["schemas"]["ActionRunStatus"]; }[] = []
  processes?.forEach((process) => {
    if (splitRunId(process.id).id === action.id) {
      activeProcesses.push(process)
    }
  })

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
        primary= {sentenceCase(action.id.split(':').pop() || action.id)}
        secondary={action.description}
        slotProps={{
          primary: { noWrap: true },
          secondary: { noWrap: true },
        }}
      />
      {activeProcesses.length > 0 && (
        <Stack direction="row">
          {activeProcesses.map((process) => {
            if (process.status === 'created') {
              return null
            }
            return (
              <CircleIcon
                key={process.id}
                sx={{
                  color: process.status === 'error' ? 'red' : 'green',
                  fontSize: '0.5rem',
                }}
              />
            )
          })}
        </Stack>
      )}
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
