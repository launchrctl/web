import { GetListResponse } from '@refinedev/core'

import { IAction } from '../types'
import { sentenceCase, splitActionId } from '../utils/helpers'

export type FileType = 'folder' | 'app' | 'action'

interface ExtendedTreeItemProps {
  id: string
  label?: string
  description?: string
  fileType: FileType
  depth: number
  isActionsGroup?: boolean
  children?: ExtendedTreeItemProps[]
}

const addAction = (to: ExtendedTreeItemProps, what: IAction, depth: number) => {
  to.children?.push({
    ...what,
    fileType: 'action',
    depth,
  })
}

export const treeBuilder = (actions: GetListResponse<IAction>) => {
  const tree: ExtendedTreeItemProps[] | undefined = []
  if (actions.data) {
    for (const action of actions.data) {
      const { levels } = splitActionId(action.id)
      let currentNode: ExtendedTreeItemProps[] | undefined = tree
      let idPath = ''

      for (let index = 0; index < levels.length; index++) {
        const level = levels[index]
        idPath = idPath ? `${idPath}.${level}` : level

        const alreadyExist: ExtendedTreeItemProps | undefined =
          currentNode?.find((a) => a.id === idPath)
        if (alreadyExist) {
          if (index === levels.length - 1) {
            addAction(alreadyExist, action, index + 1)
          }
          currentNode = alreadyExist.children
        } else {
          const obj: ExtendedTreeItemProps = {
            id: idPath,
            label: sentenceCase(level),
            fileType: levels[index - 1] === 'roles' ? 'app' : 'folder',
            depth: index,
            children: [],
            isActionsGroup: false,
          }

          if (index === levels.length - 1) {
            obj.isActionsGroup = !actions.data.some((a) =>
              a.id.includes(`${idPath}.`)
            )
            addAction(obj, action, index + 1)
          }

          if (currentNode) {
            currentNode.push(obj)
          }
          currentNode = obj.children
        }
      }
    }
  }

  return tree
}
