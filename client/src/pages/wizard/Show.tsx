import { Box, Typography, Button, LinearProgress } from '@mui/material'
import {
  useApiUrl,
  useCustomMutation,
  useNotification,
  useOne,
  usePublish,
  useResourceParams,
  useSubscription,
} from '@refinedev/core'
import { IChangeEvent } from '@rjsf/core'
import { withTheme } from '@rjsf/core'
import { Theme } from '@rjsf/mui'
import {
  DescriptionFieldProps,
  TitleFieldProps,
} from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import { FC, useContext, useEffect, useState, useRef } from 'react'
import WizardBanner from '../../components/layout/WizardBanner'
import { useThemeContext } from '../../ThemeProvider'
import { IActionData, IFormValues } from '../../types'
import FormSteps from './FormSteps'
import { AppContext } from '../../context/AppContext'
import CustomFieldTemplate from './CustomFieldTemplate'
import './wizard-form.css'

const Form = withTheme(Theme)

export const WizardShow: FC = () => {
  const { id: idFromRoute } = useResourceParams()
  const publish = usePublish()
  const [steps, setSteps] = useState([])
  const stepsRef = useRef(steps)
  const [step, setStep] = useState(0)
  const { addAction } = useContext(AppContext)
  const { isDarkMode } = useThemeContext()
  const apiUrl = useApiUrl()
  const [actionRunning, setActionRunning] = useState<string | null>(null)
  const actionRunningRef = useRef(actionRunning)
  const { open } = useNotification()

  const queryResult = useOne<IActionData>({
    resource: `wizard`,
    id: idFromRoute,
  })

  const { isLoading, data } = queryResult

  const title = data?.data?.title
  const description = data?.data?.description
  const actionTitle = data?.data?.title

  useEffect(() => {
    if (data) {
      data.data.steps.forEach((step: { jsonschema: { $schema: any } }) => {
        delete step?.jsonschema.$schema
      })
      const newSteps = data?.data?.steps
      setSteps(newSteps)
      stepsRef.current = newSteps
    }
  }, [data])

  useEffect(() => {
    actionRunningRef.current = actionRunning
  }, [actionRunning])

  const { mutateAsync } = useCustomMutation()

  const onSubmit = async ({ formData }: IChangeEvent<IFormValues>) => {
    if (!formData) return

    publish?.({
      channel: 'processes',
      type: 'get-processes',
      payload: { action: stepsRef.current[step].id },
      date: new Date(),
    })

    try {
      const result = await mutateAsync({
        url: `${apiUrl}/actions/${stepsRef.current[step].id}`,
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

      if (result) {
        addAction({
          id: stepsRef.current[step].id,
          title,
          description,
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
    } finally {
      setActionRunning(stepsRef.current[step].id)
    }
  }

  const handleNext = () => {
    setStep((prevStep) => {
      if (prevStep + 1 < stepsRef.current.length) {
        return prevStep + 1
      } else {
        return prevStep
      }
    })
  }

  useSubscription({
    channel: 'processes',
    types: ['send-processes-finished'],
    onLiveEvent: ({ payload, type }) => {
      if (payload?.data?.action === actionRunningRef.current) {
        if (type === 'send-processes-finished') {
          setActionRunning(null)

          open?.({
            message: `Step finished`,
            description: 'Go to next step',
            type: 'success',
          })

          handleNext()
        }
      }
    },
  })

  const TitleFieldTemplate = ({ id, title }: TitleFieldProps) => {
    if (id === 'root__title') {
      return (
        <Typography id={id} variant="h4">
          {actionTitle || title}
        </Typography>
      )
    }
    return (
      <Box id={id}>
        <Typography className="visually-hidden">{title}</Typography>
      </Box>
    )
  }

  const DescriptionFieldTemplate = ({
    description,
    id,
  }: DescriptionFieldProps) => (
    <Typography id={id} sx={{ display: 'block' }} variant="caption">
      {description}
    </Typography>
  )

  return (
    <>
      <WizardBanner title={title} subtitle={description} />
      <Box
        sx={{
          padding: 6,
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: isDarkMode ? '#000' : '#F9FAFB',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 3fr',
            maxWidth: 1200,
            width: '100%',
            gap: 4,
          }}
        >
          <FormSteps
            steps={stepsRef.current}
            currentStepIndex={step}
            setStep={setStep}
            actionRunning={actionRunning}
          />

          {!isLoading && stepsRef.current[step]?.jsonschema && (
            <Form
              className="wizard-form"
              schema={stepsRef.current[step]?.jsonschema}
              uiSchema={stepsRef.current[step]?.uischema?.uiSchema}
              validator={validator}
              onSubmit={onSubmit}
              templates={{
                TitleFieldTemplate,
                DescriptionFieldTemplate,
                FieldTemplate: CustomFieldTemplate,
              }}
              disabled={stepsRef.current[step].id === actionRunning}
            >
              {stepsRef.current[step].id === actionRunning && (
                <LinearProgress sx={{ mb: 2 }} />
              )}
              <div>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={stepsRef.current[step].id === actionRunning}
                >
                  Submit
                </Button>
              </div>
            </Form>
          )}
        </Box>
      </Box>
    </>
  )
}
