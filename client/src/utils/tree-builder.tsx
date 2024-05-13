export type FileType = 'folder' | 'app' | 'action'

interface ExtendedTreeItemProps {
  id: string
  label: string
  description?: string
  fileType: FileType
  depth: number
  actionsGroup?: boolean
  children?: []
}

const addAction = (
  to: ExtendedTreeItemProps,
  what: ExtendedTreeItemProps,
  depth: number
) => {
  to.children.push({
    ...what,
    fileType: 'action',
    depth,
  })
}

export const treeBuilder = (actions: any = []) => {
  const tree = []
  if (actions.data)
    for (const action of actions.data) {
      const [path] = action.id.split(':')
      const levels = path.split('.')
      let idPath: string
      levels.reduce((acc, level, index) => {
        let obj: ExtendedTreeItemProps = {}
        idPath = idPath ? `${idPath}.${level}` : level
        const alreadyExist = acc.find((a) => a.id === idPath)
        if (alreadyExist) {
          if (index === levels.length - 1) {
            alreadyExist.actionsGroup = true
            addAction(alreadyExist, action, index + 1)
          }
          return alreadyExist.children
        }

        obj.id = idPath
        obj.label = level
        obj.fileType = levels[index - 1] === 'roles' ? 'app' : 'folder'
        obj.depth = index
        obj.children = []
        obj.isActionsGroup = false

        if (index === levels.length - 1) {
          obj.isActionsGroup = true
          addAction(obj, action, index + 1)
        }

        acc.push(obj)

        return acc.find((a) => a.id === idPath).children
      }, tree)
    }

  return tree
}
