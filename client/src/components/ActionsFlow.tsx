import 'reactflow/dist/style.css'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import { styled, useTheme } from '@mui/material/styles'
import { GetListResponse } from '@refinedev/core'
import _debounce from 'lodash/debounce'
import {
  FC,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useState,
} from 'react'
import * as React from 'react'
import Flow, {
  Background,
  Controls,
  Handle,
  type Node,
  NodeTypes,
  Position,
  ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from 'reactflow'

import ActionIcon from '/images/action.svg'
import CheckIcon from '/images/check.svg'
import FlowBg from '/images/flow-bg.svg'
import FlowBgDark from '/images/flow-bg-dark.svg'

import { useActionDispatch } from '../hooks/ActionHooks'
import { useFlowClickedActionID } from '../hooks/ActionsFlowHooks'
import {
  useSidebarTreeItemClickStates,
  useSidebarTreeItemMouseStates,
} from '../hooks/SidebarTreeItemStatesHooks'
import { IFlowNodeType } from '../types'
import {
  actionHeight,
  actionWidth,
  buildNodeColor,
  elementsScaleCoef,
  folderLabelHeight,
  getNodesAndEdges,
} from '../utils/react-flow-builder'

type INodeData = {
  actionsAmount?: number
  filled?: boolean
  topLayer?: boolean
  description?: string
  isActive: boolean
  isHovered: boolean
  label?: string
  layerIndex?: boolean
  type: IFlowNodeType
}

const nodeTypes: NodeTypes = {
  'node-start': NodeStart,
  'node-wrapper': NodeWrapper,
  'node-action': NodeAction,
}
const WhiteBand = ({ data }: { data: INodeData }) => {
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(data.isActive)
  }, [data.isActive])

  return (
    <Box
      className="react-flow__node-default"
      sx={{
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
          data.layerIndex === undefined
            ? ''
            : buildNodeColor({
                index: Number(data.layerIndex),
                isFilled: true,
              }),
        backgroundImage:
          data.layerIndex === undefined || (!active && !data.isHovered)
            ? 'linear-gradient(#fff, #fff)'
            : `linear-gradient(rgba(255, 255, 255, ${active ? '0.65' : '0.8'}), rgba(255, 255, 255, ${active ? '0.65' : '0.8'}))`,
        display: 'flex',
        alignItems: 'center',
        cursor: data.type === 'node-action' ? 'pointer' : 'auto',
        '&:hover': {
          backgroundImage:
            data.layerIndex === undefined
              ? 'linear-gradient(#fff, #fff)'
              : `linear-gradient(rgba(255, 255, 255, ${active ? '0.65' : '0.8'}), rgba(255, 255, 255, ${active ? '0.65' : '0.8'}))`,
        },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gap: 0.5,
        }}
      >
        <Box
          sx={{
            typography: 'subtitle2',
            fontSize: `${16 * elementsScaleCoef}px`,
            lineHeight: 1,
          }}
        >
          {data?.label}
        </Box>
        {data?.description && (
          <Box
            sx={{
              typography: 'subtitle2',
              fontSize: `${11 * elementsScaleCoef}px`,
              color: '#667085',
              lineHeight: 1.2,
            }}
          >
            {data?.description}
          </Box>
        )}
      </Box>
      {data.type === 'node-action' && (
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
function NodeWrapper({ data }: { data: INodeData }) {
  const { palette } = useTheme()
  return (
    <Paper
      sx={{
        height: '100%',
        backgroundColor: buildNodeColor({
          index: Number(data.layerIndex),
          isFilled: data.filled,
          isDarker: data.filled && data.isHovered,
          isHovered: data.isHovered,
        }),
        backgroundImage: 'none',
        borderRadius: `${6 * elementsScaleCoef}px`,
        outline: `${2 * elementsScaleCoef}px solid ${buildNodeColor({
          index: Number(data.layerIndex),
          isFilled: true,
          isDarker: data.isHovered,
        })}`,
      }}
    >
      <Box
        sx={{
          typography: 'subtitle2',
          backgroundColor: buildNodeColor({
            index: Number(data.layerIndex),
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
          paddingBlockEnd: data.filled ? '' : `${2 * elementsScaleCoef}px`,
          width: data.filled ? '100%' : 'auto',
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
              marginInlineStart: data.filled ? 'auto' : '',
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
  const [nodes, setNodes] = useNodesState([])
  const [edges, setEdges] = useEdgesState([])
  const dispatch = useActionDispatch()
  const { state: nodeClickState } = useSidebarTreeItemClickStates()
  const { state: nodeMouseState } = useSidebarTreeItemMouseStates()
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance>()
  const { setFlowClickedActionId } = useFlowClickedActionID()

  useEffect(() => {
    const [receivedNodes, receivedEdges] = getNodesAndEdges(
      actions,
      palette?.mode
    )

    setNodes(receivedNodes)
    setEdges(receivedEdges)

    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions])

  useEffect(() => {
    if (
      nodeClickState &&
      nodeClickState.id &&
      nodes &&
      nodes.some((a) => a.id === nodeClickState.id)
    ) {
      setNodes((prev) => {
        if (nodeClickState.isActive) {
          for (const prevMatched of prev.filter(
            (a) => a.id !== nodeClickState.id && a.data.isActive === true
          )) {
            prevMatched.data.isActive = false
          }
        }
        const matched = prev.find((a) => a.id === nodeClickState.id)
        if (matched) {
          matched.data.isActive = nodeClickState.isActive
        }
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
        if (flowInstance) {
          flowInstance.fitView({
            duration: 400,
            maxZoom,
            nodes: [{ id: nodeClickState.id }],
          })
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          if (nodeMouseState.isHovered) {
            for (const prevMatched of prev.filter(
              (a) => a.id !== nodeMouseState.id && a.data.isHovered === true
            )) {
              prevMatched.data.isHovered = false
            }
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

    const debouncedUpdate = _debounce(() => {
      componentUpdate()
    }, 25)

    if (nodeMouseState && nodeMouseState.useDebounce) {
      debouncedUpdate()
    } else {
      componentUpdate(true)
    }
    return () => {
      debouncedUpdate.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeMouseState])

  useEffect(() => {
    const [, receivedEdges] = getNodesAndEdges(actions, palette?.mode)
    setEdges(receivedEdges)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palette.mode])

  const [nodeData, setNodeData] = useState<Node>()

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
      setFlowClickedActionId({
        id: node.id,
        isActive: false,
      })
      if (nodeClickState) {
        nodeClickState.isActive = false
      }
      setNodeData(undefined)
      dispatch?.({
        type: 'set-actions-sidebar',
        id: node.id,
      })

      return
    }
    if (node.type !== 'node-action') return
    if (nodeClickState?.isActive) {
      if (nodeClickState.id === node.id) {
        setNodes((prev) => {
          const matched = prev.find((a) => a.id === nodeClickState.id)
          if (matched) {
            matched.data.isActive = false
          }

          return [...prev]
        })
        setFlowClickedActionId({
          id: node.id,
          isActive: false,
        })
        setNodeData(undefined)
        dispatch?.({
          id: '',
        })
        nodeClickState.isActive = false
      } else {
        setNodes((prev) => {
          const oldMatched = prev.find((a) => a.id === nodeClickState.id)
          if (oldMatched) {
            oldMatched.data.isActive = false
          }

          const newMatched = prev.find((a) => a.id === node.id)
          if (newMatched) {
            newMatched.data.isActive = true
          }

          return [...prev]
        })
        setFlowClickedActionId({
          id: node.id,
          isActive: true,
        })
        setNodeData(node)
        dispatch?.({
          type: 'set-actions-sidebar',
          id: node.id,
        })
        nodeClickState.isActive = false
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
          setFlowClickedActionId({
            id: node.id,
            isActive: true,
          })
          node.data.isActive = true
          setNodeData(node)
          dispatch?.({
            type: 'set-actions-sidebar',
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
          setFlowClickedActionId({
            id: node.id,
            isActive: false,
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
          setFlowClickedActionId({
            id: node.id,
            isActive: true,
          })
          setNodeData(node)
          dispatch?.({
            type: 'set-actions-sidebar',
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
        setFlowClickedActionId({
          id: node.id,
          isActive: true,
        })
        node.data.isActive = true
        setNodeData(node)
        dispatch?.({
          type: 'set-actions-sidebar',
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
