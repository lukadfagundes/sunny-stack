'use client'

import { ArrowLeft, Send } from 'lucide-react'
import FormField from '@/components/forms/FormField'
import FormTextarea from '@/components/forms/FormTextarea'
import FormSelect from '@/components/forms/FormSelect'
import FormErrors from '@/components/forms/FormErrors'
import type { TechnicalFormData } from '@/lib/quote-types'

interface TechnicalFormFieldsProps {
  formData: TechnicalFormData
  errors: Record<string, string>
  isSubmitting: boolean
  onFieldChange: (field: keyof TechnicalFormData, value: string) => void
  onSubmit: () => void
  onBack: () => void
}

export default function TechnicalFormFields({
  formData,
  errors,
  isSubmitting,
  onFieldChange,
  onSubmit,
  onBack
}: TechnicalFormFieldsProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto pt-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sunny-brown hover:text-sunny-red transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="bg-white/90 backdrop-blur rounded-xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-sunny-darkRed mb-6">Technical Requirements Form</h2>

            <div className="space-y-6">
              {/* Contact Information */}
              <ContactFields formData={formData} errors={errors} onFieldChange={onFieldChange} />

              {/* Project Details */}
              <ProjectFields formData={formData} errors={errors} onFieldChange={onFieldChange} />

              {/* Technical Requirements */}
              <TechnicalFields formData={formData} errors={errors} onFieldChange={onFieldChange} />

              {/* Project Logistics */}
              <LogisticsFields formData={formData} errors={errors} onFieldChange={onFieldChange} />

              {/* Additional Notes */}
              <NotesField formData={formData} errors={errors} onFieldChange={onFieldChange} />

              <FormErrors errors={Object.values(errors).filter(Boolean)} />

              <button
                onClick={onSubmit}
                disabled={isSubmitting}
                className="w-full bg-sunny-ocean hover:bg-sunny-ocean/90 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5 inline mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Technical Requirements'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

interface ComponentFieldsProps {
  formData: TechnicalFormData
  errors: Record<string, string>
  onFieldChange: (field: keyof TechnicalFormData, value: string) => void
}

function ContactFields({ formData, errors, onFieldChange }: ComponentFieldsProps) {
  return (
    <div className="border-b border-sunny-gold/20 pb-6">
      <h3 className="font-bold text-sunny-red mb-4">Contact Information</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <FormField
          label="Full Name *"
          value={formData.contactName}
          onChange={(value) => onFieldChange('contactName', value)}
          error={errors.contactName}
          required
          maxLength={50}
        />
        <FormField
          label="Email *"
          type="email"
          value={formData.contactEmail}
          onChange={(value) => onFieldChange('contactEmail', value)}
          error={errors.contactEmail}
          required
        />
      </div>
      <div className="mt-4">
        <FormField
          label="Company Name"
          value={formData.companyName}
          onChange={(value) => onFieldChange('companyName', value)}
          error={errors.companyName}
          maxLength={50}
        />
      </div>
    </div>
  )
}

function ProjectFields({ formData, errors, onFieldChange }: ComponentFieldsProps) {
  return (
    <div className="border-b border-sunny-gold/20 pb-6">
      <h3 className="font-bold text-sunny-red mb-4">Project Details</h3>
      <div className="space-y-4">
        <FormField
          label="Project Name *"
          value={formData.projectName}
          onChange={(value) => onFieldChange('projectName', value)}
          error={errors.projectName}
          required
          maxLength={50}
        />
        <FormSelect
          label="Project Type *"
          value={formData.projectType}
          onChange={(value) => onFieldChange('projectType', value)}
          error={errors.projectType}
          required
          options={[
            { value: '', label: 'Select type...' },
            { value: 'website', label: 'Website' },
            { value: 'webapp', label: 'Web Application' },
            { value: 'desktop', label: 'Desktop Application' },
            { value: 'mobile', label: 'Mobile Application' },
            { value: 'ecommerce', label: 'E-Commerce Platform' },
            { value: 'api', label: 'API/Backend Service' },
            { value: 'other', label: 'Other' }
          ]}
        />
        <FormTextarea
          label="Project Description *"
          value={formData.projectDescription}
          onChange={(value) => onFieldChange('projectDescription', value)}
          error={errors.projectDescription}
          placeholder="Describe your project goals and vision..."
          required
          maxLength={1000}
          rows={4}
        />
        <FormField
          label="Target Audience"
          value={formData.targetAudience}
          onChange={(value) => onFieldChange('targetAudience', value)}
          error={errors.targetAudience}
          placeholder="Who will use this application?"
          maxLength={1000}
        />
      </div>
    </div>
  )
}

function TechnicalFields({ formData, errors, onFieldChange }: ComponentFieldsProps) {
  return (
    <div className="border-b border-sunny-gold/20 pb-6">
      <h3 className="font-bold text-sunny-red mb-4">Technical Requirements</h3>
      <div className="space-y-4">
        <FormField
          label="Preferred Tech Stack"
          value={formData.techStack}
          onChange={(value) => onFieldChange('techStack', value)}
          placeholder="e.g., React, Node.js, PostgreSQL (leave blank if no preference)"
          maxLength={1000}
        />
        <FormTextarea
          label="Features & Functionality *"
          value={formData.features}
          onChange={(value) => onFieldChange('features', value)}
          error={errors.features}
          placeholder="List all required features and functionality..."
          required
          maxLength={1000}
          rows={4}
        />
        <FormTextarea
          label="Third-Party Integrations"
          value={formData.integrations}
          onChange={(value) => onFieldChange('integrations', value)}
          error={errors.integrations}
          placeholder="List any APIs, services, or platforms to integrate with..."
          maxLength={1000}
          rows={3}
        />
        <FormSelect
          label="Hosting Preference"
          value={formData.hostingPreference}
          onChange={(value) => onFieldChange('hostingPreference', value)}
          options={[
            { value: '', label: 'Select preference...' },
            { value: 'cloud', label: 'Cloud (AWS, Google Cloud, Azure)' },
            { value: 'vercel', label: 'Vercel/Netlify' },
            { value: 'dedicated', label: 'Dedicated Server' },
            { value: 'client', label: 'Client Manages' },
            { value: 'recommendation', label: 'Need Recommendation' }
          ]}
        />
      </div>
    </div>
  )
}

function LogisticsFields({ formData, errors, onFieldChange }: ComponentFieldsProps) {
  return (
    <div className="border-b border-sunny-gold/20 pb-6">
      <h3 className="font-bold text-sunny-red mb-4">Project Logistics</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <FormSelect
          label="Timeline *"
          value={formData.timeline}
          onChange={(value) => onFieldChange('timeline', value)}
          error={errors.timeline}
          required
          options={[
            { value: '', label: 'Select timeline...' },
            { value: 'asap', label: 'ASAP (Rush)' },
            { value: '1month', label: '1 Month' },
            { value: '2-3months', label: '2-3 Months' },
            { value: '3-6months', label: '3-6 Months' },
            { value: 'flexible', label: 'Flexible' }
          ]}
        />
        <FormSelect
          label="Budget Range *"
          value={formData.budget}
          onChange={(value) => onFieldChange('budget', value)}
          error={errors.budget}
          required
          options={[
            { value: '', label: 'Select budget...' },
            { value: 'under5k', label: 'Under $5,000' },
            { value: '5k-10k', label: '$5,000 - $10,000' },
            { value: '10k-25k', label: '$10,000 - $25,000' },
            { value: '25k-50k', label: '$25,000 - $50,000' },
            { value: '50k+', label: '$50,000+' }
          ]}
        />
      </div>
      <div className="mt-4">
        <FormSelect
          label="Design Status"
          value={formData.designStatus}
          onChange={(value) => onFieldChange('designStatus', value)}
          options={[
            { value: '', label: 'Select status...' },
            { value: 'completed', label: 'Design Completed' },
            { value: 'in-progress', label: 'Design In Progress' },
            { value: 'need-design', label: 'Need Design Services' },
            { value: 'no-design', label: 'No Design Needed' }
          ]}
        />
      </div>
    </div>
  )
}

function NotesField({ formData, errors, onFieldChange }: ComponentFieldsProps) {
  return (
    <div>
      <FormTextarea
        label="Additional Notes"
        value={formData.additionalNotes}
        onChange={(value) => onFieldChange('additionalNotes', value)}
        error={errors.additionalNotes}
        placeholder="Any other requirements, constraints, or information..."
        maxLength={1000}
        rows={4}
      />
    </div>
  )
}