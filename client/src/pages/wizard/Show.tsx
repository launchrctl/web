import './wizard-form.css'

import { Box, Button, LinearProgress, Typography } from '@mui/material'
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
import { DescriptionFieldProps, RJSFSchema, TitleFieldProps } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import { FC, useCallback, useContext, useEffect, useRef, useState } from 'react'

import { components } from '../../../openapi'
import WizardBanner from '../../components/layout/WizardBanner'
import { AppContext } from '../../context/AppContext'
import { useThemeContext } from '../../ThemeProvider'
import { IFormValues } from '../../types'
import CustomFieldTemplate from './CustomFieldTemplate'
import FormSteps from './FormSteps'

const Form = withTheme(Theme)

export const WizardShow: FC = () => {
  const { id: idFromRoute } = useResourceParams()
  const publish = usePublish()
  const [steps, setSteps] = useState<components['schemas']['ActionFull'][]>([])
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
  const successText = data?.data?.success

  useEffect(() => {
    if (data) {
      const newSteps = data.data?.steps?.map((step) => {
        if (step?.jsonschema) {
          delete step.jsonschema.$schema
        }
        return step
      })

      if (newSteps) {
        setSteps(newSteps)
        stepsRef.current = newSteps
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
        <Typography id={id} variant="h4">
          {title}
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

          {stepsRef.current.length <= step + 1 && (
            <Typography variant="h4">{successText}</Typography>
          )}

          {stepsRef.current[step]?.jsonschema && (
            <Form
              className="wizard-form"
              schema={stepsRef.current[step]?.jsonschema as RJSFSchema}
              uiSchema={stepsRef.current[step]?.uischema?.uiSchema}
              validator={validator}
              onSubmit={onSubmit}
              templates={{
                TitleFieldTemplate,
                DescriptionFieldTemplate,
                FieldTemplate: CustomFieldTemplate,
              }}
              disabled={(stepsRef.current?.[step]?.id ?? '') === actionRunning}
            >
              {(stepsRef.current?.[step]?.id ?? '') === actionRunning && (
                <LinearProgress sx={{ mb: 2 }} />
              )}
              <div>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={
                    (stepsRef.current?.[step]?.id ?? '') === actionRunning
                  }
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
