import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@mui/system'
import { GetListResponse } from '@refinedev/core'
import { type FC, useEffect, useState } from 'react'

import { components } from '../../openapi'
import { useActionDispatch } from '../hooks/ActionHooks'
import { ActionsListFlow } from './ActionsListFlow'
import { FormFlow } from './FormFlow'

export type IActionsGroup = {
  id: string
  list: components['schemas']['ActionShort'][]
}

const isAction = (id: string) => id.split(':')[1]?.length

export const SecondSidebarFlow: FC<{
  actions: GetListResponse
  nodeId: string
}> = ({ actions, nodeId }) => {
  const [actionsGroup, setActionsGroup] = useState<IActionsGroup>({
    id: '',
    list: [],
  })
  const dispatch = useActionDispatch()
  const theme = useTheme()
  const [expand, setExpand] = useState('25vw')

  useEffect(() => {
    if (actions.data && nodeId && !isAction(nodeId)) {
      setActionsGroup({
        id: nodeId,
        list: Object.values(actions.data)
          .filter(
            (a) =>
              a.id &&
              typeof a.id === 'string' &&
              a.id.includes(':') &&
              a.id.startsWith(`${nodeId}`)
          )
          .map((a) => ({
            id: String(a.id),
            title: a.title,
            description: a.description,
          })),
      })
    }
  }, [actions, nodeId])

  const onClose = () => {
    dispatch?.({
      id: '',
    })
  }

  const onToggle = () =>
    expand === '25vw' ? setExpand('50vw') : setExpand('25vw')

  if (!nodeId) {
    return null
  }

  return (
    <Box
      role="presentation"
      sx={{
        py: 2,
        overflowY: 'scroll',
        height: '100%',
        position: 'relative',
        bgcolor: theme.palette.background.default,
        width: expand,
      }}
    >
      <IconButton
        size="small"
        onClick={() => onClose()}
        sx={{
          position: 'absolute',
          right: 8,
          top: 11,
          zIndex: 1,
        }}
      >
        <CloseIcon />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => onToggle()}
        sx={{
          zIndex: 1,
          mx: 1,
        }}
      >
        {expand === '25vw' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </IconButton>
      {isAction(nodeId) ? (
        <Box
          sx={{
            px: 2,
            pb: 2,
            '.MuiGrid-item:has(#root_options__title + div:empty), .MuiGrid-item:has(#root_arguments__title + div:empty)':
              {
                display: 'none',
              },
          }}
        >
          <FormFlow actionId={nodeId} formType={'sidebar'} />
        </Box>
      ) : (
        <ActionsListFlow actionsGroup={actionsGroup} />
      )}
    </Box>
  )
}
