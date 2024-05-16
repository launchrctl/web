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

const StyledTreeItemLabelText = styled(Typography)({
  fontSize: '11px',
  lineHeight: 1.54,
  letterSpacing: '0.11px',
  fontWeight: 'inherit',
}) as unknown as typeof Typography

interface CustomLabelProps {
  children: React.ReactNode
  icon?: React.ElementType
  expandable?: boolean
}

function CustomLabel({
  icon: Icon,
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
          <ItemPreviewIcon>{Icon}</ItemPreviewIcon>
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
      paddingLeft: depth * 16 + 32,
      backgroundColor: 'transparent',
    },
    '&:not(.is-action):hover': {
      backgroundColor: theme.palette.mode === 'dark' ? '#272727' : '#F2F4F7',
    },
    '&.is-action:hover': {
      textDecoration: 'underline',
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
  }
})

const isExpandable = (reactChildren: React.ReactNode) => {
  if (Array.isArray(reactChildren)) {
    return reactChildren.length > 0 && reactChildren.some(isExpandable)
  }
  return Boolean(reactChildren)
}

const getIconFromFileType = (fileType: FileType) => {
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
      dispatch({ type: 'set-action', id: itemId })
    }
  }, [status.expanded, status.selected])

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
          onMouseEnter={wrappedHandleMouseEnter}
          onMouseLeave={wrappedHandleMouseLeave}
          {...getContentProps({
            depth: item.depth,
            className: clsx('content', {
              'Mui-expanded': status.expanded,
              'Mui-selected': status.selected,
              'Mui-focused': status.focused,
              'Mui-disabled': status.disabled,
              'is-actions-group': item.isActionsGroup,
              'is-action': item.fileType === 'action',
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
              icon,
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
  return (
    <RichTreeView
      getItemLabel={getItemLabel}
      items={treeBuilder(actions)}
      slots={{ item: CustomTreeItem }}
    ></RichTreeView>
  )
}
