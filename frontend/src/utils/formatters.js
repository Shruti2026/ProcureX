/**
 * Format a number as INR currency
 * e.g. 14500 → "₹14,500.00"
 */
export const formatCurrency = (amount) => {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format an ISO date string to readable date
 * e.g. "2026-07-17T10:00:00Z" → "17 Jul 2026"
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format an ISO date string to date + time
 * e.g. "2026-07-17T10:00:00Z" → "17 Jul 2026, 10:00 AM"
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Truncate a UUID to last 8 chars for display
 * e.g. "abc...ef12ab34"
 */
export const shortId = (uuid) => {
  if (!uuid) return '—'
  return uuid.slice(-8).toUpperCase()
}
