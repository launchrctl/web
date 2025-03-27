import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import Directory from './Directory'
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
      <Handle type="target" position={Position.Left} />
      <Directory id={data.id} actions={data.actions} />
    </div>
  )
}

export default memo(RootDirectory)
