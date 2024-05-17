import {
  useApiUrl,
  useCustomMutation,
  useNotification,
  useOne,
  useResource,
} from '@refinedev/core'
import Button from '@mui/material/Button'
import { type FC, useState, useEffect } from 'react'
import { withTheme } from '@rjsf/core'
import { Theme } from '@rjsf/mui'
import type { IChangeEvent } from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'

import type { IActionData, IFormValues } from '../types'

const Form = withTheme(Theme)

export const FormFlow: FC = ({ actionId }) => {
  const [actionRunning, setActionRunning] = useState(false)

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

    // setActionRunning(true)

    // await mutateAsync({
    //   url: `${apiUrl}/actions/${idFromRoute}`,
    //   method: 'post',
    //   values: formData,
    //   // @todo more informative messages.
    //   successNotification: () => ({
    //     message: 'Action successfully started.',
    //     description: 'Success with no errors',
    //     type: 'success',
    //   }),
    //   errorNotification() {
    //     return {
    //       message: 'Error.',
    //       description: 'Something goes wrong',
    //       type: 'error',
    //     }
    //   },
    // })
    // @todo redirect somewhere
  }

  return (
    <>
      {!isFetching && (
        <Form
          schema={jsonschema}
          uiSchema={uischema}
          validator={validator}
          onSubmit={onSubmit}
        >
          <div>
            <Button variant="contained" type="submit" disabled={actionRunning}>
              Submit
            </Button>
          </div>
        </Form>
      )}
    </>
  )
}
