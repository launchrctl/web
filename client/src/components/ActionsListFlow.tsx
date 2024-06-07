import { type FC, useState, useEffect, Fragment } from 'react'
import { type IActionsGroup } from './SecondSIdebarFlow'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import ListItemIcon from '@mui/material/ListItemIcon'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos'
import Typography from '@mui/material/Typography'
import { useActionDispatch } from '../context/ActionContext'
import { useFlowClickedActionID } from '../context/ActionsFlowContext'
import {
  useSidebarTreeItemClickStates,
  useSidebarTreeItemMouseStates,
} from '../context/SidebarTreeItemStatesContext'

interface ActionsListFlowProps {
  actionsGroup: IActionsGroup
}

export const ActionsListFlow: FC<ActionsListFlowProps> = ({ actionsGroup }) => {
  const { setFlowClickedActionId } = useFlowClickedActionID()
  const { handleSelect } = useSidebarTreeItemClickStates()
  const { handleMouseEnter, handleMouseLeave } = useSidebarTreeItemMouseStates()
  const [hoveredId, setHoveredId] = useState('')

  const dispatch = useActionDispatch()
  const groups: {
    folderId: string
    label: string
    items: string[]
  }[] = []

  const breadcrumbs = actionsGroup.id.includes('.')
    ? actionsGroup.id
        .split('.')
        .slice(0, -1)
        .map((a) => a.charAt(0).toUpperCase() + a.slice(1))
    : []
  const title = actionsGroup.id.includes('.')
    ? actionsGroup.id.split('.').pop()
    : actionsGroup.id

  if (actionsGroup.list.length > 0) {
    const attachedActions = actionsGroup.list.filter((a) =>
      a.includes(`${actionsGroup.id}:`)
    )

    if (attachedActions.length > 0) {
      groups.push({
        folderId: actionsGroup.id,
        label: '',
        items: attachedActions.map((action) => action.split(':').pop()),
      })
    }

    actionsGroup.list.forEach((item) => {
      const parts = item.split(':')
      const actionName = parts[1]
      const group = parts[0].split('.').pop()

      if (group !== actionsGroup.id) {
        if (!groups.find((a) => a.folderId === parts[0])) {
          groups.push({
            folderId: parts[0],
            label: parts[0]
              .split(`${actionsGroup.id}.`)
              .pop()
              .split('.')
              .map((a) => a?.charAt(0).toUpperCase() + a.slice(1))
              .join(' / '),
            items: [actionName],
          })
        } else {
          groups.map((a) => {
            if (a.folderId === parts[0] && !a.items.includes(actionName))
              a.items.push(actionName)
            return a
          })
        }
      }
    })
  }

  const wrappedHandleMouseMove = (id: string) => {
    if (!hoveredId) {
      setHoveredId(id)
      handleMouseEnter(id)
    } else if (id !== hoveredId) {
      handleMouseLeave(hoveredId)
      setHoveredId(id)
      handleMouseEnter(id)
    }
  }

  const wrappedHandleMouseLeave = () => {
    if (hoveredId) {
      handleMouseLeave(hoveredId, false)
      setHoveredId('')
    }
  }

  const actionClickHandler = (id: string) => {
    dispatch({
      type: 'set-action',
      id,
    })
    setFlowClickedActionId({
      id,
      isActive: true,
    })
    handleSelect(id)
  }

  return (
    <Box>
      <Box
        sx={{
          px: 2,
          pb: 2,
          borderBottom: (theme) => `1px solid ${theme.palette.action.focus}`,
        }}
      >
        {!breadcrumbs.length ? (
          ''
        ) : (
          <Breadcrumbs
            sx={{
              marginBottom: 0.5,
              '.MuiBreadcrumbs-separator': {
                marginInline: 0.5,
              },
            }}
          >
            {breadcrumbs.map((a, i) => (
              <Typography
                key={i}
                sx={{
                  color: (theme) =>
                    theme.palette.mode === 'dark' ? '#fff' : '#667085',
                  fontSize: 11,
                  fontWeight: 600,
                  lineHeight: 1.45,
                  letterSpacing: '0.22px',
                }}
              >
                {a}
              </Typography>
            ))}
          </Breadcrumbs>
        )}
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.6,
            color: (theme) => (theme.palette.mode === 'dark' ? '#fff' : '#000'),
          }}
        >
          {title && title.charAt(0).toUpperCase() + title.slice(1)}
        </Typography>
      </Box>
      {groups.map((group, i) => {
        let label = group.label ? `${group.label} - ` : ''
        label += `${group.items.length} attached ${group.items.length === 1 ? 'action' : 'actions'}`
        return (
          <Fragment key={i}>
            <Box
              sx={{
                p: 2,
              }}
            >
              <Box
                sx={{
                  color: (theme) =>
                    theme.palette.mode === 'dark' ? '#667085' : '#667085',
                  fontSize: 11,
                  fontWeight: 600,
                  lineHeight: 1.45,
                  letterSpacing: '0.22px',
                  paddingBottom: 2,
                }}
              >
                {label}
              </Box>
              <List
                sx={{
                  padding: 0,
                  display: 'grid',
                  gap: '1px',
                }}
              >
                {group.items.map((item, itemIndex) => {
                  return (
                    <ListItem disablePadding key={`${i}-${itemIndex}`}>
                      <Box
                        className={'action-button'}
                        onMouseMove={() =>
                          wrappedHandleMouseMove(`${group.folderId}:${item}`)
                        }
                        onMouseLeave={() => wrappedHandleMouseLeave()}
                        onClick={() =>
                          actionClickHandler(`${group.folderId}:${item}`)
                        }
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          width: '100%',
                          backgroundColor: (theme) =>
                            theme.palette.mode === 'dark'
                              ? '#383838'
                              : '#F2F4F7',
                          paddingBlock: 1,
                          paddingInline: 1.5,
                          cursor: 'pointer',
                          'li:first-of-type &': {
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                          },
                          'li:last-of-type &': {
                            borderBottomLeftRadius: 8,
                            borderBottomRightRadius: 8,
                          },
                          '&:hover': {
                            backgroundColor: (theme) =>
                              theme.palette.mode === 'dark'
                                ? '#676767'
                                : '#dae0e8',
                          },
                        }}
                      >
                        <ListItemText
                          primary={item}
                          sx={{
                            '.MuiListItemText-primary': {
                              fontSize: 11,
                              lineHeight: 1.54,
                              letterSpacing: '0.11px',
                            },
                          }}
                        />
                        <ListItemIcon
                          sx={{
                            minWidth: '0',
                            color: (theme) =>
                              theme.palette.mode === 'dark' ? '#fff' : '#000',
                          }}
                        >
                          <ChevronRightIcon fontSize={'small'} />
                        </ListItemIcon>
                      </Box>
                    </ListItem>
                  )
                })}
              </List>
            </Box>
            {i + 1 < groups.length && <Divider />}
          </Fragment>
        )
      })}
    </Box>
  )
}
