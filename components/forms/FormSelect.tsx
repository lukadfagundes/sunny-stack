'use client'

import { ChangeEvent } from 'react'

interface SelectOption {
  value: string
  label: string
}

export interface FormSelectProps {
  label: string
  name: string
  value: string
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void
  options: SelectOption[]
  error?: string
  required?: boolean
  placeholder?: string
  className?: string
}

export default function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required = false,
  placeholder = 'Select an option',
  className = ''
}: FormSelectProps) {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-sunny-brown mb-1"
      >
        {label} {required && <span className="text-sunny-red">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`
          w-full px-3 py-2 border rounded-lg bg-white text-gray-900
          transition-colors duration-200
          ${error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500 focus-visible:ring-2 focus-visible:ring-red-500'
            : 'border-sunny-gold/30 hover:border-sunny-gold focus:border-sunny-red focus:ring-sunny-red focus-visible:ring-2 focus-visible:ring-sunny-red'
          }
          focus:outline-none focus:ring-2 focus:ring-opacity-20 focus-visible:ring-opacity-50
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${name}-error`} className="text-red-500 text-sm mt-1" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  )
}
