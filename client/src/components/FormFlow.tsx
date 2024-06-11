import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import { useApiUrl, useCustomMutation, useOne } from '@refinedev/core'
import type { IChangeEvent } from '@rjsf/core'
import { withTheme } from '@rjsf/core'
import { Theme } from '@rjsf/mui'
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TitleFieldProps,
} from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import { type FC, useState } from 'react'

import { useStartAction } from '../hooks/ActionHooks'
import type { IActionData, IFormValues } from '../types'

const Form = withTheme(Theme)

function TitleFieldTemplate<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  F extends FormContextType = any,
>({ id, title }: TitleFieldProps<T, S, F>) {
  return (
    <Box id={id}>
      <Typography variant="subtitle2">{title}</Typography>
      <Divider />
    </Box>
  )
}

export const FormFlow: FC = ({ actionId }) => {
  const [actionRunning, setActionRunning] = useState(false)
  const startAction = useStartAction()
  const apiUrl = useApiUrl()
  const { mutateAsync } = useCustomMutation()

  const queryResult = useOne<IActionData>({
    resource: 'actions',
    id: actionId,
  })

  const { isFetching } = queryResult

  const jsonschema = queryResult?.data?.data?.jsonschema

  const uischema = queryResult?.data?.data?.uischema?.uiSchema || {}

  if (jsonschema) {
    // @todo I actually don't know for the moment how to overcome error
    //  "no schema with key or ref" produced when schema is defined.
    // Maybe it's because the server returns "2020-12" and default is "draft-07"
    // @see https://ajv.js.org/json-schema.html
    delete jsonschema.$schema
  }

  const onSubmit = async (
    { formData }: IChangeEvent<IFormValues>
    // e: FormEvent<IFormValues>,
  ) => {
    if (!formData) {
      return
    }

    setActionRunning(true)

    startAction(actionId)

    await mutateAsync(
      {
        url: `${apiUrl}/actions/${actionId}`,
        method: 'post',
        values: formData,
      },
      {
        onError: () => {
          console.log('error')
        },
        onSuccess: (data) => {
          console.log(data)
        },
      }
    )
  }

  return (
    <>
      {!isFetching && (
        <Form
          schema={jsonschema}
          uiSchema={uischema}
          validator={validator}
          onSubmit={onSubmit}
          templates={{ TitleFieldTemplate }}
        >
          <Button variant="contained" type="submit" disabled={actionRunning}>
            Form not working yet
          </Button>
          <Button type="button" href={`/actions/${actionId}/show`}>Go to form</Button>
        </Form>
      )}
    </>
  )
}
