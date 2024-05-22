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
import { useSidebarTreeItemStates } from '../context/SidebarTreeItemStatesContext'
import { sanitizeDataForNewSchema } from '@rjsf/utils'
import { useTreeViewApiRef } from '@mui/x-tree-view'
import CheckIcon from '/images/check.svg'

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
  const { handleMouseEnter, handleMouseLeave } = useSidebarTreeItemStates()

  const wrappedHandleMouseLeave = () => {
    handleMouseLeave(itemId)
  }

  const wrappedHandleMouseEnter = () => {
    handleMouseEnter(itemId)
  }

  useEffect(() => {
    if (status.expanded && status.selected && item.isActionsGroup) {
      dispatch({ type: 'set-actions-list', id: itemId })
    } else if (
      status.selected &&
      !status.expanded &&
      item.fileType === 'action'
    ) {
      // dispatch({ type: 'set-action', id: itemId })
    }
  }, [status.expanded, status.selected])

  useEffect(() => {
    setSelectedAction(item.selected)
  }, [item.selected])

  return (
    <TreeItem2Provider itemId={itemId}>
      <CustomTreeItem2Root
        {...getRootProps({
          className: clsx('content', {
            'is-actions-group': item.isActionsGroup,
          }),
        })}
      >
        <CustomTreeItemContent
          // onMouseEnter={wrappedHandleMouseEnter}
          // onMouseLeave={wrappedHandleMouseLeave}
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
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])
  const dispatch = useActionDispatch()
  const { handleSelect, handleUnselect } = useSidebarTreeItemStates()

  useEffect(() => {
    if (actions?.data) {
      setItems(treeBuilder(actions))
    }
  }, [actions])

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
    }
  }

  const deselectAction = (id) => {
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
