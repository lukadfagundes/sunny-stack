import { useState, useCallback } from 'react'
import { TrinityDebugger } from '@/lib/trinity-debug'

const debug = new TrinityDebugger('useMultiStepForm')

export function useMultiStepForm(totalSteps: number) {
  debug.entry('useMultiStepForm', { totalSteps })

  const [currentStep, setCurrentStep] = useState(0)

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = Math.min(prev + 1, totalSteps - 1)
      debug.info('nextStep', 'Moving to next step', { from: prev, to: next })
      return next
    })
  }, [totalSteps])

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = Math.max(prev - 1, 0)
      debug.info('previousStep', 'Moving to previous step', { from: prev, to: next })
      return next
    })
  }, [])

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      debug.info('goToStep', 'Jumping to step', { from: currentStep, to: step })
      setCurrentStep(step)
    } else {
      debug.warning('goToStep', 'Invalid step requested', { requested: step, totalSteps })
    }
  }, [currentStep, totalSteps])

  const reset = useCallback(() => {
    debug.info('reset', 'Resetting to first step')
    setCurrentStep(0)
  }, [])

  return {
    currentStep,
    nextStep,
    previousStep,
    goToStep,
    reset,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
    totalSteps
  }
}
