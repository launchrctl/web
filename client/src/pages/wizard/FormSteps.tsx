import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import { BaseKey } from '@refinedev/core'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Step {
  id: string
  title: string
}

interface FormStepsProps {
  steps: Step[]
  current?: BaseKey | undefined
}

const FormSteps: FC<FormStepsProps> = ({ steps = [], current }) => {
  const navigate = useNavigate()
  const [currentStepIndex, setCurrentStepIndex] = useState(
    current ? steps.findIndex((step) => step.id === current) : 0
  )

  useEffect(() => {
    if (current) {
      const index = steps.findIndex((step) => step.id === current)
      if (index !== -1) {
        setCurrentStepIndex(index)
      }
    }
  }, [current, steps])

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const previousStep = steps[currentStepIndex - 1]
      navigate(`/wizard/${previousStep.id}/show`)
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextStep = steps[currentStepIndex + 1]
      navigate(`/wizard/${nextStep.id}/show`)
      setCurrentStepIndex(currentStepIndex + 1)
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
        <button onClick={handlePrevious} disabled={currentStepIndex === 0}>
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentStepIndex === steps.length - 1}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default FormSteps
