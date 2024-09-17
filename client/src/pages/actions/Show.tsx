import { useResource } from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { FC } from 'react'
import { FormFlow } from '../../components/FormFlow'

export const ActionShow: FC = () => {
  const { id: idFromRoute } = useResource()
  return (
    <Show title="">
      <FormFlow actionId={idFromRoute as string} isFullpage={true} />
    </Show>
  )
}
