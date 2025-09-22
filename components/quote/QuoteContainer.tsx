'use client'

import { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { TrinityDebugger } from '@/lib/trinity-debug'
import type { FormMode } from '@/lib/quote-types'

const debug = new TrinityDebugger('QuoteContainer')

// Loading component for form transitions
const FormLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-sunny-gold/20 rounded mx-auto mb-4"></div>
        <div className="h-4 w-32 bg-sunny-gold/20 rounded mx-auto"></div>
      </div>
    </div>
  </div>
)

// Dynamic imports for code splitting - each form loads only when needed
const QuoteModeSelector = dynamic(
  () => import('./QuoteModeSelector'),
  {
    loading: () => <FormLoader />,
    ssr: true
  }
)

const GuidedQuoteForm = dynamic(
  () => import('./GuidedQuoteForm'),
  {
    loading: () => <FormLoader />,
    ssr: false // Forms don't need SSR
  }
)

const TechnicalQuoteForm = dynamic(
  () => import('./TechnicalQuoteForm'),
  {
    loading: () => <FormLoader />,
    ssr: false // Forms don't need SSR
  }
)

export default function QuoteContainer() {
  debug.entry('QuoteContainer')

  const [mode, setMode] = useState<FormMode>('selection')

  const handleModeSelect = (selectedMode: FormMode) => {
    debug.info('handleModeSelect', 'Mode change', { from: mode, to: selectedMode })
    setMode(selectedMode)
  }

  const handleReset = () => {
    debug.info('handleReset', 'Resetting to selection', { currentMode: mode })
    setMode('selection')
  }

  debug.info('render', 'Rendering component', { currentMode: mode })

  // Wrap each mode in Suspense for better loading states
  return (
    <Suspense fallback={<FormLoader />}>
      {mode === 'selection' && (
        <QuoteModeSelector onModeSelect={handleModeSelect} />
      )}
      {mode === 'guided' && (
        <GuidedQuoteForm onBack={handleReset} onComplete={handleReset} />
      )}
      {mode === 'technical' && (
        <TechnicalQuoteForm onBack={handleReset} onComplete={handleReset} />
      )}
    </Suspense>
  )
}
