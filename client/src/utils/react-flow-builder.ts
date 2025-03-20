import { GetListResponse } from '@refinedev/core'
import { sentenceCase, splitActionId } from './helpers'
import { Node } from '@xyflow/react'

export const getRootNodes = (actions: GetListResponse | undefined) => {
  if (!actions) {
    return []
  }

  const roots = new Set()

  for (const item of actions.data) {
    if (!item.id || typeof item.id !== 'string') {
      continue
    }
    const { levels } = splitActionId(item.id)
    if (levels.length < 1) {
      continue
    }
    roots.add(levels[0])
  }


  const newRoots: Node[] = Array.from(roots).map((root, i) => ({
    id: root as string,
    type: 'rootDirectory',
    data: { label: sentenceCase(root as string), actions, id: root as string },
    position: { x: 500, y: (i + 1) * 100 },
    className: 'flow-directory',
    draggable: false,
    zIndex: 1000,
    selectable: true,
  }))
  return [...newRoots]
}
