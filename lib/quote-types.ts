// lib/quote-types.ts - Type definitions for quote forms

export type FormMode = 'selection' | 'guided' | 'technical'
export type ProjectType = 'website' | 'webapp' | 'desktop' | 'mobile' | 'ecommerce' | 'other'
export type Timeline = 'asap' | '1month' | '3months' | 'flexible'
export type Budget = 'under5k' | '5k-10k' | '10k-25k' | '25k+'
export type TechnicalView = 'choice' | 'form' | 'download'

export interface ValidationErrors {
  [key: string]: string
}

export interface GuidedFormData {
  // Contact info
  name: string
  email: string
  company: string

  // Project basics
  projectType: ProjectType | ''
  projectDescription: string

  // Features (guided mode)
  features: string[]
  timeline: Timeline | ''
  budget: Budget | ''

  // Technical details
  hasDesign: string
  needsBackend: string
  needsAuth: string
  integrations: string
  specialRequirements: string
}

export interface TechnicalFormData {
  contactName: string
  contactEmail: string
  companyName: string
  projectName: string
  projectType: string
  projectDescription: string
  targetAudience: string
  primaryGoals: string
  techStack: string
  hostingPreference: string
  budget: string
  timeline: string
  features: string
  integrations: string
  designStatus: string
  additionalNotes: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationErrors
}

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}