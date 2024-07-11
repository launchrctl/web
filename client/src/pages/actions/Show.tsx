import Button from '@mui/material/Button'
import {
  useApiUrl,
  useCustomMutation,
  useNotification,
  useOne,
  usePublish,
  useResource,
} from '@refinedev/core'
import { Show } from '@refinedev/mui'
import { IChangeEvent, withTheme } from '@rjsf/core'
import { Theme } from '@rjsf/mui'
import validator from '@rjsf/validator-ajv8'
import merge from 'lodash/merge'
import { FC, useContext, useEffect, useState } from 'react'

import { AppContext } from '../../context/AppContext'
import { IActionData, IFormValues } from '../../types'
import { customizeUiSchema } from '../../utils/helpers'

const Form = withTheme(Theme)

export const ActionShow: FC = () => {
  const { id: idFromRoute, identifier } = useResource()
  const publish = usePublish()
  const { addAction } = useContext(AppContext)
  const { open } = useNotification()
  const [actionRunning, setActionRunning] = useState(false)

  const queryResult = useOne<IActionData>({
    resource: identifier,
    id: idFromRoute,
  })
  const { isFetching, data } = queryResult
  const apiUrl = useApiUrl()
  const { mutateAsync } = useCustomMutation()

  // Fetch schema and customize uiSchema
  const jsonschema = data?.data?.jsonschema
  let uischema = { ...data?.data?.uischema?.uiSchema }
  if (jsonschema) {
    delete jsonschema.$schema
    uischema = merge({}, uischema, customizeUiSchema(jsonschema))
  }

  useEffect(() => {
    if (!jsonschema && !isFetching) {
      open?.({
        type: 'error',
        message: 'Schema not found',
        description: 'The action schema could not be retrieved.',
      })
    }
  }, [jsonschema, open, isFetching])

  // Handle form submission
  const onSubmit = async ({ formData }: IChangeEvent<IFormValues>) => {
    if (!formData) return

    setActionRunning(true)
    publish?.({
      channel: 'processes',
      type: 'get-processes',
      payload: { action: idFromRoute },
      date: new Date(),
    })

    try {
      const result = await mutateAsync({
        url: `${apiUrl}/actions/${idFromRoute}`,
        method: 'post',
        values: formData,
        successNotification: {
          message: 'Action successfully created.',
          description: 'Success with no errors',
          type: 'success',
        },
        errorNotification: {
          message: 'Error.',
          description: 'Something went wrong',
          type: 'error',
        },
      })

      if (result && idFromRoute) {
        addAction({
          id: idFromRoute.toString(),
          title: jsonschema?.title,
          description: jsonschema?.description,
        })
        publish?.({
          channel: 'process',
          type: 'get-process',
          payload: { action: result.data.id },
          date: new Date(),
        })
      }
    } catch (error) {
      console.error('Error creating action:', error)
      open?.({
        type: 'error',
        message: 'Action creation failed',
      })
    } finally {
      setActionRunning(false)
    }
  }

  return (
    <Show isLoading={isFetching} title="">
      {jsonschema && (
        <Form
          schema={jsonschema}
          uiSchema={uischema}
          validator={validator}
          onSubmit={onSubmit}
        >
          <Button variant="contained" type="submit" disabled={actionRunning}>
            Submit
          </Button>
        </Form>
      )}
    </Show>
  )
}
