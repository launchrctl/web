import '../wizard-form.css'

import { Breadcrumbs, Paper } from '@mui/material'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import {
  useApiUrl,
  useCustomMutation,
  useNotification,
  useOne,
  usePublish,
} from '@refinedev/core'
import type { IChangeEvent } from '@rjsf/core'
import { withTheme } from '@rjsf/core'
import { Theme } from '@rjsf/mui'
import validator from '@rjsf/validator-ajv8'
import isEqual from 'lodash/isEqual'
import merge from 'lodash/merge'
import { type FC, useEffect, useState } from 'react'

import { components } from '../../openapi'
import formTemplates from '../components/rjsf/templates'
import formWidgets from '../components/rjsf/widgets'
import { useAction, useActionDispatch } from '../hooks/ActionHooks'
import {
  customizeUiSchema,
  extractDateTimeFromId,
  sentenceCase,
  splitActionId,
} from '../utils/helpers'

interface IFormValues {
  id: string
}

const Form = withTheme(Theme)

export const FormFlow: FC<{
  actionId: string
  formType: 'full' | 'sidebar' | 'wizard'
  onSubmitCallback?: (actionId: string) => void
}> = ({ actionId, formType = 'sidebar', onSubmitCallback }) => {
  const [changed, setChanged] = useState<Set<string>>(new Set())
  const [formValues, setFormValues] = useState<IFormValues | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [previousSubmit, setPreviousSubmit] = useState<IFormValues | null>(null)
  const apiUrl = useApiUrl()
  const publish = usePublish()
  const { mutateAsync } = useCustomMutation()
  const { open } = useNotification()
  const { levels } = splitActionId(actionId)
  const dispatch = useActionDispatch()
  const { running } = useAction()
  const actionRunning = running?.has(actionId)

  const queryResult = useOne<components['schemas']['ActionFull']>({
    resource: 'actions',
    id: actionId,
  })
  const { isFetching, data } = queryResult

  // Fetch schema and customize uiSchema
  const jsonschema = data?.data?.jsonschema
  let uischema = data?.data?.uischema?.uiSchema

  if (jsonschema) {
    delete jsonschema.$schema
    uischema = merge({}, uischema, customizeUiSchema(jsonschema))
    if (uischema && uischema[formType]) {
      uischema = merge({}, uischema, uischema[formType])
    }
  }

  // Reset formValues to null on each rerender
  useEffect(() => {
    setFormValues(null)
  }, [actionId])

  useEffect(() => {
    if (!jsonschema && !isFetching && open) {
      open({
        type: 'error',
        message: 'Schema not found',
        description: 'The action schema could not be retrieved.',
      })
    }
  }, [jsonschema, isFetching, open])

  const onSubmit = async ({ formData }: IChangeEvent<IFormValues>) => {
    if (!formData) return

    if (isEqual(formData, previousSubmit)) {
      setOpenDialog(true)
    } else {
      await handleSubmission(formData)
    }
  }

  const handleSubmission = async (formData: IFormValues) => {
    if (onSubmitCallback) {
      onSubmitCallback(actionId)
    }
    try {
      const result = await mutateAsync({
        url: `${apiUrl}/actions/${actionId}`,
        method: 'post',
        values: { ...formData, changed: [...changed] },
        successNotification: (data) => {
          return {
            description: `Action started successfully.`,
            message: data?.data?.id
              ? extractDateTimeFromId(data?.data?.id as string)
              : '',
            type: 'success',
          }
        },
        errorNotification: () => {
          return {
            message: 'Error.',
            description: 'Something went wrong',
            type: 'error',
          }
        },
      })

      if (result && actionId) {
        dispatch?.({
          type: 'start-action',
          id: actionId,
        })
        dispatch?.({
          type: 'set-process',
          process: result.data as components['schemas']['ActionRunInfo'],
        })
        publish?.({
          channel: 'processes',
          type: 'get-processes',
          payload: { action: actionId },
          date: new Date(),
        })
        publish?.({
          channel: 'process',
          type: 'get-process',
          payload: { action: result.data.id },
          date: new Date(),
        })
        setPreviousSubmit(formData)
      }
    } catch (error: unknown) {
      console.error('Error creating action:', error)

      let message = 'An unknown error occurred'
      if (typeof error === 'object' && error !== null && 'message' in error) {
        message = String((error as { message: unknown }).message)
      } else if (typeof error === 'string') {
        message = error
      }

      open?.({
        type: 'error',
        message,
        description: 'Error creating action:',
      })
    }
  }

  const handleDialogClose = (confirm: boolean) => {
    setOpenDialog(false)
    if (confirm) {
      handleSubmission(formValues as IFormValues) // Submit the previous form values
    }
  }

  const handleChange = (
    data: IChangeEvent<IFormValues>,
    id: string | undefined
  ) => {
    if (data.formData !== undefined && !isEqual(data.formData, formValues)) {
      setFormValues(data.formData)
    } else if (data.formData === undefined) {
      setFormValues(null)
    }

    // If an id exists, update the changed set
    if (id) {
      setChanged((prevChanged) => new Set(prevChanged).add(id))
    }
  }

  return (
    <>
      {formType === 'sidebar' && (
        <Breadcrumbs
          sx={{
            marginBottom: 0.5,
            '.MuiBreadcrumbs-separator': {
              marginInline: 0.5,
            },
          }}
        >
          {levels.map((a, i) => (
            <Typography
              key={i}
              sx={{
                color: (theme) =>
                  theme.palette.mode === 'dark' ? '#fff' : '#667085',
                fontSize: 11,
                fontWeight: 600,
                lineHeight: 1.45,
                letterSpacing: '0.22px',
              }}
            >
              {sentenceCase(a)}
            </Typography>
          ))}
        </Breadcrumbs>
      )}
      {!isFetching && (
        <Form
          idSeparator={'____'}
          schema={jsonschema || {}}
          uiSchema={uischema || {}}
          formData={formValues}
          validator={validator}
          onSubmit={onSubmit}
          templates={formTemplates[formType]}
          onChange={handleChange}
          className={`${formType}-form`}
          widgets={formWidgets[formType]}
          disabled={actionRunning}
        >
          {(formType === 'sidebar' || formType === 'full') && (
            <Button variant="contained" type="submit" disabled={actionRunning}>
              Submit
            </Button>
          )}

          {formType === 'wizard' && (
            <Paper
              sx={{
                display: 'flex',
                justifyContent: 'end',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#fcfcfd',
                borderTop: '1px solid #e4e7ec',
              }}
            >
              <Button
                type="submit"
                variant="contained"
                disabled={actionRunning}
              >
                Save
              </Button>
            </Paper>
          )}
        </Form>
      )}

      <Dialog open={openDialog} onClose={() => handleDialogClose(false)}>
        <DialogTitle>Confirm Submission</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The form data is the same as the previous submission. Do you want to
            proceed with the submission?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDialogClose(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={() => handleDialogClose(true)} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
