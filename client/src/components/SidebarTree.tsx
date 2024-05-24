import * as React from 'react'
import { RichTreeView } from '@mui/x-tree-view/RichTreeView'
import { FC, useEffect } from 'react'
import FolderIcon from '/images/folder.svg'
import AppIcon from '/images/app.svg'
import ActionIcon from '/images/action.svg'
import type { FileType } from '../utils/tree-builder'
import { treeBuilder } from '../utils/tree-builder'
import { useActionDispatch } from '../context/ActionContext'
import clsx from 'clsx'
import {
  unstable_useTreeItem2 as useTreeItem2,
  UseTreeItem2Parameters,
} from '@mui/x-tree-view/useTreeItem2'
import { TreeItem2Provider } from '@mui/x-tree-view/TreeItem2Provider'
import {
  TreeItem2Content,
  TreeItem2IconContainer,
  TreeItem2Label,
  TreeItem2Root,
} from '@mui/x-tree-view/TreeItem2'
import { styled } from '@mui/material/styles'
import { TreeItem2Icon } from '@mui/x-tree-view/TreeItem2Icon'
import Collapse from '@mui/material/Collapse'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useState, createContext } from 'react'
import {
  useSidebarTreeItemClickStates,
  useSidebarTreeItemMouseStates,
} from '../context/SidebarTreeItemStatesContext'
import { sanitizeDataForNewSchema } from '@rjsf/utils'
import { useTreeViewApiRef } from '@mui/x-tree-view'
import CheckIcon from '/images/check.svg'
import { useFlowClickedActionID } from '../context/ActionsFlowContext'

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
  expandable?: boolean
}

function CustomLabel({
  icon: Icon,
  iconClassnames,
  expandable,
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
    return reactChildren.length > 0 && reactChildren.some(isExpandable)
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
  const dispatch = useActionDispatch()
  const { id, itemId, label, disabled, children, ...other } = props
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
  }, [item.selected])

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
              expandable: expandable && status.expanded,
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
  const { flowClickedActionId } = useFlowClickedActionID()
  const { handleMouseEnter, handleMouseLeave } = useSidebarTreeItemMouseStates()
  const [hoveredId, setHoveredId] = useState('')

  const wrappedHandleMouseMove = (e) => {
    const targetEl = e.target.closest('[data-element-id]')

    if (targetEl && targetEl.getAttribute('data-element-id') !== hoveredId) {
      const id = targetEl.getAttribute('data-element-id')

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
          const lastSubstring = acc.length > 0 ? acc[acc.length - 1] : ''
          const newSubstring =
            lastSubstring.length > 0 ? `${lastSubstring}.${part}` : part
          acc.push(newSubstring)
          return acc
        }, [])
      setExpandedItems(expandItems)
      if (selectedAction) {
        const prevSelectedAction = apiRef.current!.getItem(selectedAction)
        prevSelectedAction.selected = false
        setSelectedAction(undefined)
      }
      const curSelectedAction = apiRef.current!.getItem(flowClickedActionId.id)
      curSelectedAction.selected = flowClickedActionId.isActive
      setSelectedAction(
        flowClickedActionId.isActive ? flowClickedActionId.id : ''
      )
    }
  }, [flowClickedActionId])

  const onSelectedItemsChange = (
    event: React.SyntheticEvent,
    itemIds: Array | string
  ) => {
    if (itemIds.includes(':')) {
      if (selectedAction) {
        const prevSelectedActionData = apiRef.current!.getItem(selectedAction)
        prevSelectedActionData.selected = false
        handleUnselect(selectedAction)
      }
      const item = apiRef.current!.getItem(itemIds)
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
    } else {
      if (Object.keys(selectedActionsGroup).length) {
        const prevSelectedActionData = apiRef.current!.getItem(
          selectedActionsGroup.id
        )
        prevSelectedActionData.selected = false
        handleUnselect(
          selectedActionsGroup,
          selectedActionsGroup.isActionsGroup
        )
      }
      const item = apiRef.current!.getItem(itemIds)
      item.selected = selectedActionsGroup.id !== itemIds
      if (item.selected) {
        handleSelect(itemIds, item.isActionsGroup)
      } else {
        handleUnselect(itemIds, item.isActionsGroup)
        if (selectedAction) {
          const prevSelectedActionData = apiRef.current!.getItem(selectedAction)
          prevSelectedActionData.selected = false
          handleUnselect(selectedAction)
          setSelectedAction('')
        }
      }
      dispatch({
        type:
          item.selected && item.isActionsGroup ? 'set-actions-list' : 'default',
        id: item.selected && item.isActionsGroup ? itemIds : '',
        actionsListIds:
          item.selected && item.isActionsGroup
            ? Object.values(actions.data)
                .filter(
                  (a) => a.id.includes(':') && a.id.startsWith(`${itemIds}`)
                )
                .map((a) => a.id)
            : [],
      })
      setSelectedActionsGroup({
        id: selectedActionsGroup === itemIds ? '' : itemIds,
        isActionsGroup: item.isActionsGroup,
      })
    }
  }

  const deselectAction = (id: string) => {
    const selectedActionData = apiRef.current!.getItem(id)
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
      if (parts.length) {
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
        }
      } else {
        filteredItemIds = [cur]

        if (selectedAction) {
          deselectAction(selectedAction)
        }
      }
    }

    if (!itemIds.length && selectedAction) {
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
