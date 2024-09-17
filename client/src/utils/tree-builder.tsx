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
  node: ExtendedTreeItemProps,
  action: components['schemas']['ActionShort'],
  depth: number
) => {
  node.children?.push({
    ...action,
    fileType: 'action',
    depth,
  })
}

export const treeBuilder = (
  actions: components['schemas']['ActionShort'][]
): ExtendedTreeItemProps[] => {
  if (actions.length === 0) return []

  const tree: ExtendedTreeItemProps[] = []

  actions.forEach((action) => {
    const { levels } = splitActionId(action.id as string)
    if (!levels || levels.length === 0) return

    let currentNode = tree
    let idPath = ''

    levels.forEach((level, index) => {
      idPath = idPath ? `${idPath}.${level}` : level
      const existingNode = currentNode.find((node) => node.id === idPath)

      if (existingNode) {
        if (index === levels.length - 1) {
          addAction(
            existingNode,
            action as components['schemas']['ActionShort'],
            index + 1
          )
        }
        currentNode = existingNode.children ?? []
      } else {
        const newNode: ExtendedTreeItemProps = {
          id: idPath,
          label: sentenceCase(level),
          fileType: levels[index - 1] === 'roles' ? 'app' : 'folder',
          depth: index,
          children: [],
          isActionsGroup: false,
        }

        if (index === levels.length - 1) {
          newNode.isActionsGroup = !actions.some((a) =>
            a?.id?.includes(`${idPath}.`)
          )
          addAction(
            newNode,
            action as components['schemas']['ActionShort'],
            index + 1
          )
        }

        currentNode.push(newNode)
        currentNode = newNode.children ?? []
      }
    })
  })

  return tree
}
