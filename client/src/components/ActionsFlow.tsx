import Dagre from '@dagrejs/dagre'
import '@xyflow/react/dist/style.css'
import { useEffect, useMemo } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Position,
  Background,
  BackgroundVariant,
} from '@xyflow/react'
import { getCustomisation } from '../utils/page-customisation'
import { GetListResponse } from '@refinedev/core'
import { FC } from 'react'
import { getRootNodes } from '../utils/react-flow-builder'
import RootDirectory from './flow/RootDirectory'

const nodeTypes = {
  rootDirectory: RootDirectory,
}

const nameText =
    getCustomisation()?.plasmactl_web_ui_platform_name ?? 'Platform'

const initialRoots: Node[] = [
  {
    id: 'start',
    data: { label: nameText },
    position: { x: 0, y: 0 },
    sourcePosition: Position.Right,
    targetPosition: Position.Right,
    width: 300,
    height: 60,
    className: 'flow-action flow-action--start',
    draggable: false,
  },
]

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR' })

  nodes.forEach((node) => {
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
    })
  })

  edges.forEach((edge) => g.setEdge(edge.source, edge.target))

  Dagre.layout(g)

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id)
      const x =
        node?.type === 'rootDirectory'
          ? 400
          : position.x - (node.measured?.width ?? 0) / 2
      const y = position.y - (node.measured?.height ?? 0) / 2
      return { ...node, position: { x, y } }
    }),
    edges,
  }
}

const LayoutFlow = ({ rootNodes }: { rootNodes: Node[] | undefined }) => {
  const { palette } = useTheme()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([
    ...initialRoots,
    ...(rootNodes || []),
  ])
  const edgesDependencies = useMemo(() => [rootNodes], [rootNodes])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    useMemo(
      () =>
        rootNodes?.map((node) => ({
          id: `${node.id}-start`,
          source: 'start',
          target: node.id,
          type: 'smoothstep',
          style: { strokeWidth: 2 },
          pathOptions: { borderRadius: 20 },
        })) || [],
      edgesDependencies
    )
  )

  useEffect(() => {
    if (!rootNodes) return
    const layouted = getLayoutedElements(nodes, edges)
    setNodes(layouted.nodes)
    setEdges(layouted.edges)
  }, [rootNodes])

  const backgroundCrossColor = palette?.mode === 'dark' ? '#272727' : '#C8C9CD'

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      colorMode={palette?.mode === 'dark' ? 'dark' : 'light'}
      nodeTypes={nodeTypes}
      fitView
      selectNodesOnDrag={false}
      nodesConnectable={false}
      nodesFocusable={false}
      edgesFocusable={false}
      zoomOnDoubleClick={false}
      elementsSelectable={false}
      defaultViewport={{
        x: 50,
        y: 50,
        zoom: 0.6,
      }}
    >
      <Background
        id="1"
        gap={10}
        color="#f1f1f1"
        variant={BackgroundVariant.Lines}
      />
      <Background id="2" gap={100} variant={BackgroundVariant.Lines} />
      <Background
        id="3"
        gap={100}
        color={backgroundCrossColor}
        variant={BackgroundVariant.Cross}
      />
      <Controls showInteractive={false} />
    </ReactFlow>
  )
}

export const ActionsFlow: FC<{
  actions: GetListResponse | undefined
}> = ({ actions }) => {
  const rootNodes = getRootNodes(actions)

  return (
    <ReactFlowProvider>
      <LayoutFlow rootNodes={rootNodes} />
    </ReactFlowProvider>
  )
}
