'use client'

import { TrinityDebugger } from '@/lib/trinity-debug'
import type { GuidedFormData, Budget } from '@/lib/quote-types'

const debug = new TrinityDebugger('BudgetSection')

interface BudgetSectionProps {
  data: Partial<GuidedFormData>
  errors: Record<string, string>
  onChange: (updates: Partial<GuidedFormData>) => void
}

export function BudgetSection({ data, errors, onChange }: BudgetSectionProps) {
  debug.entry('BudgetSection')

  const budgetOptions: Array<{ value: Budget; label: string; description: string }> = [
    { value: 'under5k', label: 'Under $5,000', description: 'Essential features, MVP' },
    { value: '5k-10k', label: '$5,000 - $10,000', description: 'Full-featured solution' },
    { value: '10k-25k', label: '$10,000 - $25,000', description: 'Complex application' },
    { value: '25k+', label: '$25,000+', description: 'Enterprise solution' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-sunny-darkRed mb-2">Budget range</h2>
        <p className="text-sunny-brown/80">This helps me suggest the best solution for your needs</p>
      </div>

      <div className="space-y-3">
        {budgetOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange({ budget: option.value })}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              data.budget === option.value
                ? 'border-sunny-red bg-sunny-red/10'
                : errors.budget
                ? 'border-red-500 hover:border-red-400'
                : 'border-sunny-gold/30 hover:border-sunny-gold'
            }`}
          >
            <div className="font-medium text-sunny-darkRed">{option.label}</div>
            <div className="text-sm text-sunny-brown/60">{option.description}</div>
          </button>
        ))}
      </div>
      {errors.budget && (
        <p className="text-red-500 text-sm mt-2">{errors.budget}</p>
      )}
    </div>
  )
}
