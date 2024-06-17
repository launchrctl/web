export const sentenceCase = (a: string) => {
  const b = a.replaceAll(/[_-]/g, ' ')
  return b.charAt(0).toUpperCase() + b.slice(1)
}

export const splitActionId = (actionId: string) => {
  const [path, id] = actionId.split(':')
  const levels = path.split('.')
  return { levels, id }
}
