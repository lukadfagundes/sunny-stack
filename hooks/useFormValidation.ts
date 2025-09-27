import { useState, useCallback } from 'react'
import { TrinityDebugger } from '@/lib/trinity-debug'

const debug = new TrinityDebugger('useFormValidation')

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: unknown) => boolean | string
}

export interface ValidationSchema {
  [field: string]: ValidationRule
}

export interface ValidationErrors {
  [field: string]: string
}

export function useFormValidation<T extends Record<string, unknown>>(
  schema: ValidationSchema
) {
  debug.entry('useFormValidation', { fields: Object.keys(schema) })

  const [errors, setErrors] = useState<ValidationErrors>({})

  const validateField = useCallback(
    (field: keyof T, value: unknown): string | null => {
      debug.info('validateField', "Debug log", { field, value })

      const rules = schema[field as string]
      if (!rules) return null

      // Required validation
      if (rules.required && !value) {
        return `${String(field)} is required`
      }

      // String validations
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          return `${String(field)} must be at least ${rules.minLength} characters`
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          return `${String(field)} must be no more than ${rules.maxLength} characters`
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          return `${String(field)} is invalid`
        }
      }

      // Custom validation
      if (rules.custom) {
        const result = rules.custom(value)
        if (typeof result === 'string') {
          return result
        } else if (!result) {
          return `${String(field)} is invalid`
        }
      }

      return null
    },
    [schema]
  )

  const validate = useCallback(
    (data: Partial<T>, fieldsToValidate?: Array<keyof T>): boolean => {
      debug.info('validate', "Debug log", { data, fieldsToValidate })

      const newErrors: ValidationErrors = {}
      const fields = fieldsToValidate || (Object.keys(schema) as Array<keyof T>)

      fields.forEach((field) => {
        const error = validateField(field, data[field])
        if (error) {
          newErrors[field as string] = error
        }
      })

      setErrors(newErrors)
      const isValid = Object.keys(newErrors).length === 0

      debug.info('validate result', "Debug log", { isValid, errors: newErrors })
      return isValid
    },
    [schema, validateField]
  )

  const validateSingle = useCallback(
    (field: keyof T, value: unknown): boolean => {
      debug.info('validateSingle', "Debug log", { field, value })

      const error = validateField(field, value)

      setErrors((prev) => {
        const newErrors = { ...prev }
        if (error) {
          newErrors[field as string] = error
        } else {
          delete newErrors[field as string]
        }
        return newErrors
      })

      return !error
    },
    [validateField]
  )

  const clearErrors = useCallback((fields?: Array<keyof T>) => {
    debug.info('clearErrors', "Debug log", { fields })

    if (fields) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        fields.forEach((field) => {
          delete newErrors[field as string]
        })
        return newErrors
      })
    } else {
      setErrors({})
    }
  }, [])

  const setFieldError = useCallback((field: keyof T, error: string) => {
    debug.info('setFieldError', "Debug log", { field, error })

    setErrors((prev) => ({
      ...prev,
      [field as string]: error
    }))
  }, [])

  return {
    errors,
    validate,
    validateSingle,
    clearErrors,
    setFieldError,
    isValid: Object.keys(errors).length === 0
  }
}
