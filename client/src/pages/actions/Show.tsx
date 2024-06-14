import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import {
  useApiUrl,
  useCustomMutation,
  useNotification,
  useOne,
  useResource,
} from '@refinedev/core'
import { Show } from '@refinedev/mui'
import type { IChangeEvent } from '@rjsf/core'
import { withTheme } from '@rjsf/core'
import { Theme } from '@rjsf/mui'
import validator from '@rjsf/validator-ajv8'
import type { FC } from 'react'
import { useState } from 'react'

import { RunningActionsList } from '../../components/RunningActionsList'
import type { IActionData, IFormValues } from '../../types'
import { customizeUiSchema } from '../../utils/helpers'

// Make modifications to the theme with your own fields and widgets
const Form = withTheme(Theme)

export const ActionShow: FC = () => {
  // @todo const translate = useTranslate();
  const {
    // resource,
    id: idFromRoute,
    // action: actionFromRoute,
    identifier,
  } = useResource()

  const { open } = useNotification()

  const [actionRunning, setActionRunning] = useState(false)

  const queryResult = useOne<IActionData>({
    resource: identifier,
    id: idFromRoute,
  })

  const { isFetching } = queryResult

  const jsonschema = queryResult?.data?.data?.jsonschema
  let uischema = {
    ...queryResult?.data?.data?.uischema?.uiSchema,
  }

  if (jsonschema) {
    // @todo I actually don't know for the moment how to overcome error
    //  "no schema with key or ref" produced when schema is defined.
    // Maybe it's because the server returns "2020-12" and default is "draft-07"
    // @see https://ajv.js.org/json-schema.html
    delete jsonschema.$schema

    uischema = {
      ...uischema,
      ...customizeUiSchema(jsonschema),
    }
  }

  const apiUrl = useApiUrl()

  const { mutateAsync } = useCustomMutation()

  const onSubmit = async (
    { formData }: IChangeEvent<IFormValues>
    // e: FormEvent<IFormValues>,
  ) => {
    if (!formData) {
      return
    }

    setActionRunning(true)

    await mutateAsync({
      url: `${apiUrl}/actions/${idFromRoute}`,
      method: 'post',
      values: formData,
      // @todo more informative messages.
      successNotification: () => ({
        message: 'Action successfully started.',
        description: 'Success with no errors',
        type: 'success',
      }),
      errorNotification() {
        return {
          message: 'Error.',
          description: 'Something goes wrong',
          type: 'error',
        }
      },
    })
    // @todo redirect somewhere
  }

  const onActionRunFinished = async () => {
    setActionRunning(false)
    open?.({
      type: 'success',
      message: 'All actions runs finished',
      description: 'Success!',
    })
  }

  return (
    <Show isLoading={isFetching} title="">
      <RunningActionsList
        actionId={idFromRoute ? idFromRoute.toString() : ''}
        actionRunning={actionRunning}
        onActionRunFinished={onActionRunFinished}
      />
      <Divider
        sx={{
          my: 4,
        }}
      />
      {jsonschema && (
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
    </Show>
  )
}
