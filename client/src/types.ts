type IFlowNodeType = 'node-start' | 'node-wrapper' | 'node-action'

type INodeData = {
  actionsAmount?: number
  filled?: boolean
  topLayer?: boolean
  description?: string
  isExecuting: boolean
  isActive: boolean
  isHovered: boolean
  label?: string
  layerIndex?: boolean
  type: IFlowNodeType
}

type FlowColor = {
  index?: number
  isFilled?: boolean
  isHovered?: boolean
  isDarker?: boolean
}

export type { IFlowNodeType, INodeData, FlowColor }
