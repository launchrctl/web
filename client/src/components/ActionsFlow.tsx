import 'reactflow/dist/style.css'

import FlowBg from '/images/flow-bg.svg'
import FlowBgDark from '/images/flow-bg-dark.svg'
import Dagre from '@dagrejs/dagre'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import { FC, useEffect, useState } from 'react'
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

import { actions as testActions } from './testActions'
import {
  getNodesAndEdges,
  elementsScaleCoef,
  actionWidth,
  actionHeight,
  grandFolderGap,
  folderLabelHeight,
  actionsGroupOuterGap,
  gapBetweenActions,
  layerColorSchemes,
} from '../utils/react-flow-builder'
import { GetListResponse, useList } from '@refinedev/core'
import { treeBuilder } from '../utils/tree-builder'
import { useTheme } from '@mui/material/styles'

const nodeTypes = {
  'node-start': NodeStart,
  'node-wrapper': NodeWrapper,
  'node-action': NodeAction,
}

const WhiteBand = ({ data }) => (
  <Box
    className="react-flow__node-default"
    sx={{
      typography: 'subtitle2',
      width: `${actionWidth}px`,
      height: `${actionHeight}px`,
      boxShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
      borderRadius: `${6 * elementsScaleCoef}px`,
      border: 0,
      paddingInline: `${18 * elementsScaleCoef}px`,
      textAlign: 'start',
      justifyContent: 'flex-start',
      display: 'flex',
      alignItems: 'center',
    }}
  >
    {data?.label}
  </Box>
)

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
          borderWidth: `2px`,
          width: `${8 * elementsScaleCoef}px`,
          height: `${8 * elementsScaleCoef}px`,
        }}
      />
    </>
  )
}

function NodeWrapper({ data }) {
  const { palette } = useTheme()
  const paletteIndex =
    (data.layerIndex && layerColorSchemes[data.layerIndex]) ||
    layerColorSchemes[0]
  return (
    <Paper
      sx={{
        height: '100%',
        backgroundColor: data.filled
          ? `rgb(${paletteIndex})`
          : `rgba(${paletteIndex}, 0.1)`,
        backgroundImage: 'none',
        borderRadius: `${6 * elementsScaleCoef}px`,
        outline: `${2 * elementsScaleCoef}px solid rgb(${paletteIndex})`,
      }}
    >
      <Box
        sx={{
          typography: 'subtitle2',
          backgroundColor: `rgb(${paletteIndex})`,
          borderBottomRightRadius: `${6 * elementsScaleCoef}px`,
          display: 'inline-flex',
          verticalAlign: 'top',
          height: `${folderLabelHeight}px`,
          alignItems: 'center',
          paddingInline: `${18 * elementsScaleCoef}px ${20 * elementsScaleCoef}px`,
          color: '#fff',
        }}
      >
        {data?.label}
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
            borderWidth: `2px`,
            width: `${8 * elementsScaleCoef}px`,
            height: `${8 * elementsScaleCoef}px`,
            top: `-${(folderLabelHeight / 2 + 4) * elementsScaleCoef}px`,
          }}
        />
      )}
    </Paper>
  )
}

function NodeAction({ data }) {
  return <WhiteBand data={data}></WhiteBand>
}

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

  useEffect(() => {
    // if (actions) {
    //   // TEST data actions
    //   testActions.forEach((testAction) => {
    //     actions.data.push(testAction)
    //   })
    // }

    const [receivedNodes, receivedEdges] = getNodesAndEdges(
      actions,
      palette?.mode
    )
    setNodes(receivedNodes)
    setEdges(receivedEdges)

    setLoading(false)
  }, [actions])

  useEffect(() => {
    const [receivedNodes, receivedEdges] = getNodesAndEdges(
      actions,
      palette?.mode
    )
    setEdges(receivedEdges)
  }, [palette.mode])

  return isLoading ? (
    <CircularProgress
      sx={{
        margin: 'auto',
      }}
    />
  ) : (
    <ReactFlow
      defaultViewport={{
        x: 50,
        y: 50,
        zoom: 0.6,
      }}
      nodes={nodes}
      nodeTypes={nodeTypes}
      edges={edges}
      onConnect={onConnect}
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
    </ReactFlow>
  )
}
