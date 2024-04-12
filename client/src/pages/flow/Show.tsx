import { useList } from '@refinedev/core'
import { type FC } from 'react'
import { ActionProvider } from '../../context/ActionContext'

import { ActionsFlow } from '../../components/ActionsFlow'
import { FormFlow } from '../../components/FormFlow'
import { SidebarFlow } from '../../components/SidebarFlow'

export const FlowShow: FC = () => {
  const { data: actions } = useList({
    resource: 'actions',
  })
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      <ActionProvider>
        <FormFlow />
        <SidebarFlow actions={actions} />
        <ActionsFlow />
      </ActionProvider>
    </div>
  )
}
