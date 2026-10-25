import clsx from 'clsx'
import Spinner from './Spinner'

/**
 * Button variants: 'primary' | 'secondary' | 'danger' | 'ghost'
 * Button sizes:    'sm' | 'md' | 'lg'
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className,
  style,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'text-white hover:brightness-110 focus:ring-primary-500 active:scale-[0.97] transition-all duration-100',
    secondary:
      'bg-white text-primary-700 border border-primary-200 hover:bg-primary-50 focus:ring-primary-400 active:scale-[0.97] transition-all duration-100',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 active:scale-[0.97] transition-all duration-100',
    ghost:
      'text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:ring-gray-300 transition-colors duration-150',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const primaryStyle =
    variant === 'primary'
      ? { background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', ...style }
      : style

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(base, variants[variant], sizes[size], className)}
      style={primaryStyle}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
