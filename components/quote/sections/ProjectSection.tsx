'use client'

import { TrinityDebugger } from '@/lib/trinity-debug'
import FormTextarea from '@/components/forms/FormTextarea'
import type { GuidedFormData, ProjectType } from '@/lib/quote-types'

const debug = new TrinityDebugger('ProjectSection')

interface ProjectSectionProps {
  data: Partial<GuidedFormData>
  errors: Record<string, string>
  onChange: (updates: Partial<GuidedFormData>) => void
  currentField: 'projectType' | 'description'
}

export function ProjectSection({ data, errors, onChange, currentField }: ProjectSectionProps) {
  debug.entry('ProjectSection', { currentField })

  if (currentField === 'projectType') {
    const projectTypes: Array<{ value: ProjectType; label: string; description: string }> = [
      { value: 'website', label: 'Website', description: 'Marketing site, portfolio, blog' },
      { value: 'webapp', label: 'Web App', description: 'Interactive application, SaaS, dashboard' },
      { value: 'desktop', label: 'Desktop App', description: 'Windows, Mac, or cross-platform' },
      { value: 'mobile', label: 'Mobile App', description: 'iOS, Android, or cross-platform' },
      { value: 'ecommerce', label: 'E-Commerce', description: 'Online store, marketplace, payments' },
      { value: 'other', label: 'Something Else', description: 'API, automation, or custom solution' }
    ]

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-sunny-darkRed mb-2">What are we building?</h2>
          <p className="text-sunny-brown/80">Choose the option that best describes your project</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {projectTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => onChange({ projectType: type.value })}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                data.projectType === type.value
                  ? 'border-sunny-red bg-sunny-red/10'
                  : errors.projectType
                  ? 'border-red-500 hover:border-red-400'
                  : 'border-sunny-gold/30 hover:border-sunny-gold'
              }`}
            >
              <div className="font-medium text-sunny-darkRed mb-1">{type.label}</div>
              <div className="text-xs text-sunny-brown/60">{type.description}</div>
            </button>
          ))}
        </div>
        {errors.projectType && (
          <p className="text-red-500 text-sm mt-2">{errors.projectType}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-sunny-darkRed mb-2">Tell me about your vision</h2>
        <p className="text-sunny-brown/80">Don't worry about technical terms - just describe what you want!</p>
      </div>

      <FormTextarea
        label="Project Description *"
        name="projectDescription"
        value={data.projectDescription || ''}
        onChange={(e) => onChange({ projectDescription: e.target.value })}
        error={errors.projectDescription}
        placeholder="I want to build an app that helps people track their daily water intake. It should send reminders and show progress..."
        maxLength={1000}
        rows={6}
        required
      />
    </div>
  )
}
