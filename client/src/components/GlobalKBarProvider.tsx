import { useList } from '@refinedev/core'
import { KBarProvider, KBarProviderProps } from '@refinedev/kbar'
import { FC, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { components } from '../../openapi'
import { useActionDispatch } from '../hooks/ActionHooks'

interface Props {
  children: ReactNode
}

export const GlobalKBarProvider: FC<Props> = ({ children }) => {
  const { data, isLoading, isError } = useList<
    components['schemas']['ActionShort']
  >({
    resource: 'actions',
  })
  const dispatch = useActionDispatch()
  const navigate = useNavigate()

  if (!isError && !isLoading) {
    const kbar: KBarProviderProps['actions'] = []
    data?.data?.forEach((action) => {
      kbar.push({
        id: action.id,
        name: `${action.title} (${action.id})`,
        perform: () => {
          navigate('/flow')
          dispatch?.({
            type: 'set-active-action',
            id: action.id,
          })
        },
      })
    })
    return <KBarProvider actions={kbar}>{children}</KBarProvider>
  }
}
