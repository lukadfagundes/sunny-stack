'use client'

import { ChangeEvent } from 'react'

interface FormFieldProps {
  label: string
  name: string
  type?: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  error?: string
  required?: boolean
  placeholder?: string
  className?: string
}

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  className = ''
}: FormFieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-sunny-brown mb-1"
      >
        {label} {required && <span className="text-sunny-red">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full px-3 py-2 border rounded-lg
          transition-colors duration-200
          ${error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-sunny-gold/30 hover:border-sunny-gold focus:border-sunny-red focus:ring-sunny-red'
          }
          focus:outline-none focus:ring-2 focus:ring-opacity-20
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className="text-red-500 text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  )
}