import clsx from 'clsx'
import { forwardRef } from 'react'

/**
 * Controlled input with label and inline error message.
 * Forwards ref so it works with react-hook-form's register().
 */
const Input = forwardRef(function Input(
  { label, error, id, className, type = 'text', ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={clsx(
          'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'disabled:bg-gray-50 disabled:cursor-not-allowed',
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-300',
          className
        )}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
