'use client'

import { useState, lazy, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { ArrowRight, Send } from 'lucide-react'
import { TrinityDebugger } from '@/lib/trinity-debug'
import { validateGuidedForm } from '@/lib/quote-validation'
import { useMultiStepForm } from '@/hooks/useMultiStepForm'
import type { GuidedFormData } from '@/lib/quote-types'

const debug = new TrinityDebugger('GuidedQuoteForm')

// Section loader component
const SectionLoader = () => (
  <div className="animate-pulse">
    <div className="h-8 w-3/4 bg-sunny-gold/20 rounded mb-4"></div>
    <div className="h-4 w-1/2 bg-sunny-gold/20 rounded"></div>
  </div>
)

// Dynamic imports for form sections - loaded on demand
const QuoteProgress = dynamic(() => import('./QuoteProgress'), {
  loading: () => <div className="h-2 bg-sunny-gold/20 rounded animate-pulse" />,
  ssr: true
})

const ContactSection = lazy(() => import('./sections').then(mod => ({ default: mod.ContactSection })))
const ProjectSection = lazy(() => import('./sections').then(mod => ({ default: mod.ProjectSection })))
const TimelineSection = lazy(() => import('./sections').then(mod => ({ default: mod.TimelineSection })))
const BudgetSection = lazy(() => import('./sections').then(mod => ({ default: mod.BudgetSection })))
const RequirementsSection = lazy(() => import('./sections').then(mod => ({ default: mod.RequirementsSection })))

interface GuidedQuoteFormProps {
  onBack: () => void
  onComplete: () => void
}

const guidedSteps = [
  'contact',
  'projectType',
  'description',
  'features',
  'timeline',
  'budget',
  'review'
]

export default function GuidedQuoteForm({ onBack, onComplete }: GuidedQuoteFormProps) {
  debug.entry('GuidedQuoteForm', { onBack: !!onBack, onComplete: !!onComplete })

  const [formData, setFormData] = useState<GuidedFormData>({
    name: '',
    email: '',
    company: '',
    projectType: '',
    projectDescription: '',
    features: [],
    timeline: '',
    budget: '',
    hasDesign: '',
    needsBackend: '',
    needsAuth: '',
    integrations: '',
    specialRequirements: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { currentStep, nextStep, previousStep, isFirstStep, isLastStep } = useMultiStepForm(guidedSteps.length)

  const validateCurrentStep = (): boolean => {
    debug.info('validateCurrentStep', 'Validating current step', { step: guidedSteps[currentStep] })

    const validation = validateGuidedForm(formData)

    if (!validation.isValid) {
      setErrors(validation.errors)
      debug.info('validation failed', 'Validation errors found', validation.errors)
      return false
    }

    setErrors({})
    return true
  }

  const handleNext = () => {
    debug.info('handleNext', 'Moving to next step', { currentStep })

    if (validateCurrentStep()) {
      nextStep()
    }
  }

  const handleBack = () => {
    debug.info('handleBack', 'Moving to previous step', { currentStep })

    if (isFirstStep) {
      onBack()
    } else {
      previousStep()
    }
  }

  const handleSubmit = async () => {
    debug.entry('handleSubmit', { formData })
    setIsSubmitting(true)

    // Validate all steps
    const fullValidation = validateGuidedForm(formData)
    if (!fullValidation.isValid) {
      setErrors(fullValidation.errors)
      setIsSubmitting(false)
      alert('Please correct the validation errors before submitting.')
      return
    }

    try {
      const response = await fetch('/api/send-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          formType: 'guided'
        }),
      })

      if (response.ok) {
        debug.success('handleSubmit', { status: 'sent' })
        alert('Thank you! Your project request has been sent. I\'ll get back to you within 24 hours.')
        onComplete()
      } else {
        const errorData = await response.json()
        if (errorData.validationErrors) {
          const serverErrors: Record<string, string> = {}
          errorData.validationErrors.forEach((error: { field: string; message: string }) => {
            serverErrors[error.field] = error.message
          })
          setErrors(serverErrors)
        }
        throw new Error('Failed to send')
      }
    } catch (error) {
      debug.error('handleSubmit', error as Error)
      alert('There was an error sending your request. Please email luka@sunny-stack.com directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    const stepName = guidedSteps[currentStep]

    return (
      <Suspense fallback={<SectionLoader />}>
        {stepName === 'contact' && (
          <ContactSection
            data={formData}
            errors={errors}
            onChange={(updates) => setFormData({ ...formData, ...updates })}
          />
        )}

        {(stepName === 'projectType' || stepName === 'description') && (
          <ProjectSection
            data={formData}
            errors={errors}
            onChange={(updates) => setFormData({ ...formData, ...updates })}
            currentField={stepName}
          />
        )}

        {stepName === 'features' && (
          <RequirementsSection
            data={formData}
            errors={errors}
            onChange={(updates) => setFormData({ ...formData, ...updates })}
          />
        )}

        {stepName === 'timeline' && (
          <TimelineSection
            data={formData}
            errors={errors}
            onChange={(updates) => setFormData({ ...formData, ...updates })}
          />
        )}

        {stepName === 'budget' && (
          <BudgetSection
            data={formData}
            errors={errors}
            onChange={(updates) => setFormData({ ...formData, ...updates })}
          />
        )}

        {stepName === 'review' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-sunny-darkRed mb-2">Perfect! Let's review</h2>
              <p className="text-sunny-brown/80">Here's what I've gathered about your project</p>
            </div>

            <div className="bg-sunny-gold/10 rounded-lg p-6 space-y-3">
              <div>
                <span className="font-medium text-sunny-brown">Contact:</span>
                <span className="ml-2 text-sunny-brown/80">{formData.name} ({formData.email})</span>
              </div>
              <div>
                <span className="font-medium text-sunny-brown">Project Type:</span>
                <span className="ml-2 text-sunny-brown/80">{formData.projectType}</span>
              </div>
              <div>
                <span className="font-medium text-sunny-brown">Timeline:</span>
                <span className="ml-2 text-sunny-brown/80">{formData.timeline}</span>
              </div>
              <div>
                <span className="font-medium text-sunny-brown">Budget:</span>
                <span className="ml-2 text-sunny-brown/80">{formData.budget}</span>
              </div>
              {formData.features.length > 0 && (
                <div>
                  <span className="font-medium text-sunny-brown">Features:</span>
                  <span className="ml-2 text-sunny-brown/80">{formData.features.join(', ')}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-sunny-red hover:bg-sunny-darkRed text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-sunny-red focus-visible:ring-offset-2 focus:outline-none"
            >
              <Send className="w-5 h-5 inline mr-2" />
              {isSubmitting ? 'Sending...' : 'Send My Project Request'}
            </button>
          </div>
        )}
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto pt-8">
          <QuoteProgress
            currentStep={currentStep}
            totalSteps={guidedSteps.length}
            onBack={handleBack}
          />

          <div className="bg-white/90 backdrop-blur rounded-xl shadow-xl p-8">
            {renderStepContent()}

            {!isLastStep && (
              <div className="flex justify-end mt-8">
                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 bg-sunny-red hover:bg-sunny-darkRed text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-xl transition-all focus-visible:ring-2 focus-visible:ring-sunny-red focus-visible:ring-offset-2 focus:outline-none"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}