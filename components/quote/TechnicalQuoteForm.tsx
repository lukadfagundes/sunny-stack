'use client'

import { useState } from 'react'
import { TrinityDebugger } from '@/lib/trinity-debug'
import { useTechnicalForm } from '@/hooks/useTechnicalForm'
import TechnicalFormView from './TechnicalFormView'
import TechnicalFormFields from './TechnicalFormFields'

const debug = new TrinityDebugger('TechnicalQuoteForm')

interface TechnicalQuoteFormProps {
  onBack: () => void
  onComplete: () => void
}

type TechnicalView = 'choice' | 'form'

export default function TechnicalQuoteForm({ onBack, onComplete }: TechnicalQuoteFormProps) {
  debug.entry('TechnicalQuoteForm', { onBack: !!onBack, onComplete: !!onComplete })

  const [view, setView] = useState<TechnicalView>('choice')

  const {
    formData,
    errors,
    isSubmitting,
    handleFieldChange,
    handleSubmit,
    resetForm
  } = useTechnicalForm(() => {
    setView('choice')
    resetForm()
    onComplete()
  })

  const handleFormSelect = () => {
    debug.info('handleFormSelect', 'Switching to form view')
    setView('form')
  }

  const handleBackFromForm = () => {
    debug.info('handleBackFromForm', 'Returning to choice view')
    setView('choice')
  }

  if (view === 'choice') {
    return (
      <TechnicalFormView
        onSelectForm={handleFormSelect}
        onBack={onBack}
      />
    )
  }

  return (
    <TechnicalFormFields
      formData={formData}
      errors={errors}
      isSubmitting={isSubmitting}
      onFieldChange={handleFieldChange}
      onSubmit={handleSubmit}
      onBack={handleBackFromForm}
    />
  )
}