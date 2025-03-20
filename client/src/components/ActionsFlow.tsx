import 'reactflow/dist/style.css'

import CircularProgress from '@mui/material/CircularProgress'
import { styled, useTheme } from '@mui/material/styles'
import { GetListResponse } from '@refinedev/core'
import {
  FC,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useState,
} from 'react'
import Flow, {
  Background,
  Controls,
  Handle,
  type Node,
  NodeTypes,
  Position,
  ReactFlowInstance,
  useNodesState,
} from 'reactflow'

import WhiteBand from './flow/WhiteBand'
import NodeWrapper from './flow/NodeWrapper'

import FlowBg from '/images/flow-bg.svg'
import FlowBgDark from '/images/flow-bg-dark.svg'

import { useAction, useActionDispatch } from '../hooks/ActionHooks'
import { INodeData } from '../types'
import { getNodes, getEdges } from '../utils/react-flow-builder'
import { UI_SCALE } from '../utils/constants'

const nodeTypes: NodeTypes = {
  'node-start': NodeStart,
  'node-wrapper': NodeWrapper,
  'node-action': NodeAction,
}

function NodeStart({ data }: { data: INodeData }) {
  const { palette } = useTheme()
  return (
    <>
      <WhiteBand data={data}></WhiteBand>
      <Handle
        type="source"
        position={Position.Right}
        style={{
          backgroundColor: palette?.mode === 'dark' ? '#000' : '#fff',
          borderColor: palette?.mode === 'dark' ? '#fff' : '#000',
          borderWidth: `${2 * UI_SCALE}px`,
          width: `${8 * UI_SCALE}px`,
          height: `${8 * UI_SCALE}px`,
          minWidth: 0,
          minHeight: 0,
          right: `-${4 * UI_SCALE}px`,
        }}
      />
    </>
  )
}

function NodeAction({ data }: { data: INodeData }) {
  return (
    <WhiteBand
      data={{
        ...data,
        type: 'node-action',
      }}
    ></WhiteBand>
  )
}

const ReactFlowStyled = styled(Flow)(() => ({
  '.react-flow__handle.connectionindicator': {
    cursor: 'inherit',
    pointerEvents: 'none',
  },
}))

export const ActionsFlow: FC<{
  actions: GetListResponse | undefined
}> = ({ actions }) => {
  const { palette } = useTheme()
  const [isLoading, setLoading] = useState(true)
  const [nodes, setNodes] = useNodesState([])
  const dispatch = useActionDispatch()
  const { id: nodeId } = useAction()
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance>()
  const [nodeData, setNodeData] = useState<Node>()

  useEffect(() => {
    const receivedNodes = getNodes(actions)

    if (receivedNodes) {
      setNodes(receivedNodes)
    }
    setLoading(false)
  }, [actions])

  const edges = getEdges(actions)

  useEffect(() => {
    if (nodeId && nodes && nodes.some((a) => a.id === nodeId)) {
      setNodes((prev) => {
        if (nodeId) {
          for (const prevMatched of prev.filter(
            (a) => a.id !== nodeId && a.data.isActive === true
          )) {
            prevMatched.data.isActive = false
          }
        }
        const matched = prev.find((a) => a.id === nodeId)
        if (matched) {
          matched.data.isActive = true
        }
        return [...prev]
      })
      if (nodeId) {
        const maxZoom = 0.6

        if (flowInstance) {
          flowInstance.fitView({
            duration: 400,
            maxZoom,
            nodes: [{ id: nodeId }],
          })
        }
      }
    }
  }, [nodeId])

  const nodeClickHandler = (e: ReactMouseEvent, node: Node) => {
    const target = e.target as HTMLElement
    if (
      target.classList.contains('actions-pill') ||
      target.closest('.actions-pill')
    ) {
      setNodes((prev) => {
        const oldMatched = prev.find((a) => a.data.isActive === true)
        if (oldMatched) {
          oldMatched.data.isActive = false
        }

        return [...prev]
      })

      setNodeData(undefined)
      dispatch?.({
        type: 'set-active-action',
        id: node.id,
      })

      return
    }
    if (node.type !== 'node-action') return
    if (nodeId) {
      if (nodeId === node.id) {
        setNodes((prev) => {
          const matched = prev.find((a) => a.id === nodeId)
          if (matched) {
            matched.data.isActive = false
          }

          return [...prev]
        })
        setNodeData(undefined)
        dispatch?.({
          id: '',
        })
      } else {
        setNodes((prev) => {
          const oldMatched = prev.find((a) => a.id === nodeId)
          if (oldMatched) {
            oldMatched.data.isActive = false
          }

          const newMatched = prev.find((a) => a.id === node.id)
          if (newMatched) {
            newMatched.data.isActive = true
          }

          return [...prev]
        })
        setNodeData(node)
        dispatch?.({
          type: 'set-active-action',
          id: node.id,
        })
      }
    } else {
      if (nodeData) {
        if (node.id === nodeData.id && !nodeData.data.isActive) {
          setNodes((prev) => {
            const matched = prev.find((a) => a.id === node.id)
            if (matched) {
              matched.data.isActive = true
            }

            return [...prev]
          })
          node.data.isActive = true
          setNodeData(node)
          dispatch?.({
            type: 'set-active-action',
            id: node.id,
          })
        } else if (node.id === nodeData.id && nodeData.data.isActive) {
          setNodes((prev) => {
            const matched = prev.find((a) => a.id === node.id)
            if (matched) {
              matched.data.isActive = false
            }

            return [...prev]
          })
          setNodeData(undefined)
          dispatch?.({
            id: '',
          })
        } else if (node.id !== nodeData.id) {
          setNodes((prev) => {
            const oldMatched = prev.find((a) => a.id === nodeData.id)
            if (oldMatched) {
              oldMatched.data.isActive = false
            }

            const newMatched = prev.find((a) => a.id === node.id)
            if (newMatched) {
              newMatched.data.isActive = true
            }

            return [...prev]
          })
          setNodeData(node)
          dispatch?.({
            type: 'set-active-action',
            id: node.id,
          })
        }
      } else {
        setNodes((prev) => {
          const matched = prev.find((a) => a.id === node.id)
          if (matched) {
            matched.data.isActive = true
          }

          return [...prev]
        })
        node.data.isActive = true
        setNodeData(node)
        dispatch?.({
          type: 'set-active-action',
          id: node.id,
        })
      }
    }
  }

  const onInit = (instance: ReactFlowInstance) => {
    setFlowInstance(instance)
  }

  return isLoading ? (
    <CircularProgress
      sx={{
        margin: 'auto',
      }}
    />
  ) : (
    <ReactFlowStyled
      defaultViewport={{
        x: 50,
        y: 50,
        zoom: 0.6,
      }}
      nodes={nodes}
      nodeTypes={nodeTypes}
      edges={edges}
      onNodeClick={nodeClickHandler}
      nodesConnectable={false}
      onInit={onInit}
      nodesDraggable={false}
      edgesFocusable={false}
      zoomOnDoubleClick={false}
      elementsSelectable={false}
    >
      <Controls showInteractive={false} />
      <Background
        color={'none'}
        style={{
          backgroundImage: `url(${palette?.mode === 'dark' ? FlowBgDark : FlowBg})`,
          backgroundSize: '60px',
          backgroundPosition: '-35px -35px',
          backgroundColor: palette?.mode === 'dark' ? '#272727' : '#fbfbfb',
        }}
      />
    </ReactFlowStyled>
  )
}
