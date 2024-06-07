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
import { debounce } from 'lodash'
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Edge,
  EdgeChange,
  Handle,
  MiniMap,
  Position,
  ReactFlowInstance,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useStoreApi,
} from 'reactflow'
import {
  useSidebarTreeItemClickStates,
  useSidebarTreeItemMouseStates,
} from '../context/SidebarTreeItemStatesContext'
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
import { useFlowClickedActionID } from '../context/ActionsFlowContext'

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
        backgroundColor:
          data.layerIndex !== undefined
            ? buildNodeColor({
                index: data.layerIndex,
                isFilled: true,
              })
            : '',
        backgroundImage:
          data.layerIndex !== undefined
            ? active
              ? 'linear-gradient(rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.65))'
              : data.isHovered
                ? 'linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8))'
                : 'linear-gradient(#fff, #fff)'
            : 'linear-gradient(#fff, #fff)',
        display: 'flex',
        alignItems: 'center',
        fontSize: `${16 * elementsScaleCoef}px`,
        cursor: type === 'node-action' ? 'pointer' : 'auto',
        '&:hover': {
          backgroundImage:
            data.layerIndex !== undefined
              ? `linear-gradient(rgba(255, 255, 255, ${active ? '0.65' : '0.8'}), rgba(255, 255, 255, ${active ? '0.65' : '0.8'}))`
              : 'linear-gradient(#fff, #fff)',
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
            className={'actions-pill'}
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
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: `rgba(255, 255, 255, 0.8)`,
              },
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
  const [edges, setEdges] = useEdgesState([])
  const dispatch = useActionDispatch()
  const { state: nodeClickState } = useSidebarTreeItemClickStates()
  const { state: nodeMouseState } = useSidebarTreeItemMouseStates()
  const [flowInstance, setFlowInstance] = useState()
  const { setFlowClickedActionId } = useFlowClickedActionID()

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
      nodeClickState &&
      nodeClickState.id &&
      nodes &&
      nodes.some((a) => a.id === nodeClickState.id)
    ) {
      setNodes((prev) => {
        if (nodeClickState.isActive === true) {
          prev
            .filter(
              (a) => a.id !== nodeClickState.id && a.data.isActive === true
            )
            .forEach((prevMatched) => {
              prevMatched.data.isActive = false
            })
        }
        const matched = prev.find((a) => a.id === nodeClickState.id)
        matched.data.isActive = nodeClickState.isActive
        return [...prev]
      })
      if (nodeClickState.isActive) {
        let maxZoom = 0.6
        if (nodeClickState.id.includes(':')) {
          maxZoom = 0.8
        }
        if (nodeClickState.isActionsGroup) {
          maxZoom = 0.7
        }
        flowInstance.fitView({
          duration: 400,
          maxZoom,
          nodes: [{ id: nodeClickState.id }],
        })
      }
    }
  }, [nodeClickState])

  useEffect(() => {
    const componentUpdate = (initial = false) => {
      if (
        nodeMouseState &&
        nodeMouseState.id &&
        nodes &&
        nodes.some((a) => a.id === nodeMouseState.id)
      ) {
        setNodes((prev) => {
          if (nodeMouseState.isHovered === true) {
            prev
              .filter(
                (a) => a.id !== nodeMouseState.id && a.data.isHovered === true
              )
              .forEach((prevMatched) => {
                prevMatched.data.isHovered = false
              })
          }
          prev.map((a) => {
            if (!initial && a.id === nodeMouseState.id) {
              a.data.isHovered = nodeMouseState.isHovered
            }
            if (initial && a.data.isHovered) {
              a.data.isHovered = false
            }
            return a
          })
          return [...prev]
        })
      }
    }

    const debouncedUpdate = debounce(() => {
      componentUpdate()
    }, 15)

    if (nodeMouseState.useDebounce) {
      debouncedUpdate()
    } else {
      componentUpdate(true)
    }
    return () => {
      debouncedUpdate.cancel()
    }
  }, [nodeMouseState])

  useEffect(() => {
    const [, receivedEdges] = getNodesAndEdges(actions, palette?.mode)
    setEdges(receivedEdges)
  }, [palette.mode])

  const [nodeData, setNodeData] = useState(undefined)

  const nodeClickHandler = (e, node) => {
    if (
      e.target.classList.contains('actions-pill') ||
      e.target.closest('.actions-pill')
    ) {
      setNodes((prev) => {
        const oldMatched = prev.find((a) => a.data.isActive === true)
        if (oldMatched) {
          oldMatched.data.isActive = false
        }

        return [...prev]
      })
      setFlowClickedActionId({
        id: node.id,
        isActive: false,
      })
      setNodeData(undefined)
      dispatch({
        type: 'set-actions-list',
        id: node.id,
        actionsListIds: Object.values(nodes)
          .filter((a) => a.id.includes(':') && a.id.startsWith(`${node.id}`))
          .map((a) => a.id),
      })

      return
    }
    if (node.type !== 'node-action') return
    if (nodeClickState?.isActive) {
      if (nodeClickState.id === node.id) {
        setNodes((prev) => {
          const matched = prev.find((a) => a.id === nodeClickState.id)
          matched.data.isActive = false

          return [...prev]
        })
        setFlowClickedActionId({
          id: node.id,
          isActive: false,
        })
        setNodeData(undefined)
        dispatch({
          type: 'default',
          id: '',
        })
        nodeClickState.isActive = false
      } else {
        setNodes((prev) => {
          const oldMatched = prev.find((a) => a.id === nodeClickState.id)
          oldMatched.data.isActive = false

          const newMatched = prev.find((a) => a.id === node.id)
          newMatched.data.isActive = true

          return [...prev]
        })
        setFlowClickedActionId({
          id: node.id,
          isActive: true,
        })
        setNodeData(node)
        dispatch({
          type: 'set-action',
          id: node.id,
        })
        nodeClickState.isActive = false
      }
    } else {
      if (!nodeData) {
        setNodes((prev) => {
          const matched = prev.find((a) => a.id === node.id)
          matched.data.isActive = true

          return [...prev]
        })
        setFlowClickedActionId({
          id: node.id,
          isActive: true,
        })
        node.data.isActive = true
        setNodeData(node)
        dispatch({
          type: 'set-action',
          id: node.id,
        })
      } else {
        if (node.id === nodeData.id && !nodeData.data.isActive) {
          setNodes((prev) => {
            const matched = prev.find((a) => a.id === node.id)
            matched.data.isActive = true

            return [...prev]
          })
          setFlowClickedActionId({
            id: node.id,
            isActive: true,
          })
          node.data.isActive = true
          setNodeData(node)
          dispatch({
            type: 'set-action',
            id: node.id,
          })
        } else if (node.id === nodeData.id && nodeData.data.isActive) {
          setNodes((prev) => {
            const matched = prev.find((a) => a.id === node.id)
            matched.data.isActive = false

            return [...prev]
          })
          setFlowClickedActionId({
            id: node.id,
            isActive: false,
          })
          setNodeData(undefined)
          dispatch({
            type: 'default',
            id: '',
          })
        } else if (node.id !== nodeData.id) {
          setNodes((prev) => {
            const oldMatched = prev.find((a) => a.id === nodeData.id)
            oldMatched.data.isActive = false

            const newMatched = prev.find((a) => a.id === node.id)
            newMatched.data.isActive = true

            return [...prev]
          })
          setFlowClickedActionId({
            id: node.id,
            isActive: true,
          })
          setNodeData(node)
          dispatch({
            type: 'set-action',
            id: node.id,
          })
        }
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
