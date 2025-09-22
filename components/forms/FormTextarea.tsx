'use client'

import { ChangeEvent } from 'react'

interface FormTextareaProps {
  label: string
  name: string
  value: string
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  error?: string
  required?: boolean
  placeholder?: string
  rows?: number
  className?: string
}

export default function FormTextarea({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  rows = 4,
  className = ''
}: FormTextareaProps) {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-sunny-brown mb-1"
      >
        {label} {required && <span className="text-sunny-red">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
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