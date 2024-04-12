import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import type { FC } from 'react'

import { treeBuilder } from '../utils/tree-builder'
import { useActionDispatch } from '../context/ActionContext'

export const SidebarTree: FC = ({ actions }) => {
  const dispatch = useActionDispatch()

  const renderTree = (tree) => {
    return (
      <>
        {Object.keys(tree).map((element) => {
          return (
            <TreeItem key={element} itemId={element} label={element}>
              {Array.isArray(tree[element])
                ? tree[element].map((action) => {
                    return (
                      <TreeItem
                        key={action.id}
                        itemId={action.id}
                        label={action.title}
                        onClick={() => {
                          dispatch({ type: 'set-action', id: action.id })
                        }}
                      ></TreeItem>
                    )
                  })
                : renderTree(tree[element])}
            </TreeItem>
          )
        })}
      </>
    )
  }

  return <SimpleTreeView>{renderTree(treeBuilder(actions))}</SimpleTreeView>
}
