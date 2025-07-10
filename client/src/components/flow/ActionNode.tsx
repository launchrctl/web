import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import ActionButton from './ActionButton'
import { components } from '../../../openapi'

type ActionNodeType = Node<
  {
    action: components['schemas']['ActionShort']
  },
  'action'
>

function ActionNode({ data }: NodeProps<ActionNodeType>) {
  return (
    <div>
      <Handle type="target" position={Position.Top} />
      <ActionButton action={data.action} />
    </div>
  )
}

export default memo(ActionNode)
