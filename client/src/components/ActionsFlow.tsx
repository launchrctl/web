import 'reactflow/dist/style.css'

import FlowBg from '/images/flow-bg.svg'
import FlowBgDark from '/images/flow-bg-dark.svg'
import Dagre from '@dagrejs/dagre'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import { FC, useContext, useEffect, useState } from 'react'
import { useCallback } from 'react'
import ActionIcon from '/images/action.svg'
import CheckIcon from '/images/check.svg'
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
import { useSidebarTreeItemStates } from '../context/SidebarTreeItemStatesContext'
import {
  getNodesAndEdges,
  elementsScaleCoef,
  actionWidth,
  actionHeight,
  grandFolderGap,
  folderLabelHeight,
  actionsGroupOuterGap,
  gapBetweenActions,
  buildNodeColor,
} from '../utils/react-flow-builder'
import { GetListResponse, useList } from '@refinedev/core'
import { treeBuilder } from '../utils/tree-builder'
import { styled, useTheme } from '@mui/material/styles'
import * as React from 'react'
import { useActionDispatch } from '../context/ActionContext'

const nodeTypes = {
  'node-start': NodeStart,
  'node-wrapper': NodeWrapper,
  'node-action': NodeAction,
}

const WhiteBand = ({ data, type }) => {
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(data.isActive)
  }, [data.isActive])

  return (
    <Box
      className="react-flow__node-default"
      sx={{
        typography: 'subtitle2',
        width: `${actionWidth}px`,
        height: `${actionHeight}px`,
        boxShadow: `0 ${elementsScaleCoef}px ${elementsScaleCoef}px rgba(0, 0, 0, 0.2)`,
        borderRadius: `${6 * elementsScaleCoef}px`,
        border: 0,
        paddingInline: `${12 * elementsScaleCoef}px`,
        textAlign: 'start',
        gap: `${12 * elementsScaleCoef}px`,
        justifyContent: 'space-between',
        backgroundColor: active
          ? 'rgba(255, 255, 255, 0.65)'
          : data.isHovered
            ? 'rgba(255, 255, 255, 0.8)'
            : '',
        display: 'flex',
        alignItems: 'center',
        fontSize: `${16 * elementsScaleCoef}px`,
        cursor: type === 'node-action' ? 'pointer' : 'auto',
        '&:hover': {
          backgroundColor: `rgba(255, 255, 255, ${active ? '0.65' : '0.8'})`,
        },
      }}
    >
      {data?.label}
      {type === 'node-action' && (
        <Box
          sx={{
            color: '#000',
            '& img': {
              display: 'block',
              width: `${16 * elementsScaleCoef}px`,
              height: `${16 * elementsScaleCoef}px`,
            },
          }}
        >
          <img src={active ? CheckIcon : ActionIcon} />
        </Box>
      )}
    </Box>
  )
}

function NodeStart({ data }) {
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
          borderWidth: `${2 * elementsScaleCoef}px`,
          width: `${8 * elementsScaleCoef}px`,
          height: `${8 * elementsScaleCoef}px`,
          minWidth: 0,
          minHeight: 0,
          right: `-${4 * elementsScaleCoef}px`,
        }}
      />
    </>
  )
}

function NodeWrapper({ data }) {
  const { palette } = useTheme()
  return (
    <Paper
      sx={{
        height: '100%',
        backgroundColor: buildNodeColor({
          index: data.layerIndex,
          isFilled: data.filled,
          isDarker: data.filled && data.isHovered,
          isHovered: data.isHovered,
        }),
        backgroundImage: 'none',
        borderRadius: `${6 * elementsScaleCoef}px`,
        outline: `${2 * elementsScaleCoef}px solid ${buildNodeColor({
          index: data.layerIndex,
          isFilled: true,
          isDarker: data.isHovered,
        })}`,
      }}
    >
      <Box
        sx={{
          typography: 'subtitle2',
          backgroundColor: buildNodeColor({
            index: data.layerIndex,
            isFilled: true,
            isDarker: data.isHovered,
          }),
          borderBottomRightRadius: `${6 * elementsScaleCoef}px`,
          borderTopLeftRadius: `${6 * elementsScaleCoef}px`,
          display: 'inline-flex',
          verticalAlign: 'top',
          fontSize: `${16 * elementsScaleCoef}px`,
          gap: `${12 * elementsScaleCoef}px`,
          height: `${folderLabelHeight}px`,
          alignItems: 'center',
          paddingInline: `${12 * elementsScaleCoef}px`,
          paddingBlockEnd: !data.filled && `${2 * elementsScaleCoef}px`,
          width: data.filled && '100%',
          color: '#fff',
        }}
      >
        {data?.label}
        {data.actionsAmount && (
          <Box
            sx={{
              backgroundColor: '#fff',
              borderRadius: `${5 * elementsScaleCoef}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: `${2 * elementsScaleCoef}px`,
              padding: `${2 * elementsScaleCoef}px ${11 * elementsScaleCoef}px ${2 * elementsScaleCoef}px ${7 * elementsScaleCoef}px`,
              color: '#000',
              marginInlineStart: data.filled && 'auto',
              '& img': {
                display: 'block',
                width: `${16 * elementsScaleCoef}px`,
                height: `${16 * elementsScaleCoef}px`,
              },
            }}
          >
            <img src={ActionIcon} />
            {data.actionsAmount}
          </Box>
        )}
      </Box>
      {data.topLayer && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            position: 'relative',
            left: `-${5 * elementsScaleCoef}px`,
            transform: 'none',
            backgroundColor: palette?.mode === 'dark' ? '#000' : '#fff',
            borderColor: palette?.mode === 'dark' ? '#fff' : '#000',
            borderWidth: `${2 * elementsScaleCoef}px`,
            width: `${8 * elementsScaleCoef}px`,
            height: `${8 * elementsScaleCoef}px`,
            minWidth: 0,
            minHeight: 0,
            top: `-${folderLabelHeight / 2 + 4 * elementsScaleCoef}px`,
          }}
        />
      )}
    </Paper>
  )
}

function NodeAction({ data, type }) {
  return <WhiteBand data={data} type={type}></WhiteBand>
}

const ReactFlowStyled = styled(ReactFlow)(() => ({
  '.react-flow__node.nopan': {
    cursor: 'auto',
  },
  '.react-flow__edge.nopan': {
    cursor: 'auto',
  },
  '.react-flow__handle.connectionindicator': {
    cursor: 'auto',
  },
}))

interface IActionsFlowProps {
  actions: GetListResponse | undefined
}

export const ActionsFlow: FC<IActionsFlowProps> = ({ actions }) => {
  const { palette } = useTheme()
  const [isLoading, setLoading] = useState(true)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  )
  const dispatch = useActionDispatch()
  const { state: nodeUIState } = useSidebarTreeItemStates()

  useEffect(() => {
    const [receivedNodes, receivedEdges] = getNodesAndEdges(
      actions,
      palette?.mode
    )

    setNodes(receivedNodes)
    setEdges(receivedEdges)

    setLoading(false)
  }, [actions])

  useEffect(() => {
    if (
      nodeUIState &&
      nodeUIState.id &&
      nodes &&
      nodes.some((a) => a.id === nodeUIState.id)
    ) {
      setNodes((prev) => {
        if (nodeUIState.isHovered === true) {
          prev
            .filter((a) => a.id !== nodeUIState.id && a.data.isHovered === true)
            .forEach((prevMatched) => {
              prevMatched.data.isHovered = false
            })
        }
        const matched = prev.find((a) => a.id === nodeUIState.id)
        matched.data.isHovered = nodeUIState.isHovered
        return [...prev]
      })
    }
  }, [nodeUIState])

  useEffect(() => {
    const [, receivedEdges] = getNodesAndEdges(actions, palette?.mode)
    setEdges(receivedEdges)
  }, [palette.mode])

  const [nodeData, setNodeData] = useState(undefined)

  const nodeClickHandler = (e, node) => {
    if (!nodeData) {
      node.data.isActive = true
      setNodeData(node)
      dispatch({ type: 'set-action', id: node.id })
    } else {
      setNodeData((prev) => {
        prev.data.isActive = false
        return prev
      })
      setNodeData(undefined)
      dispatch({ type: 'default' })

      if (nodeData.id !== node.id) {
        node.data.isActive = true
        setNodeData(node)
        dispatch({ type: 'set-action', id: node.id })
      }
    }
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
      onConnect={onConnect}
      nodesConnectable={false}
    >
      <Controls />
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
