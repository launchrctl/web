import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import type { BaseRecord, IResourceComponentsProps } from '@refinedev/core'
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
import type { RJSFSchema } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import type { FC } from 'react'
import { useState } from 'react'

import { RunningActionsList } from '../../components/RunningActionsList'

// @todo move to types
interface IActionData extends BaseRecord {
  jsonschema: RJSFSchema
}

interface IFormValues {
  id: string
}

// Make modifications to the theme with your own fields and widgets
const Form = withTheme(Theme)

export const ActionShow: FC<IResourceComponentsProps> = () => {
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

  if (jsonschema) {
    // @todo I actually don't know for the moment how to overcome error
    //  "no schema with key or ref" produced when schema is defined.
    // Maybe it's because the server returns "2020-12" and default is "draft-07"
    // @see https://ajv.js.org/json-schema.html
    delete jsonschema.$schema
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
      {jsonschema && (
        <Form schema={jsonschema} validator={validator} onSubmit={onSubmit}>
          <div>
            <Button variant="contained" type="submit" disabled={actionRunning}>
              Submit
            </Button>
          </div>
        </Form>
      )}
      <Divider
        sx={{
          my: 4,
        }}
      />
      <RunningActionsList
        actionId={idFromRoute ? idFromRoute.toString() : ''}
        actionRunning={actionRunning}
        onActionRunFinished={onActionRunFinished}
      />
    </Show>
  )
}
