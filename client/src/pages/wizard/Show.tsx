import { Box, Paper, Stack, Typography } from '@mui/material'
import {
  useNotification,
  useOne,
  useResourceParams,
  useSubscription,
} from '@refinedev/core'
import { FC, useCallback, useEffect, useRef, useState } from 'react'

import { components } from '../../../openapi'
import { FormFlow } from '../../components/FormFlow'
import WizardBanner from '../../components/layout/WizardBanner'
import { useThemeContext } from '../../ThemeProvider'
import FormSteps from './FormSteps'

export const WizardShow: FC = () => {
  const { id: idFromRoute } = useResourceParams()
  const [steps, setSteps] = useState<components['schemas']['WizardStep'][]>([])
  const [step, setStep] = useState(0)
  const { isDarkMode } = useThemeContext()
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

  const onSubmit = (actionId: string) => {
    setActionRunning(actionId)
  }

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
                    <FormFlow
                      actionId={action.id}
                      formType="wizard"
                      onSubmitCallback={onSubmit}
                    />
                  </Paper>
                ))}
              </Stack>
            </Stack>
          )}
        </Box>
      </Box>
    </>
  )
}
