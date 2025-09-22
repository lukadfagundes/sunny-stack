'use client'

import { ArrowLeft } from 'lucide-react'
import { TrinityDebugger } from '@/lib/trinity-debug'

const debug = new TrinityDebugger('QuoteProgress')

interface QuoteProgressProps {
  currentStep: number
  totalSteps: number
  onBack: () => void
}

export default function QuoteProgress({ currentStep, totalSteps, onBack }: QuoteProgressProps) {
  debug.entry('QuoteProgress', { currentStep, totalSteps })

  const progressPercentage = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sunny-brown hover:text-sunny-red transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-sm text-sunny-brown/60">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>
      <div className="w-full bg-sunny-gold/20 rounded-full h-2 overflow-hidden">
        <div
          className="bg-sunny-gradient h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
          role="progressbar"
          aria-valuenow={currentStep + 1}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
        />
      </div>
    </div>
  )
}