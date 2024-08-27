import { GetListResponse } from '@refinedev/core'

import { components } from '../../openapi'
import { sentenceCase, splitActionId } from '../utils/helpers'

export type FileType = 'folder' | 'app' | 'action'

export interface ExtendedTreeItemProps {
  id: string
  label?: string
  title?: string
  description?: string
  fileType: FileType
  depth: number
  isActionsGroup?: boolean
  children?: ExtendedTreeItemProps[]
}

const addAction = (
  to: ExtendedTreeItemProps,
  what: components['schemas']['ActionShort'],
  depth: number
) => {
  to.children?.push({
    ...what,
    fileType: 'action',
    depth,
  })
}

export const treeBuilder = (
  actions: GetListResponse | undefined
): ExtendedTreeItemProps[] => {
  const tree: ExtendedTreeItemProps[] | undefined = []
  if (actions?.data) {
    for (const action of actions.data) {
      const { levels } = splitActionId(action.id as string)
      let currentNode: ExtendedTreeItemProps[] | undefined = tree
      let idPath = ''
      if (levels && levels.length > 0) {
        for (let index = 0; index < levels.length; index++) {
          const level = levels[index] ?? ''
          idPath = idPath ? `${idPath}.${level}` : level

          const alreadyExist: ExtendedTreeItemProps | undefined =
            currentNode?.find((a) => a.id === idPath)
          if (alreadyExist) {
            if (index === levels.length - 1) {
              addAction(
                alreadyExist,
                action as components['schemas']['ActionShort'],
                index + 1
              )
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
              obj.isActionsGroup = !actions.data.some((a) => {
                return (
                  a.id &&
                  typeof a.id === 'string' &&
                  a.id.includes(`${idPath}.`)
                )
              })
              addAction(
                obj,
                action as components['schemas']['ActionShort'],
                index + 1
              )
            }

            if (currentNode) {
              currentNode.push(obj)
            }
            currentNode = obj.children
          }
        }
      }
    }
  }

  return tree
}
