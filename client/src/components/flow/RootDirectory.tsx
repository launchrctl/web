import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'

import { components } from '../../../openapi'

type ActionsNode = Node<
  {
    actions: {
      data: components['schemas']['ActionShort'][]
    }
    id: string
  },
  'actions, id'
>

function RootDirectory({ data }: NodeProps<ActionsNode>) {
  return (
    <div>
      <Handle type="target" position={Position.Top} />
      <div>{data.id}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default memo(RootDirectory)
