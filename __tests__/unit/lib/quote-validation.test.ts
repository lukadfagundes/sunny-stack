// __tests__/unit/lib/quote-validation.test.ts

import {
  isValidEmail,
  isValidPhone,
  sanitizeHtml,
  validateLength,
  validateRequired,
  validateGuidedStep,
  validateGuidedForm,
  validateTechnicalForm,
  isValidProjectType,
  isValidTimeline,
  isValidBudget
} from '@/lib/quote-validation'

describe('Quote Validation', () => {
  describe('isValidEmail', () => {
    test('validates correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('user+tag@example.org')).toBe(true)
    })

    test('rejects invalid email formats', () => {
      expect(isValidEmail('notanemail')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('user @example.com')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })

    test('handles email with spaces', () => {
      expect(isValidEmail(' test@example.com ')).toBe(true)
      expect(isValidEmail('test @example.com')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    test('validates correct phone formats', () => {
      expect(isValidPhone('1234567890')).toBe(true)
      expect(isValidPhone('+1 (555) 123-4567')).toBe(true)
      expect(isValidPhone('555-123-4567')).toBe(true)
      expect(isValidPhone('+44 20 7123 4567')).toBe(true)
    })

    test('rejects invalid phone formats', () => {
      expect(isValidPhone('123')).toBe(false) // Too short
      expect(isValidPhone('12345678901234567')).toBe(false) // Too long
      expect(isValidPhone('abc-def-ghij')).toBe(false)
      expect(isValidPhone('')).toBe(false)
    })
  })

  describe('sanitizeHtml', () => {
    test('removes HTML tags', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('alert("xss")')
      expect(sanitizeHtml('<p>Hello <b>world</b></p>')).toBe('Hello world')
      expect(sanitizeHtml('No tags here')).toBe('No tags here')
    })

    test('handles empty and whitespace', () => {
      expect(sanitizeHtml('')).toBe('')
      expect(sanitizeHtml('  spaces  ')).toBe('spaces')
      expect(sanitizeHtml('<p>  </p>')).toBe('')
    })
  })

  describe('validateLength', () => {
    test('validates string length correctly', () => {
      expect(validateLength('hello', 10, 'Field')).toBeNull()
      expect(validateLength('hello', 5, 'Field')).toBeNull()
      expect(validateLength('hello', 4, 'Field')).toBe('Field must be 4 characters or less')
    })

    test('handles empty strings', () => {
      expect(validateLength('', 10, 'Field')).toBeNull()
    })
  })

  describe('validateRequired', () => {
    test('validates required fields', () => {
      expect(validateRequired('value', 'Field')).toBeNull()
      expect(validateRequired('', 'Field')).toBe('Field is required')
      expect(validateRequired(null, 'Field')).toBe('Field is required')
      expect(validateRequired(undefined, 'Field')).toBe('Field is required')
      expect(validateRequired('  ', 'Field')).toBe('Field is required')
    })
  })

  describe('validateGuidedStep', () => {
    test('validates contact step', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp'
      }

      const result = validateGuidedStep('contact', validData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    test('catches contact step errors', () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        company: 'A'.repeat(51)
      }

      const result = validateGuidedStep('contact', invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBe('Name is required')
      expect(result.errors.email).toBe('Please enter a valid email address')
      expect(result.errors.company).toBe('Company name must be 50 characters or less')
    })

    test('validates project type step', () => {
      expect(validateGuidedStep('projectType', { projectType: 'website' }).isValid).toBe(true)
      expect(validateGuidedStep('projectType', { projectType: '' }).isValid).toBe(false)
    })

    test('validates timeline step', () => {
      expect(validateGuidedStep('timeline', { timeline: 'asap' }).isValid).toBe(true)
      expect(validateGuidedStep('timeline', { timeline: '' }).isValid).toBe(false)
    })

    test('validates budget step', () => {
      expect(validateGuidedStep('budget', { budget: '10k-25k' }).isValid).toBe(true)
      expect(validateGuidedStep('budget', { budget: '' }).isValid).toBe(false)
    })
  })

  describe('validateGuidedForm', () => {
    test('validates complete valid form', () => {
      const validForm = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
        projectType: 'website' as const,
        projectDescription: 'A new company website with modern design',
        features: ['responsive', 'seo'],
        timeline: 'asap' as const,
        budget: '10k-25k' as const
      }

      const result = validateGuidedForm(validForm)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    test('catches multiple validation errors', () => {
      const invalidForm = {
        name: '',
        email: 'not-an-email',
        projectType: '',
        projectDescription: 'Short',
        timeline: '',
        budget: ''
      }

      const result = validateGuidedForm(invalidForm)
      expect(result.isValid).toBe(false)
      expect(Object.keys(result.errors).length).toBeGreaterThan(0)
      expect(result.errors.name).toBeDefined()
      expect(result.errors.email).toBeDefined()
    })

    test('sanitizes HTML in inputs', () => {
      const formWithHtml = {
        name: '<script>John</script>',
        email: 'john@example.com',
        projectType: 'website' as const,
        projectDescription: '<p>Description</p>',
        timeline: 'asap' as const,
        budget: '10k-25k' as const
      }

      const result = validateGuidedForm(formWithHtml)
      // Should validate successfully after sanitization
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateTechnicalForm', () => {
    test('validates complete valid technical form', () => {
      const validForm = {
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        companyName: 'Acme Corp',
        projectName: 'New Platform',
        projectType: 'Web Application',
        projectDescription: 'A comprehensive web application for project management',
        features: 'User auth, Dashboard, Reports',
        timeline: '3 months',
        budget: '$25,000-$50,000'
      }

      const result = validateTechnicalForm(validForm)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    test('catches required field errors', () => {
      const emptyForm = {}

      const result = validateTechnicalForm(emptyForm)
      expect(result.isValid).toBe(false)
      expect(result.errors.contactName).toBeDefined()
      expect(result.errors.contactEmail).toBeDefined()
      expect(result.errors.projectName).toBeDefined()
    })

    test('validates field lengths', () => {
      const longForm = {
        contactName: 'A'.repeat(51),
        contactEmail: 'john@example.com',
        projectName: 'B'.repeat(51),
        projectType: 'Web',
        projectDescription: 'C'.repeat(1001),
        features: 'D'.repeat(1001),
        timeline: '3 months',
        budget: '$25,000'
      }

      const result = validateTechnicalForm(longForm)
      expect(result.isValid).toBe(false)
      expect(result.errors.contactName).toContain('50 characters or less')
      expect(result.errors.projectName).toContain('50 characters or less')
      expect(result.errors.projectDescription).toContain('1000 characters or less')
    })
  })

  describe('Type validators', () => {
    test('isValidProjectType', () => {
      expect(isValidProjectType('website')).toBe(true)
      expect(isValidProjectType('webapp')).toBe(true)
      expect(isValidProjectType('invalid')).toBe(false)
    })

    test('isValidTimeline', () => {
      expect(isValidTimeline('asap')).toBe(true)
      expect(isValidTimeline('1month')).toBe(true)
      expect(isValidTimeline('never')).toBe(false)
    })

    test('isValidBudget', () => {
      expect(isValidBudget('under5k')).toBe(true)
      expect(isValidBudget('10k-25k')).toBe(true)
      expect(isValidBudget('millions')).toBe(false)
    })
  })
})