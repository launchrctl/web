import { Breadcrumbs } from '@mui/material'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
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
import { DescriptionFieldProps, TitleFieldProps } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import isEqual from 'lodash/isEqual'
import merge from 'lodash/merge'
import { type FC, useContext, useEffect, useState } from 'react'

import { components } from '../../openapi'
import { AppContext } from '../context/AppContext'
import {
  customizeUiSchema,
  sentenceCase,
  splitActionId,
} from '../utils/helpers'

interface IFormValues {
  id: string
}

const Form = withTheme(Theme)

export const FormFlow: FC<{ actionId: string; isFullpage?: boolean }> = ({
  actionId,
  isFullpage = false,
}) => {
  const [changed, setChanged] = useState<Set<string>>(new Set())
  const [formValues, setFormValues] = useState<IFormValues | null>(null)
  const [actionRunning, setActionRunning] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [previousSubmit, setPreviousSubmit] = useState<IFormValues | null>(null)
  const apiUrl = useApiUrl()
  const publish = usePublish()
  const { addAction } = useContext(AppContext)
  const { mutateAsync } = useCustomMutation()
  const { open } = useNotification()
  const { levels } = splitActionId(actionId)

  const queryResult = useOne<components['schemas']['ActionFull']>({
    resource: 'actions',
    id: actionId,
  })
  const { isFetching, data } = queryResult

  const actionTitle = data?.data?.title

  // Fetch schema and customize uiSchema
  const jsonschema = data?.data?.jsonschema
  let uischema = data?.data?.uischema?.uiSchema

  if (jsonschema) {
    delete jsonschema.$schema
    uischema = merge({}, uischema, customizeUiSchema(jsonschema))
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
      console.log('equal')
      setOpenDialog(true)
    } else {
      await handleSubmission(formData)
    }
  }

  const handleSubmission = async (formData: IFormValues) => {
    setActionRunning(true)
    publish?.({
      channel: 'processes',
      type: 'get-processes',
      payload: { action: actionId },
      date: new Date(),
    })
    try {
      const result = await mutateAsync({
        url: `${apiUrl}/actions/${actionId}`,
        method: 'post',
        values: { ...formData, changed: [...changed] },
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

      if (result && actionId) {
        addAction({
          id: actionId.toString(),
          title: jsonschema?.title || '',
          description: jsonschema?.description || '',
        })
        publish?.({
          channel: 'process',
          type: 'get-process',
          payload: { action: result.data.id },
          date: new Date(),
        })
        setPreviousSubmit(formData)
      }
    } catch (error) {
      console.error('Error creating action:', error)
    } finally {
      setActionRunning(false)
    }
  }

  const handleDialogClose = (confirm: boolean) => {
    setOpenDialog(false)
    if (confirm) {
      handleSubmission(formValues as IFormValues) // Submit the previous form values
    }
  }

  function TitleFieldTemplate(props: TitleFieldProps) {
    const { id, title } = props
    if (id === 'root__title') {
      return (
        <>
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
          <Typography
            id={id}
            sx={{
              fontSize: 15,
              fontWeight: 600,
              lineHeight: 1.6,
              color: (theme) =>
                theme.palette.mode === 'dark' ? '#fff' : '#000',
            }}
          >
            {actionTitle || title}
          </Typography>
        </>
      )
    }
    return (
      <Box id={id}>
        <Typography variant="subtitle2">{title}</Typography>
      </Box>
    )
  }

  function DescriptionFieldTemplate(props: DescriptionFieldProps) {
    const { description, id } = props
    return (
      <Typography id={id} sx={{ display: 'block', mt: 1 }} variant="caption">
        {description}
      </Typography>
    )
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
    <Box
      sx={{
        px: 2,
        pb: 2,
        '.MuiGrid-item:has(#root_options__title + div:empty), .MuiGrid-item:has(#root_arguments__title + div:empty)':
          {
            display: 'none',
          },
      }}
    >
      {!isFetching && (
        <Form
          idSeparator={'/'}
          schema={jsonschema || {}}
          uiSchema={uischema || {}}
          formData={formValues}
          validator={validator}
          onSubmit={onSubmit}
          templates={{ DescriptionFieldTemplate, TitleFieldTemplate }}
          onChange={handleChange}
        >
          <Button variant="contained" type="submit" disabled={actionRunning}>
            Submit
          </Button>

          {!isFullpage && (
            <>
              <Divider sx={{ my: 2 }} />
              <Button href={`/actions/${actionId}/show`}>
                Or Go to form page
              </Button>
            </>
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
    </Box>
  )
}
