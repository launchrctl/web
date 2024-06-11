import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useTreeViewApiRef } from '@mui/x-tree-view'
import { RichTreeView } from '@mui/x-tree-view/RichTreeView'
import {
  TreeItem2Content,
  TreeItem2IconContainer,
  TreeItem2Label,
  TreeItem2Root,
} from '@mui/x-tree-view/TreeItem2'
import { TreeItem2Icon } from '@mui/x-tree-view/TreeItem2Icon'
import { TreeItem2Provider } from '@mui/x-tree-view/TreeItem2Provider'
import {
  unstable_useTreeItem2 as useTreeItem2,
  UseTreeItem2Parameters,
} from '@mui/x-tree-view/useTreeItem2'
import { clsx } from 'clsx'
import * as React from 'react'
import { FC, useEffect, useState } from 'react'

import ActionIcon from '/images/action.svg'
import AppIcon from '/images/app.svg'
import CheckIcon from '/images/check.svg'
import FolderIcon from '/images/folder.svg'

import { useActionDispatch } from '../hooks/ActionHooks'
import { useFlowClickedActionID } from '../hooks/ActionsFlowHooks'
import {
  useSidebarTreeItemClickStates,
  useSidebarTreeItemMouseStates,
} from '../hooks/SidebarTreeItemStatesHooks'
import type { FileType } from '../utils/tree-builder'
import { treeBuilder } from '../utils/tree-builder'

const StyledTreeItemLabelText = styled(Typography)({
  fontSize: '11px',
  lineHeight: 1.54,
  letterSpacing: '0.11px',
  fontWeight: 'inherit',
}) as unknown as typeof Typography

interface CustomLabelProps {
  children: React.ReactNode
  icon?: React.ElementType
  iconClassnames: string
}

function CustomLabel({
  icon: Icon,
  iconClassnames,
  children,
  ...other
}: CustomLabelProps) {
  return (
    <TreeItem2Label
      {...other}
      sx={{
        display: 'flex',
        alignItems: 'center',
        fontWeight: 'inherit',
      }}
    >
      {Icon && (
        <Box
          className="labelIcon"
          color="inherit"
          sx={{
            mr: 0.5,
          }}
        >
          <ItemPreviewIcon className={iconClassnames}>{Icon}</ItemPreviewIcon>
        </Box>
      )}

      <StyledTreeItemLabelText variant="body2">
        {children}
      </StyledTreeItemLabelText>
    </TreeItem2Label>
  )
}

const ItemPreviewIcon = styled('div')(({ theme }) => {
  return {
    '&.check-mark img': {
      padding: 2,
    },
    '& img': {
      width: 16,
      height: 16,
      display: 'block',
      filter: theme.palette.mode === 'dark' ? 'brightness(0) invert(1)' : '',
    },
  }
})

const CustomTreeItemContent = styled(TreeItem2Content)(({ theme, depth }) => {
  return {
    borderRadius: 8,
    padding: 8,
    paddingLeft: depth * 16 + 8,
    fontWeight: 400,
    backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#fff',
    '&.is-action': {
      position: 'relative',
      paddingLeft: depth * 16 + 32,
      backgroundColor: 'transparent',
    },
    '&.is-action::before': {
      content: '""',
      position: 'absolute',
      left: 8,
      right: 8,
      top: 4,
      bottom: 4,
      borderRadius: 8,
      transitionProperty: 'top, bottom, left, right',
      transitionDuration: '0.2s',
      transitionTimingFunction: 'ease',
    },
    '&.is-action:not(.action-selected):hover::before': {
      backgroundColor: theme.palette.mode === 'dark' ? '#3e639b' : '#d1def4',
    },
    '&:not(.is-action):hover': {
      backgroundColor: theme.palette.mode === 'dark' ? '#272727' : '#F2F4F7',
    },
    '&.action-selected::before': {
      left: 4,
      right: 4,
      top: 0,
      bottom: 0,
      backgroundColor: theme.palette.mode === 'dark' ? '#3488ff' : '#b1cff9',
    },
    [`&.is-actions-group.Mui-expanded`]: {
      backgroundColor: theme.palette.mode === 'dark' ? '#3488ff' : '#b1cff9',
      fontWeight: 600,
    },
  }
})

const CustomTreeItem2Root = styled(TreeItem2Root)(({ theme }) => {
  return {
    borderRadius: 8,
    '&.is-actions-group': {
      backgroundColor: theme.palette.mode === 'dark' ? '#2e4d7d' : '#e3edfe',
    },
    '&.is-actions-group .MuiCollapse-wrapperInner': {
      paddingBlock: 4,
    },
  }
})

const isExpandable = (reactChildren: React.ReactNode) => {
  if (Array.isArray(reactChildren)) {
    return reactChildren.some((element) => isExpandable(element))
  }
  return Boolean(reactChildren)
}

const getIconFromFileType = (fileType: FileType | 'action-selected') => {
  let path
  switch (fileType) {
    case 'app': {
      path = AppIcon
      break
    }
    case 'action': {
      path = ActionIcon
      break
    }
    case 'action-selected': {
      path = CheckIcon
      break
    }
    default: {
      path = FolderIcon
      break
    }
  }

  return <img src={path} />
}

interface CustomTreeItemProps
  extends Omit<UseTreeItem2Parameters, 'rootRef'>,
    Omit<React.HTMLAttributes<HTMLLIElement>, 'onFocus'> {}

const CustomTreeItem = React.forwardRef(function CustomTreeItem(
  props: CustomTreeItemProps,
  ref: React.Ref<HTMLLIElement>
) {
  const { id, itemId, label, disabled, children } = props
  const {
    getRootProps,
    getContentProps,
    getIconContainerProps,
    getLabelProps,
    getGroupTransitionProps,
    status,
    publicAPI,
  } = useTreeItem2({ id, itemId, children, label, disabled, rootRef: ref })
  const item = publicAPI.getItem(itemId)
  const expandable = isExpandable(children)
  const icon = getIconFromFileType(item.fileType)
  const [selectedAction, setSelectedAction] = useState(false)

  useEffect(() => {
    if (!['app', 'folder'].includes(item.fileType)) {
      setSelectedAction(item.selected)
    }
  }, [item.selected, item.fileType])

  return (
    <TreeItem2Provider itemId={itemId}>
      <CustomTreeItem2Root
        {...getRootProps({
          'data-element-id': itemId,
          className: clsx('content', {
            'is-actions-group': item.isActionsGroup,
          }),
        })}
      >
        <CustomTreeItemContent
          {...getContentProps({
            depth: item.depth,
            className: clsx('content', {
              'Mui-expanded': status.expanded,
              'Mui-selected': status.selected,
              'Mui-focused': status.focused,
              'Mui-disabled': status.disabled,
              'is-actions-group': item.isActionsGroup,
              'is-action': item.fileType === 'action',
              'action-selected': selectedAction,
            }),
          })}
        >
          {expandable && (
            <TreeItem2IconContainer {...getIconContainerProps()}>
              <TreeItem2Icon
                sx={{
                  fontSize: 16,
                }}
                status={status}
              />
            </TreeItem2IconContainer>
          )}
          <CustomLabel
            {...getLabelProps({
              icon: selectedAction
                ? getIconFromFileType('action-selected')
                : icon,
              iconClassnames: selectedAction ? 'check-mark' : '',
            })}
          />
        </CustomTreeItemContent>
        {expandable && (
          <Collapse
            sx={{
              padding: 0,
            }}
            {...getGroupTransitionProps()}
          />
        )}
      </CustomTreeItem2Root>
    </TreeItem2Provider>
  )
})

function getItemLabel(item) {
  return item.title || item.label
}

export const SidebarTree: FC = ({ actions }) => {
  const apiRef = useTreeViewApiRef()
  const [items, setItems] = useState<string[]>([])
  const [selectedAction, setSelectedAction] = useState('')
  const [selectedActionsGroup, setSelectedActionsGroup] = useState({})
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])
  const dispatch = useActionDispatch()
  const { handleSelect, handleUnselect } = useSidebarTreeItemClickStates()
  const { flowClickedActionId, setFlowClickedActionId } =
    useFlowClickedActionID()
  const { handleMouseEnter, handleMouseLeave } = useSidebarTreeItemMouseStates()
  const [hoveredId, setHoveredId] = useState('')

  const wrappedHandleMouseMove = (e) => {
    const targetEl = e.target.closest('[data-element-id]')

    if (targetEl && targetEl.dataset.elementId !== hoveredId) {
      const id = targetEl.dataset.elementId

      if (!hoveredId) {
        setHoveredId(id)
        handleMouseEnter(id)
      } else if (id !== hoveredId) {
        handleMouseLeave(hoveredId)
        setHoveredId(id)
        handleMouseEnter(id)
      }
    }
  }

  const wrappedHandleMouseLeave = () => {
    if (hoveredId) {
      handleMouseLeave(hoveredId, false)
      setHoveredId('')
    }
  }

  useEffect(() => {
    if (actions?.data) {
      setItems(treeBuilder(actions))
    }
  }, [actions])

  useEffect(() => {
    if (flowClickedActionId?.id) {
      const expandItems = flowClickedActionId.id
        .split(':')[0]
        .split('.')
        .reduce((acc, part) => {
          const lastSubstring = acc.length > 0 ? acc.at(-1) : ''
          const newSubstring =
            lastSubstring.length > 0 ? `${lastSubstring}.${part}` : part
          acc.push(newSubstring)
          return acc
        }, [])
      setExpandedItems(expandItems.reverse())
      if (selectedAction) {
        const prevSelectedAction = apiRef.current?.getItem(selectedAction)
        prevSelectedAction.selected = false
        setSelectedAction(undefined)
      }
      const curSelectedAction = apiRef.current?.getItem(flowClickedActionId.id)
      curSelectedAction.selected = flowClickedActionId.isActive
      setSelectedAction(
        flowClickedActionId.isActive ? flowClickedActionId.id : ''
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowClickedActionId])

  const onSelectedItemsChange = (
    event: React.SyntheticEvent,
    itemIds: Array | string
  ) => {
    if (itemIds.includes(':')) {
      if (selectedAction) {
        const prevSelectedActionData = apiRef.current?.getItem(selectedAction)
        prevSelectedActionData.selected = false
        handleUnselect(selectedAction)
      }
      const item = apiRef.current?.getItem(itemIds)
      item.selected = selectedAction !== itemIds
      if (item.selected) {
        handleSelect(itemIds)
      } else {
        handleUnselect(itemIds)
      }
      dispatch({
        type: item.selected ? 'set-action' : 'default',
        id: item.selected ? itemIds : '',
      })
      setSelectedAction(selectedAction === itemIds ? '' : itemIds)
      setFlowClickedActionId({
        id: itemIds,
        isActive: true,
      })
    } else {
      if (Object.keys(selectedActionsGroup).length > 0) {
        const prevSelectedActionData = apiRef.current?.getItem(
          selectedActionsGroup.id
        )
        if (prevSelectedActionData) {
          prevSelectedActionData.selected = false
        }
        handleUnselect(
          selectedActionsGroup,
          selectedActionsGroup.isActionsGroup
        )
      }
      const item = apiRef.current?.getItem(itemIds)
      if (selectedActionsGroup.id === itemIds) {
        item.selected = false
        handleUnselect(itemIds, item.isActionsGroup)
        if (selectedAction) {
          const prevSelectedActionData = apiRef.current?.getItem(selectedAction)
          prevSelectedActionData.selected = false
          handleUnselect(selectedAction)
          setSelectedAction('')
        }
        dispatch({
          type: 'default',
          id: '',
          actionsList: [],
        })
        setSelectedActionsGroup({
          id: '',
          isActionsGroup: item.isActionsGroup,
        })
        return
      }
      item.selected = selectedActionsGroup.id !== itemIds
      if (item.selected) {
        handleSelect(itemIds, item.isActionsGroup)
      } else {
        handleUnselect(itemIds, item.isActionsGroup)
        if (selectedAction) {
          const prevSelectedActionData = apiRef.current?.getItem(selectedAction)
          prevSelectedActionData.selected = false
          handleUnselect(selectedAction)
          setSelectedAction('')
        }
      }
      dispatch({
        type:
          item.selected && item.isActionsGroup ? 'set-actions-list' : 'default',
        id: item.selected && item.isActionsGroup ? itemIds : '',
        actionsList:
          item.selected && item.isActionsGroup
            ? Object.values(actions.data)
                .filter(
                  (a) => a.id.includes(':') && a.id.startsWith(`${itemIds}`)
                )
                .map((a) => ({
                  id: a.id,
                  title: a.title,
                  description: a.description,
                }))
            : [],
      })
      setSelectedActionsGroup({
        id: selectedActionsGroup === itemIds ? '' : itemIds,
        isActionsGroup: item.isActionsGroup,
      })
    }
  }

  const deselectAction = (id: string) => {
    const selectedActionData = apiRef.current?.getItem(id)
    selectedActionData.selected = false
    setSelectedAction('')
    dispatch({
      type: 'default',
      id: '',
    })
  }

  const onExpandedItemsChange = (
    event: React.SyntheticEvent,
    itemIds: string[]
  ) => {
    let filteredItemIds = itemIds
    const cur = itemIds[0]
    if (cur) {
      const parts = cur.split('.')
      parts.pop()
      if (parts.length > 0) {
        const siblingsExpanded = itemIds.find(
          (a) => a.startsWith(`${parts.join('.')}.`) && a !== cur
        )
        if (siblingsExpanded) {
          filteredItemIds = itemIds.filter((a) => {
            if (
              siblingsExpanded !== a &&
              selectedAction &&
              selectedAction.includes(`${siblingsExpanded}:`)
            ) {
              deselectAction(selectedAction)
            }
            return siblingsExpanded !== a
          })
        } else {
          if (selectedAction) {
            deselectAction(selectedAction)
          }
        }
      } else {
        filteredItemIds = [cur]

        if (selectedAction) {
          deselectAction(selectedAction)
        }
      }
    }

    if (itemIds.length === 0 && selectedAction) {
      deselectAction(selectedAction)
    }
    setExpandedItems(filteredItemIds)
  }

  return (
    <RichTreeView
      onMouseMove={wrappedHandleMouseMove}
      onMouseLeave={wrappedHandleMouseLeave}
      apiRef={apiRef}
      onSelectedItemsChange={onSelectedItemsChange}
      expandedItems={expandedItems}
      onExpandedItemsChange={onExpandedItemsChange}
      getItemLabel={getItemLabel}
      items={items}
      slots={{ item: CustomTreeItem }}
    ></RichTreeView>
  )
}