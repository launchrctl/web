import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import Typography from '@mui/material/Typography'
import { type FC, Fragment, useState } from 'react'
import * as React from 'react'

import ArrowRightIcon from '/images/arrow-right.svg'

import { useActionDispatch } from '../hooks/ActionHooks'
import { useFlowClickedActionID } from '../hooks/ActionsFlowHooks'
import {
  useSidebarTreeItemClickStates,
  useSidebarTreeItemMouseStates,
} from '../hooks/SidebarTreeItemStatesHooks'
import { sentenceCase } from '../utils/helpers'
import { type IActionsGroup } from './SecondSIdebarFlow'
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
    items: {
      id: string
      title: string
      description: string
    }[]
  }[] = []

  const breadcrumbs = actionsGroup.id.includes('.')
    ? actionsGroup.id
        .split('.')
        .slice(0, -1)
        .map((a) => sentenceCase(a))
    : []
  const title = actionsGroup.id.includes('.')
    ? actionsGroup.id.split('.').pop()
    : actionsGroup.id

  if (actionsGroup.list.length > 0) {
    const attachedActions = actionsGroup.list.filter((a) =>
      a.id.includes(`${actionsGroup.id}:`)
    )

    if (attachedActions.length > 0) {
      groups.push({
        folderId: actionsGroup.id,
        label: '',
        items: attachedActions.map((action) => ({
          id: action.id.split(':').pop(),
          title: action.title,
          description: action.description,
        })),
      })
    }

    for (const item of actionsGroup.list) {
      const parts = item.id.split(':')
      const actionId = parts[1]
      const group = parts[0].split('.').pop()

      if (group !== actionsGroup.id) {
        if (groups.some((a) => a.folderId === parts[0])) {
          groups.map((a) => {
            if (
              a.folderId === parts[0] &&
              !Object.values(a.items).some((a) => a.id.includes(actionId))
            )
              a.items.push({
                id: actionId,
                title: item.title,
                description: item.description,
              })
            return a
          })
        } else {
          groups.push({
            folderId: parts[0],
            label: parts[0]
              .split(`${actionsGroup.id}.`)
              .pop()
              .split('.')
              .map((a) => sentenceCase(a))
              .join(' / '),
            items: [
              {
                id: actionId,
                title: item.title,
                description: item.description,
              },
            ],
          })
        }
      }
    }
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
    if (hoveredId) {
      handleMouseLeave(hoveredId, true)
      setHoveredId('')
    }
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
        {breadcrumbs.length === 0 ? (
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
          {title && sentenceCase(title)}
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
                    theme.palette.mode === 'dark' ? '#fff' : '#667085',
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
                    <ListItem
                      disablePadding
                      key={`${i}-${itemIndex}`}
                      sx={{
                        minWidth: 0,
                      }}
                    >
                      <Box
                        className={'action-button'}
                        onMouseMove={() =>
                          wrappedHandleMouseMove(`${group.folderId}:${item.id}`)
                        }
                        onMouseLeave={() => wrappedHandleMouseLeave()}
                        onClick={() =>
                          actionClickHandler(`${group.folderId}:${item.id}`)
                        }
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 1,
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
                        <Box
                          sx={{
                            fontSize: 11,
                            lineHeight: 1.54,
                            letterSpacing: '0.11px',
                            display: 'flex',
                            gap: 0.75,
                            alignItems: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              flexGrow: 1,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.title}
                          </Box>
                          {item.description && (
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 0.75,
                                alignItems: 'center',
                                overflow: 'hidden',
                                img: {
                                  filter: (theme) =>
                                    theme.palette.mode === 'dark'
                                      ? 'brightness(0) invert(1)'
                                      : '',
                                },
                              }}
                            >
                              <img style={{ width: 13 }} src={ArrowRightIcon} />
                              <Box
                                sx={{
                                  backgroundColor: (theme) =>
                                    theme.palette.mode === 'dark'
                                      ? '#383838'
                                      : '#F2F4F7',
                                  borderRadius: 1.5,
                                  borderColor: '#D0D5DD',
                                  borderWidth: 1,
                                  paddingBlock: 0.5,
                                  paddingInline: 0.75,
                                  borderStyle: 'solid',
                                  whiteSpace: 'nowrap',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                }}
                              >
                                {item.description}
                              </Box>
                            </Box>
                          )}
                        </Box>
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
