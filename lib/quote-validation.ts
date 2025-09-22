// lib/quote-validation.ts - Validation logic for quote forms

import {
  ValidationErrors,
  GuidedFormData,
  TechnicalFormData,
  ValidationResult,
  ProjectType,
  Timeline,
  Budget
} from './quote-types'

// Email validation helper
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

// Phone validation helper
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 15
}

// Sanitization helper
export function sanitizeHtml(input: string): string {
  // Strip all HTML tags from input
  return input.replace(/<[^>]*>/g, '').trim()
}

// Length validation helper
export function validateLength(
  value: string,
  maxLength: number,
  fieldName: string
): string | null {
  if (value.length > maxLength) {
    return `${fieldName} must be ${maxLength} characters or less`
  }
  return null
}

// Required field validation helper
export function validateRequired(
  value: string | undefined | null,
  fieldName: string
): string | null {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`
  }
  return null
}

// Validate guided form step
export function validateGuidedStep(
  step: string,
  formData: Partial<GuidedFormData>
): ValidationResult {
  const errors: ValidationErrors = {}

  switch (step) {
    case 'contact':
      // Name validation
      if (!formData.name?.trim()) {
        errors.name = 'Name is required'
      } else if (formData.name.length > 50) {
        errors.name = 'Name must be 50 characters or less'
      }

      // Email validation
      if (!formData.email?.trim()) {
        errors.email = 'Email is required'
      } else if (!isValidEmail(formData.email)) {
        errors.email = 'Please enter a valid email address'
      }

      // Company validation (optional)
      if (formData.company && formData.company.length > 50) {
        errors.company = 'Company name must be 50 characters or less'
      }
      break

    case 'projectType':
      if (!formData.projectType) {
        errors.projectType = 'Please select a project type'
      }
      break

    case 'description':
      if (!formData.projectDescription?.trim()) {
        errors.projectDescription = 'Project description is required'
      } else if (formData.projectDescription.length < 10) {
        errors.projectDescription = 'Please provide at least 10 characters'
      } else if (formData.projectDescription.length > 1000) {
        errors.projectDescription = 'Description must be 1000 characters or less'
      }
      break

    case 'features':
      if (!formData.features || formData.features.length === 0) {
        errors.features = 'Please select at least one feature'
      }
      break

    case 'timeline':
      if (!formData.timeline) {
        errors.timeline = 'Please select a timeline'
      }
      break

    case 'budget':
      if (!formData.budget) {
        errors.budget = 'Please select a budget range'
      }
      break
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Validate entire guided form
export function validateGuidedForm(data: Partial<GuidedFormData>): ValidationResult {
  const errors: ValidationErrors = {}

  // Sanitize all text inputs
  const sanitizedData = {
    ...data,
    name: sanitizeHtml(data.name || ''),
    email: sanitizeHtml(data.email || ''),
    company: data.company ? sanitizeHtml(data.company) : '',
    projectDescription: sanitizeHtml(data.projectDescription || ''),
  }

  // Required field validations
  const nameError = validateRequired(sanitizedData.name, 'Name')
  if (nameError) errors.name = nameError

  const emailError = validateRequired(sanitizedData.email, 'Email')
  if (emailError) errors.email = emailError

  const projectTypeError = validateRequired(data.projectType, 'Project Type')
  if (projectTypeError) errors.projectType = projectTypeError

  const timelineError = validateRequired(data.timeline, 'Timeline')
  if (timelineError) errors.timeline = timelineError

  const budgetError = validateRequired(data.budget, 'Budget')
  if (budgetError) errors.budget = budgetError

  // Email format validation
  if (sanitizedData.email && !isValidEmail(sanitizedData.email)) {
    errors.email = 'Please enter a valid email address'
  }

  // Length validations
  const nameLengthError = validateLength(sanitizedData.name, 50, 'Name')
  if (nameLengthError && !errors.name) errors.name = nameLengthError

  if (sanitizedData.company) {
    const companyLengthError = validateLength(sanitizedData.company, 50, 'Company')
    if (companyLengthError) errors.company = companyLengthError
  }

  const descriptionLengthError = validateLength(
    sanitizedData.projectDescription,
    1000,
    'Project Description'
  )
  if (descriptionLengthError && !errors.projectDescription) {
    errors.projectDescription = descriptionLengthError
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Validate technical form
export function validateTechnicalForm(data: Partial<TechnicalFormData>): ValidationResult {
  const errors: ValidationErrors = {}

  // Sanitize all text inputs
  const sanitizedData = {
    ...data,
    contactName: sanitizeHtml(data.contactName || ''),
    contactEmail: sanitizeHtml(data.contactEmail || ''),
    companyName: data.companyName ? sanitizeHtml(data.companyName) : '',
    projectName: sanitizeHtml(data.projectName || ''),
    projectType: sanitizeHtml(data.projectType || ''),
    projectDescription: sanitizeHtml(data.projectDescription || ''),
    targetAudience: data.targetAudience ? sanitizeHtml(data.targetAudience) : '',
    techStack: data.techStack ? sanitizeHtml(data.techStack) : '',
    features: sanitizeHtml(data.features || ''),
    integrations: data.integrations ? sanitizeHtml(data.integrations) : '',
    hostingPreference: data.hostingPreference ? sanitizeHtml(data.hostingPreference) : '',
    timeline: sanitizeHtml(data.timeline || ''),
    budget: sanitizeHtml(data.budget || ''),
    designStatus: data.designStatus ? sanitizeHtml(data.designStatus) : '',
    additionalNotes: data.additionalNotes ? sanitizeHtml(data.additionalNotes) : ''
  }

  // Required field validations
  const requiredFields = [
    { field: 'contactName', label: 'Contact Name' },
    { field: 'contactEmail', label: 'Contact Email' },
    { field: 'projectName', label: 'Project Name' },
    { field: 'projectType', label: 'Project Type' },
    { field: 'projectDescription', label: 'Project Description' },
    { field: 'features', label: 'Features & Functionality' },
    { field: 'timeline', label: 'Timeline' },
    { field: 'budget', label: 'Budget Range' }
  ]

  requiredFields.forEach(({ field, label }) => {
    const error = validateRequired(sanitizedData[field as keyof typeof sanitizedData], label)
    if (error) errors[field] = error
  })

  // Email format validation
  if (sanitizedData.contactEmail && !isValidEmail(sanitizedData.contactEmail)) {
    errors.contactEmail = 'Please enter a valid email address'
  }

  // Length validations
  const lengthValidations = [
    { field: 'contactName', max: 50, label: 'Contact Name' },
    { field: 'companyName', max: 50, label: 'Company Name', optional: true },
    { field: 'projectName', max: 50, label: 'Project Name' },
    { field: 'projectDescription', max: 1000, label: 'Project Description' },
    { field: 'features', max: 1000, label: 'Features & Functionality' },
    { field: 'targetAudience', max: 1000, label: 'Target Audience', optional: true },
    { field: 'integrations', max: 1000, label: 'Integrations', optional: true },
    { field: 'additionalNotes', max: 1000, label: 'Additional Notes', optional: true }
  ]

  lengthValidations.forEach(({ field, max, label, optional }) => {
    const value = sanitizedData[field as keyof typeof sanitizedData]
    if (value && (value.length > 0 || !optional)) {
      const error = validateLength(value, max, label)
      if (error && !errors[field]) errors[field] = error
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Export all project type validation
export function isValidProjectType(type: string): type is ProjectType {
  return ['website', 'webapp', 'desktop', 'mobile', 'ecommerce', 'other'].includes(type)
}

// Export timeline validation
export function isValidTimeline(timeline: string): timeline is Timeline {
  return ['asap', '1month', '3months', 'flexible'].includes(timeline)
}

// Export budget validation
export function isValidBudget(budget: string): budget is Budget {
  return ['under5k', '5k-10k', '10k-25k', '25k+'].includes(budget)
}