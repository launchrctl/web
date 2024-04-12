export const treeBuilder = (actions: any = []) => {
  const tree = {}
  if (actions.data)
    for (const action of actions.data) {
      const [path, name] = action.id.split(':')
      const levels = path.split('.')
      levels.reduce((acc, level, index) => {
        if (index === levels.length - 1) {
          if (Array.isArray(acc[level])) {
            acc[level].push(action)
          } else {
            acc[level] = [action]
          }
        } else {
          if (acc[level] === undefined || typeof acc[level] !== 'object') {
            acc[level] = {}
          }
        }
        return acc[level]
      }, tree)
    }

  return tree
}
