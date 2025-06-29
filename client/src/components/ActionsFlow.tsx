import Dagre from '@dagrejs/dagre'
import '@xyflow/react/dist/style.css'
import { useEffect, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  Controls,
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  type Node,
  type Edge,
  type ReactFlowInstance,
} from '@xyflow/react'
import { getCustomisation } from '../utils/page-customisation'
import { GetListResponse } from '@refinedev/core'
import { FC } from 'react'
import { getAllNodesAndEdges } from '../utils/react-flow-builder'
import RootDirectory from './flow/RootDirectory'
import ActionNode from './flow/ActionNode'

const nodeTypes = {
  rootDirectory: RootDirectory,
  action: ActionNode,
}

const nameText =
    getCustomisation()?.plasmactl_web_ui_platform_name ?? 'Platform'

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB' })

  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: node.measured?.width ?? 300,
      height: node.measured?.height ?? 80,
    })
  })

  edges.forEach((edge) => g.setEdge(edge.source, edge.target))

  Dagre.layout(g)

  return {
    nodes: nodes.map((node) => {
      const pos = g.node(node.id)
      return {
        ...node,
        position: {
          x: node.type === 'rootDirectory' ? 400 : pos.x - 100,
          y: pos.y - 40,
        },
      }
    }),
    edges,
  }
}

export const LayoutFlow = ({
  startNodes,
  startEdges,
}: {
  startNodes?: Node[]
  startEdges?: Edge[]
}) => {
  const theme = useTheme()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)

  useEffect(() => {
    if (!startNodes || !startEdges) return
    const layouted = getLayoutedElements(startNodes, startEdges)
    setNodes(layouted.nodes)
    setEdges(layouted.edges)
  }, [startNodes, startEdges])

  useEffect(() => {
    if (rfInstance && nodes.length > 0) {
      rfInstance.fitView({ padding: 0.3, duration: 0 }) // 🔥 no animation, just centering
    }
  }, [rfInstance, nodes.length, edges.length])

  const backgroundCrossColor = theme.palette.mode === 'dark' ? '#272727' : '#C8C9CD'

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onInit={setRfInstance}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView={false}
      selectNodesOnDrag={false}
      nodesConnectable={false}
      nodesFocusable={false}
      edgesFocusable={false}
      zoomOnDoubleClick={false}
      elementsSelectable={false}
      colorMode={theme.palette.mode === 'dark' ? 'dark' : 'light'}
      defaultViewport={{ x: 50, y: 50, zoom: 0.6 }}
    >
      <Background id="1" gap={10} color="#f1f1f1" variant={BackgroundVariant.Lines} />
      <Background id="2" gap={100} variant={BackgroundVariant.Lines} />
      <Background id="3" gap={100} color={backgroundCrossColor} variant={BackgroundVariant.Cross} />
      <Controls showInteractive={false} />
    </ReactFlow>
  )
}

export const ActionsFlow: FC<{
  actions: GetListResponse | undefined
}> = ({ actions }) => {
  const { nodes, edges } = getAllNodesAndEdges(actions, nameText)

  return (
    <ReactFlowProvider>
      <LayoutFlow startNodes={nodes} startEdges={edges} />
    </ReactFlowProvider>
  )
}
