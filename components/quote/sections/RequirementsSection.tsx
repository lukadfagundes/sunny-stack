'use client'

import { TrinityDebugger } from '@/lib/trinity-debug'
import type { GuidedFormData } from '@/lib/quote-types'

const debug = new TrinityDebugger('RequirementsSection')

interface RequirementsSectionProps {
  data: Partial<GuidedFormData>
  errors: Record<string, string>
  onChange: (updates: Partial<GuidedFormData>) => void
}

export function RequirementsSection({ data, onChange }: RequirementsSectionProps) {
  debug.entry('RequirementsSection')

  const featureOptions = [
    'User accounts/login',
    'Payment processing',
    'Email notifications',
    'File uploads',
    'Search functionality',
    'Admin dashboard',
    'Analytics/reporting',
    'Third-party integrations',
    'Real-time updates',
    'Mobile responsive',
    'Other'
  ]

  const handleFeatureToggle = (feature: string) => {
    const currentFeatures = data.features || []

    if (feature === 'Other') {
      const hasOther = currentFeatures.some(f => f.startsWith('Other:'))
      if (hasOther) {
        onChange({ features: currentFeatures.filter(f => !f.startsWith('Other:')) })
      } else {
        onChange({ features: [...currentFeatures, 'Other: '] })
      }
    } else {
      if (currentFeatures.includes(feature)) {
        onChange({ features: currentFeatures.filter(f => f !== feature) })
      } else {
        onChange({ features: [...currentFeatures, feature] })
      }
    }
  }

  const handleOtherFeatureChange = (value: string) => {
    const currentFeatures = (data.features || []).filter(f => !f.startsWith('Other:'))
    if (value) {
      onChange({ features: [...currentFeatures, `Other: ${value}`] })
    } else {
      onChange({ features: currentFeatures })
    }
  }

  const getOtherValue = () => {
    const otherFeature = (data.features || []).find(f => f.startsWith('Other:'))
    return otherFeature ? otherFeature.substring(7) : ''
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-sunny-darkRed mb-2">What features do you need?</h2>
        <p className="text-sunny-brown/80">Select all that apply</p>
      </div>

      <div className="space-y-3">
        {featureOptions.map((feature) => (
          <div key={feature}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={
                  data.features?.includes(feature) ||
                  (feature === 'Other' && data.features?.some(f => f.startsWith('Other:')))
                }
                onChange={() => handleFeatureToggle(feature)}
                className="w-5 h-5 text-sunny-red rounded border-2 border-sunny-gold/30"
              />
              <span className="text-sunny-brown">{feature}</span>
            </label>

            {feature === 'Other' && data.features?.some(f => f.startsWith('Other:')) && (
              <div className="ml-8 mt-2">
                <input
                  type="text"
                  placeholder="Please describe what else you need..."
                  value={getOtherValue()}
                  onChange={(e) => handleOtherFeatureChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-sunny-gold/30 focus:border-sunny-red focus:outline-none text-sm"
                  maxLength={1000}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}