import { GetListResponse } from '@refinedev/core'
import { sentenceCase, splitActionId } from './helpers'
import { Edge, Node, Position } from '@xyflow/react'

export const getAllNodesAndEdges = (
  actions: GetListResponse | undefined,
  nameText: string
): { nodes: Node[]; edges: Edge[] } => {
  if (!actions?.data) return { nodes: [], edges: [] }

  const nodesMap = new Map<string, Node>()
  const edgesMap = new Map<string, Edge>()
  const rootLevelSet = new Set<string>()

  // Start node
  const initialNode: Node = {
    id: 'start',
    data: { label: sentenceCase(nameText) },
    position: { x: 0, y: 0 },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    width: 300,
    height: 60,
    className: 'flow-action flow-action--start',
    draggable: false,
  }

  nodesMap.set(initialNode.id, initialNode)

  let yOffset = 1

  for (const item of actions.data) {
    if (!item.id || typeof item.id !== 'string') continue

    const { levels, id: actionId, isRoot, isAction } = splitActionId(item.id)

    let path = ''
    levels.forEach((level, i) => {
      path = path ? `${path}.${level}` : level

      if (!nodesMap.has(path)) {
        nodesMap.set(path, {
          id: path,
          data: { label: sentenceCase(level), action: item },
          position: { x: i * 300 + 300, y: yOffset * 80 },
          type: 'default',
        })
        yOffset++
      }

      if (i > 0) {
        const prev = levels.slice(0, i).join('.')
        const edgeId = `e${prev}-${path}`
        if (!edgesMap.has(edgeId)) {
          edgesMap.set(edgeId, {
            id: edgeId,
            source: prev,
            target: path,
            type: 'smoothstep',
            className: 'flow-edge',
            style: { strokeWidth: 2 },
          })
        }
      }
    })

    // Track root-level nodes for connection from 'start'
    if (!isRoot && levels.length > 0 && levels[0]) {
      rootLevelSet.add(levels[0])
    }

    if (isAction) {
      const actionNodeId = isRoot ? actionId : `${levels.join('.')}:${actionId}`
      const parentId = isRoot ? 'start' : levels.join('.')

      if (typeof actionNodeId === 'string' && !nodesMap.has(actionNodeId)) {
        nodesMap.set(actionNodeId, {
          id: actionNodeId,
          data: { action: item },
          position: { x: (levels.length + 1) * 300 + 300, y: yOffset * 80 },
          type: 'action',
          className: isRoot ? 'flow-action flow-action--root' : 'flow-action',
          draggable: true,
        })
        yOffset++
      }

      const edgeId = `e${parentId}-${actionNodeId}`
      if (!edgesMap.has(edgeId)) {
        edgesMap.set(edgeId, {
          id: edgeId,
          source: parentId,
          target: actionNodeId ?? '',
          type: 'smoothstep',
          className: 'flow-edge',
          style: { strokeWidth: 2 },
        })
      }
    }
  }

  // Add edges from start → all unique root-level nodes (non-isRoot)
  for (const rootId of rootLevelSet) {
    const edgeId = `e_start-${rootId}`
    if (!edgesMap.has(edgeId) && nodesMap.has(rootId)) {
      edgesMap.set(edgeId, {
        id: edgeId,
        source: 'start',
        target: rootId,
        type: 'smoothstep',
        className: 'flow-edge',
        style: { strokeWidth: 2 },
      })
    }
  }

  return {
    nodes: Array.from(nodesMap.values()),
    edges: Array.from(edgesMap.values()),
  }
}
