'use client'

interface FormErrorsProps {
  errors: Record<string, string>
  className?: string
}

export default function FormErrors({
  errors,
  className = ''
}: FormErrorsProps) {
  const errorEntries = Object.entries(errors)

  if (errorEntries.length === 0) {
    return null
  }

  return (
    <div
      className={`
        bg-red-50 border border-red-300 rounded-lg p-4
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <h3 className="text-red-800 font-semibold mb-2">
        Please correct the following errors:
      </h3>
      <ul className="list-disc list-inside text-red-700">
        {errorEntries.map(([field, message]) => (
          <li key={field}>
            <span className="font-medium capitalize">
              {field.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            : {message}
          </li>
        ))}
      </ul>
    </div>
  )
}