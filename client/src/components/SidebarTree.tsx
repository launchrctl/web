import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useTreeViewApiRef } from '@mui/x-tree-view'
import { RichTreeView } from '@mui/x-tree-view/RichTreeView'
import { TreeItemProps } from '@mui/x-tree-view/TreeItem'
import {
  TreeItem2Content,
  TreeItem2IconContainer,
  TreeItem2Label,
  TreeItem2Root,
} from '@mui/x-tree-view/TreeItem2'
import { TreeItem2Icon } from '@mui/x-tree-view/TreeItem2Icon'
import { unstable_useTreeItem2 as useTreeItem2 } from '@mui/x-tree-view/useTreeItem2'
import { UseTreeItem2ContentSlotProps } from '@mui/x-tree-view/useTreeItem2/useTreeItem2.types'
import { GetListResponse } from '@refinedev/core'
import { clsx } from 'clsx'
import {
  FC,
  forwardRef,
  type ReactNode,
  type Ref,
  SyntheticEvent,
  useEffect,
  useState,
} from 'react'

import ActionIcon from '/images/action.svg'
import AppIcon from '/images/app.svg'
import CheckIcon from '/images/check.svg'
import FolderIcon from '/images/folder.svg'

import { components } from '../../openapi'
import { useAction, useActionDispatch } from '../hooks/ActionHooks'
import { splitActionId } from '../utils/helpers'
import {
  ExtendedTreeItemProps,
  type FileType,
  treeBuilder,
} from '../utils/tree-builder'

const StyledTreeItemLabelText = styled(Typography)({
  fontSize: '11px',
  lineHeight: 1.54,
  letterSpacing: '0.11px',
  fontWeight: 'inherit',
}) as unknown as typeof Typography

interface CustomLabelProps {
  icon?: ReactNode
  iconClassnames?: string
  children?: ReactNode
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

const CustomTreeItemContent = styled(TreeItem2Content)<
  UseTreeItem2ContentSlotProps & {
    depth: number
  }
>(({ theme, depth }) => {
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

const isExpandable = (reactChildren: ReactNode): boolean => {
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

  return <img alt={''} src={path} />
}

const CustomTreeItem = forwardRef(function CustomTreeItem(
  props: TreeItemProps,
  ref: Ref<HTMLLIElement>
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

  const api = publicAPI as {
    getItem: (id: string) => {
      fileType: FileType | 'action-selected'
      selected: boolean
      isActionsGroup?: boolean
      depth: number
    }
  }
  const item = api.getItem(itemId)

  const expandable = isExpandable(children)
  const icon = getIconFromFileType(item.fileType)

  return (
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
            icon: status.selected
              ? getIconFromFileType('action-selected')
              : icon,
            iconClassnames: status.selected ? 'check-mark' : '',
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
  )
})

function getItemLabel(item: ExtendedTreeItemProps): string {
  return item.title || (item.label as string)
}

export const SidebarTree: FC<{ actions: GetListResponse | undefined }> = ({
  actions,
}) => {
  const apiRef = useTreeViewApiRef()
  const [items, setItems] = useState<ExtendedTreeItemProps[]>([])
  const { id: nodeId } = useAction()
  const { levels } = splitActionId(nodeId)
  const dispatch = useActionDispatch()

  const [expandedItems, setExpandedItems] = useState<string[]>(
    levels.map((_, index) => levels.slice(0, index + 1).join('.'))
  )

  useEffect(() => {
    if (actions?.data) {
      setItems(
        treeBuilder(actions.data as components['schemas']['ActionShort'][])
      )
    }
  }, [actions])

  const onSelectedItemsChange = (
    event: SyntheticEvent,
    itemIds: string | null
  ) => {
    if (!itemIds) {
      return
    }

    dispatch?.({
      type: 'set-active-action',
      id: itemIds,
    })
  }

  const onExpandedItemsChange = (
    event: SyntheticEvent,
    expandedItemIds: string[]
  ) => {
    setExpandedItems(expandedItemIds)
  }

  return (
    <RichTreeView
      selectedItems={nodeId}
      apiRef={apiRef}
      onSelectedItemsChange={onSelectedItemsChange}
      onExpandedItemsChange={onExpandedItemsChange}
      expandedItems={expandedItems}
      getItemLabel={getItemLabel}
      items={items}
      slots={{ item: CustomTreeItem }}
    />
  )
}
