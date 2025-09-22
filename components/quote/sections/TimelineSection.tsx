'use client'

import { TrinityDebugger } from '@/lib/trinity-debug'
import type { GuidedFormData, Timeline } from '@/lib/quote-types'

const debug = new TrinityDebugger('TimelineSection')

interface TimelineSectionProps {
  data: Partial<GuidedFormData>
  errors: Record<string, string>
  onChange: (updates: Partial<GuidedFormData>) => void
}

export function TimelineSection({ data, errors, onChange }: TimelineSectionProps) {
  debug.entry('TimelineSection')

  const timelineOptions: Array<{ value: Timeline; label: string; description: string }> = [
    { value: 'asap', label: 'ASAP', description: 'Need it yesterday!' },
    { value: '1month', label: 'Within 1 month', description: 'Quick turnaround' },
    { value: '3months', label: 'Within 3 months', description: 'Standard timeline' },
    { value: 'flexible', label: 'Flexible', description: 'No rush, quality first' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-sunny-darkRed mb-2">When do you need this?</h2>
        <p className="text-sunny-brown/80">This helps me prioritize and plan accordingly</p>
      </div>

      <div className="space-y-3">
        {timelineOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange({ timeline: option.value })}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              data.timeline === option.value
                ? 'border-sunny-red bg-sunny-red/10'
                : errors.timeline
                ? 'border-red-500 hover:border-red-400'
                : 'border-sunny-gold/30 hover:border-sunny-gold'
            }`}
          >
            <div className="font-medium text-sunny-darkRed">{option.label}</div>
            <div className="text-sm text-sunny-brown/60">{option.description}</div>
          </button>
        ))}
      </div>
      {errors.timeline && (
        <p className="text-red-500 text-sm mt-2">{errors.timeline}</p>
      )}
    </div>
  )
}