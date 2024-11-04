import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import type { FC } from 'react'

import { components } from '../../../openapi'

interface Step {
  title?: string
  actions?: components['schemas']['ActionFull'][]
}

interface FormStepsProps {
  actionRunning: string | null
  steps: Step[]
  currentStepIndex: number
  setStep: (step: number) => void
}

const FormSteps: FC<FormStepsProps> = ({
  actionRunning,
  steps = [],
  currentStepIndex,
  setStep,
}) => {
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setStep(currentStepIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(currentStepIndex + 1)
    }
  }

  return (
    <div>
      <Stepper activeStep={currentStepIndex} orientation="vertical">
        {steps.map((step, idx) => (
          <Step key={idx}>
            <StepLabel>{step.title}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div>
        <button
          onClick={handlePrevious}
          disabled={currentStepIndex === 0 || actionRunning !== null}
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={
            currentStepIndex === steps.length - 1 || actionRunning !== null
          }
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default FormSteps
