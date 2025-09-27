import { useState } from 'react'
import { TrinityDebugger } from '@/lib/trinity-debug'
import { validateTechnicalForm } from '@/lib/quote-validation'
import type { TechnicalFormData } from '@/lib/quote-types'

const debug = new TrinityDebugger('useTechnicalForm')

export function useTechnicalForm(onComplete: () => void) {
  debug.entry('useTechnicalForm')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<TechnicalFormData>({
    contactName: '',
    contactEmail: '',
    companyName: '',
    projectName: '',
    projectType: '',
    projectDescription: '',
    targetAudience: '',
    primaryGoals: '',
    techStack: '',
    hostingPreference: '',
    budget: '',
    timeline: '',
    features: '',
    integrations: '',
    designStatus: '',
    additionalNotes: ''
  })

  const handleFieldChange = (field: keyof TechnicalFormData, value: string) => {
    setFormData({ ...formData, [field]: value })
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const handleSubmit = async () => {
    debug.entry('handleSubmit', { formData })
    setIsSubmitting(true)

    const validation = validateTechnicalForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
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
          formType: 'technical'
        }),
      })

      if (response.ok) {
        debug.success('handleSubmit', { status: 'sent' })
        alert('Thank you! Your technical requirements have been sent. I\'ll review them and get back to you within 24 hours with a detailed quote.')
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
      alert('There was an error sending your requirements. Please email luka@sunny-stack.com directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    debug.info('resetForm', 'Resetting form data')
    setFormData({
      contactName: '',
      contactEmail: '',
      companyName: '',
      projectName: '',
      projectType: '',
      projectDescription: '',
      targetAudience: '',
      primaryGoals: '',
      techStack: '',
      hostingPreference: '',
      budget: '',
      timeline: '',
      features: '',
      integrations: '',
      designStatus: '',
      additionalNotes: ''
    })
    setErrors({})
  }

  return {
    formData,
    errors,
    isSubmitting,
    handleFieldChange,
    handleSubmit,
    resetForm
  }
}
