import { components } from '../../../openapi'
import { useAction, useActionDispatch } from '../../hooks/ActionHooks'
import { sentenceCase, splitActionId } from '../../utils/helpers'
import {
  Box,
  Button,
  List,
  Paper,
  Stack,
} from '@mui/material'
import BoltIcon from '@mui/icons-material/Bolt'
import CheckIcon from '@mui/icons-material/Check'
import ActionButton from './ActionButton'

type ActionShort = components['schemas']['ActionShort']

const getChildItems = (actions: { data: ActionShort[] }, id: string) => {
  const childActions = new Set<ActionShort>()
  const directChildActions = new Set<ActionShort>()
  const directChildDirectories = new Set<string>()

  actions?.data.forEach((action: ActionShort) => {
    const { isAction } = splitActionId(action.id)
    if (!action.id.startsWith(id)) {
      return
    }

    if (isAction) {
      childActions.add(action)
    }
    const childPath = action.id.substring(id.length + 1)
    const { levels } = splitActionId(childPath)

    if (levels.length === 0) {
      directChildActions.add(action)
    } else if (levels.length > 0) {
      directChildDirectories.add(`${id}.${levels[0]}`)
    }
  })

  return {
    childActions: Array.from(childActions),
    directChildActions: Array.from(directChildActions),
    directChildDirectories: Array.from(directChildDirectories),
  }
}

interface RecursiveDirectoryProps {
  actions: {
    data: ActionShort[]
  }
  id: string
}

const RecursiveDirectory = ({ actions, id }: RecursiveDirectoryProps) => {
  const dispatch = useActionDispatch()
  const { id: activeNodeId } = useAction()

  const { childActions, directChildActions, directChildDirectories } =
    getChildItems(actions, id)

  const actionClickHandler = (id: string) => {
    dispatch?.({
      type: 'set-active-action',
      id,
    })
  }

  const isActive = activeNodeId === id

  return (
    <>
      <Paper
        variant="outlined"
        className={`flow-directory ${isActive ? 'flow-directory--active' : ''}`}
      >
        <Box className="flow-directory__header">
          {sentenceCase(id.split('.').pop() || id)}
          {childActions.length > 0 && (
            <Button
              onClick={() => actionClickHandler(id)}
              variant="contained"
              size="small"
              startIcon={isActive ? <CheckIcon /> : <BoltIcon />}
              color="secondary"
              className="flow-directory__header-button"
            >
              {childActions.length}
            </Button>
          )}
        </Box>
        <Stack direction={'row'} spacing={8} paddingBlock={2} paddingInline={4}>
          {directChildActions.length > 0 && (
            <List disablePadding dense>
              {directChildActions.map((action) => (
                <ActionButton key={action.id} action={action} />
              ))}
            </List>
          )}

          {directChildDirectories.length > 0 && (
            <Stack direction={'row'} spacing={8}>
              {directChildDirectories.map((directory) => (
                <RecursiveDirectory
                  actions={actions}
                  id={directory}
                  key={directory}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>
    </>
  )
}

export default RecursiveDirectory
