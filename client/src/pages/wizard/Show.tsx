import './wizard-form.css'

import {
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import {
  useApiUrl,
  useCustomMutation,
  useNotification,
  useOne,
  usePublish,
  useResourceParams,
  useSubscription,
} from '@refinedev/core'
import { IChangeEvent, withTheme } from '@rjsf/core'
import { Theme } from '@rjsf/mui'
import {
  DescriptionFieldProps,
  RJSFSchema,
  TitleFieldProps,
  ObjectFieldTemplateProps,
  getUiOptions,
  getTemplate,
  ObjectFieldTemplatePropertyType,
  StrictRJSFSchema,
  FormContextType,
  titleId,
  WidgetProps,
  RegistryWidgetsType,
} from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import { FC, useCallback, useContext, useEffect, useRef, useState } from 'react'

import { components } from '../../../openapi'
import WizardBanner from '../../components/layout/WizardBanner'
import { AppContext } from '../../context/AppContext'
import { useThemeContext } from '../../ThemeProvider'
import { IFormValues } from '../../types'
import FormSteps from './FormSteps'
import CustomObjectFieldTemplate from './ObjectFieldTemplate'
import SwitchPackage from './widgets/SwitchPackage'

const Form = withTheme(Theme)

export const WizardShow: FC = () => {
  const { id: idFromRoute } = useResourceParams()
  const publish = usePublish()
  const [steps, setSteps] = useState<components['schemas']['WizardStep'][]>([])
  const stepsRef = useRef(steps)
  const [step, setStep] = useState(0)
  const { addAction } = useContext(AppContext)
  const { isDarkMode } = useThemeContext()
  const apiUrl = useApiUrl()
  const [actionRunning, setActionRunning] = useState<string | null>(null)
  const actionRunningRef = useRef(actionRunning)
  const { open } = useNotification()

  const { data } = useOne<components['schemas']['WizardFull']>({
    resource: 'wizard',
    id: idFromRoute,
  })

  const title = data?.data?.title || ''
  const description = data?.data?.description || ''
  const successText = data?.data?.success || ''

  useEffect(() => {
    if (data) {
      const newSteps = data.data?.steps?.map((step) => {
        step?.actions?.map((action) => {
          if (action?.jsonschema) {
            delete action.jsonschema.$schema
          }
        })

        return step
      })

      if (newSteps) {
        setSteps(newSteps)
      }
    }
  }, [data])

  useEffect(() => {
    actionRunningRef.current = actionRunning
  }, [actionRunning])

  const { mutateAsync } = useCustomMutation()

  const onSubmit = useCallback(
    async ({ formData }: IChangeEvent<IFormValues>) => {
      if (!formData) return

      const currentStepId = stepsRef.current?.[step]?.id
      if (typeof currentStepId === 'string' && currentStepId.length > 0) {
        publish?.({
          channel: 'processes',
          type: 'get-processes',
          payload: { action: currentStepId },
          date: new Date(),
        })

        try {
          const result = await mutateAsync({
            url: `${apiUrl}/actions/${currentStepId}`,
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
              id: currentStepId,
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
          setActionRunning(currentStepId)
        }
      }
    },
    [step, title, description, mutateAsync, apiUrl, addAction, publish]
  )

  const handleNext = useCallback(() => {
    setStep(
      (prevStep) => prevStep + 1
      // prevStep + 1 < stepsRef.current.length ? prevStep + 1 : prevStep
    )
  }, [])

  useSubscription({
    channel: 'processes',
    types: ['send-processes-finished'],
    onLiveEvent: useCallback(
      ({ payload, type }) => {
        if (
          payload?.data?.action === actionRunningRef.current &&
          type === 'send-processes-finished'
        ) {
          setActionRunning(null)

          open?.({
            message: 'Step finished',
            description: 'Go to next step',
            type: 'success',
          })

          handleNext()
        }
      },
      [handleNext, open]
    ),
  })

  const TitleFieldTemplate = ({ id, title }: TitleFieldProps) => {
    if (id === 'root__title') {
      return (
        <Typography id={id} sx={{ fontSize: '1.125rem' }}>
          {title}
        </Typography>
      )
    }
    return (
      <Typography id={id} className="visually-hidden">
        {title}
      </Typography>
    )
  }

  const widgets: RegistryWidgetsType = {
    SwitchPackage,
  }

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
            steps={steps}
            currentStepIndex={step}
            setStep={setStep}
            actionRunning={actionRunning}
          />

          {steps.length < step + 1 && (
            <Typography variant="h4">{successText}</Typography>
          )}

          {steps[step]?.actions?.length && (
            <Stack spacing={3}>
              <Stack spacing={2}>
                <Typography variant="h5">{steps[step]?.title}</Typography>
                <Typography variant="body2">
                  {steps[step]?.description}
                </Typography>
              </Stack>
              <Stack spacing={3}>
                {steps[step]?.actions.map((action) => (
                  <Paper key={action.id} variant="elevation">
                    <Form
                      widgets={widgets}
                      className="wizard-form"
                      schema={action.jsonschema}
                      validator={validator}
                      uiSchema={action?.uischema?.uiSchema || {}}
                      templates={{
                        TitleFieldTemplate,
                        ObjectFieldTemplate: CustomObjectFieldTemplate,
                      }}
                    >
                      <Paper
                        sx={{
                          display: 'flex',
                          justifyContent: 'end',
                          padding: '0.75rem 1.5rem',
                          backgroundColor: '#fcfcfd',
                          borderTop: '1px solid #e4e7ec',
                        }}
                      >
                        <Button type="submit" variant="contained">
                          Save
                        </Button>
                      </Paper>
                    </Form>
                  </Paper>
                ))}
              </Stack>
            </Stack>
            // <Form
            //   className="wizard-form"
            //   schema={stepsRef.current[step]?.jsonschema as RJSFSchema}
            //   uiSchema={stepsRef.current[step]?.uischema?.uiSchema}
            //   validator={validator}
            //   onSubmit={onSubmit}
            //   templates={{
            //     TitleFieldTemplate,
            //     DescriptionFieldTemplate,
            //   }}
            //   disabled={(stepsRef.current?.[step]?.id ?? '') === actionRunning}
            // >
            //   {(stepsRef.current?.[step]?.id ?? '') === actionRunning && (
            //     <LinearProgress sx={{ mb: 2 }} />
            //   )}
            //   <div>
            //     <Button
            //       variant="contained"
            //       type="submit"
            //       disabled={
            //         (stepsRef.current?.[step]?.id ?? '') === actionRunning
            //       }
            //     >
            //       Submit
            //     </Button>
            //   </div>
            // </Form>
          )}
        </Box>
      </Box>
    </>
  )
}
