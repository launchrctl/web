import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import type { FC } from 'react'

interface Step {
  id: string
  title: string
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
        {steps.map((step) => (
          <Step key={step.id}>
            <StepLabel>{step.title}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div>
        <h3>debug</h3>
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
