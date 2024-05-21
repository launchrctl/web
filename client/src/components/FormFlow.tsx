import {
  useApiUrl,
  useCustomMutation,
  useNotification,
  useOne,
  useResource,
} from '@refinedev/core'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { type FC, useState, useEffect } from 'react'
import { withTheme } from '@rjsf/core'
import { Theme } from '@rjsf/mui'
import type { IChangeEvent } from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { useStartAction, useUpdateOutput, useFinishAction, useErrorAction } from '../context/ActionContext';

import type { IActionData, IFormValues } from '../types'

const Form = withTheme(Theme)

function TitleFieldTemplate<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
}: TitleFieldProps<T, S, F>) {
  return (
    <Box id={id}>
      <Typography variant='h6'>{title}</Typography>
      <Divider />
    </Box>
  );
}

export const FormFlow: FC = ({ actionId }) => {
  const [actionRunning, setActionRunning] = useState(false)
  const startAction = useStartAction();
  const updateOutput = useUpdateOutput();
  const finishAction = useFinishAction();
  const errorAction = useErrorAction();
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

    await mutateAsync({
      url: `${apiUrl}/actions/${actionId}`,
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
            Submit
          </Button>
        </Form>
      )}
    </>
  )
}
