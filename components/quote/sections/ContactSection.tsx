'use client'

import { TrinityDebugger } from '@/lib/trinity-debug'
import FormField from '@/components/forms/FormField'
import type { GuidedFormData } from '@/lib/quote-types'

const debug = new TrinityDebugger('ContactSection')

interface ContactSectionProps {
  data: Partial<GuidedFormData>
  errors: Record<string, string>
  onChange: (updates: Partial<GuidedFormData>) => void
}

export function ContactSection({ data, errors, onChange }: ContactSectionProps) {
  debug.entry('ContactSection')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-sunny-darkRed mb-2">Let's start with introductions!</h2>
        <p className="text-sunny-brown/80">How can I reach you about this project?</p>
      </div>

      <div className="space-y-4">
        <FormField
          label="Your Name *"
          value={data.name || ''}
          onChange={(value) => onChange({ name: value })}
          error={errors.name}
          placeholder="John Doe"
          maxLength={50}
          required
        />

        <FormField
          label="Email *"
          type="email"
          value={data.email || ''}
          onChange={(value) => onChange({ email: value })}
          error={errors.email}
          placeholder="john@example.com"
          required
        />

        <FormField
          label="Company (Optional)"
          value={data.company || ''}
          onChange={(value) => onChange({ company: value })}
          error={errors.company}
          placeholder="Awesome Corp"
          maxLength={50}
        />
      </div>
    </div>
  )
}