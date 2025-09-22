'use client'

import { useState } from 'react'
import { TrinityDebugger } from '@/lib/trinity-debug'
import QuoteModeSelector from './QuoteModeSelector'
import GuidedQuoteForm from './GuidedQuoteForm'
import TechnicalQuoteForm from './TechnicalQuoteForm'
import type { FormMode } from '@/lib/quote-types'

const debug = new TrinityDebugger('QuoteContainer')

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

  // Mode selection screen
  if (mode === 'selection') {
    return <QuoteModeSelector onModeSelect={handleModeSelect} />
  }

  // Guided form
  if (mode === 'guided') {
    return <GuidedQuoteForm onBack={handleReset} onComplete={handleReset} />
  }

  // Technical form
  if (mode === 'technical') {
    return <TechnicalQuoteForm onBack={handleReset} onComplete={handleReset} />
  }

  // Fallback (should never reach)
  debug.error('render', new Error('Invalid mode state'))
  return null
}