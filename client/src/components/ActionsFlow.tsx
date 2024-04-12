import 'reactflow/dist/style.css'

import Dagre from '@dagrejs/dagre'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import type { FC } from 'react'
import { useCallback } from 'react'
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  useEdgesState,
  useNodesState,
} from 'reactflow'

import { initialEdges, initialNodes } from './nodes'

const nodeTypes = {
  'node-start': NodeStart,
  'node-wrapper': NodeWrapper,
  'node-action': NodeAction,
}

const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))

const getLayoutedElements = (nodes, edges, options) => {
  g.setGraph({ rankdir: options.direction })

  for (const edge of edges) g.setEdge(edge.source, edge.target)
  for (const node of nodes) g.setNode(node.id, node)

  Dagre.layout(g)

  return {
    nodes: nodes.map((node) => {
      const { x, y } = g.node(node.id)

      return { ...node, position: { x, y } }
    }),
    edges,
  }
}

function NodeStart({ data }) {
  return (
    <>
      <div className="react-flow__node-default">{data?.label}</div>
      <Handle type="source" position={Position.Right} />
    </>
  )
}

function NodeWrapper({ data }) {
  return (
    <Paper sx={{ height: '100%', backgroundColor: 'rgba(255, 0, 0, 0.2)' }}>
      <Box sx={{ typography: 'caption' }}>{data?.label}</Box>
      <Handle type="target" position={Position.Left} />
    </Paper>
  )
}

function NodeAction({ data }) {
  return (
    <>
      <div className="react-flow__node-default">{data?.label}</div>
    </>
  )
}

export const ActionsFlow: FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  )

  return (
    <ReactFlow
      nodes={nodes}
      nodeTypes={nodeTypes}
      fitView
      preventScrolling={false}
      edges={edges}
      onConnect={onConnect}
    >
      <Controls />
      <MiniMap />
      <Background variant="dots" gap={10} size={1} />
    </ReactFlow>
  )
}
