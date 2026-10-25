import clsx from 'clsx'

const STATUS_COLORS = {
  // General
  ACTIVE:               'bg-green-100 text-green-800 ring-green-200 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-700/50',
  INACTIVE:             'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-700/30 dark:text-gray-300 dark:ring-gray-600/50',
  LOCKED:               'bg-red-100 text-red-800 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-700/50',
  SUSPENDED:            'bg-orange-100 text-orange-800 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:ring-orange-700/50',

  // Vendor
  PENDING_APPROVAL:     'bg-yellow-100 text-yellow-800 ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:ring-yellow-700/50',

  // Requisition / RFQ / PO
  CREATED:              'bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700/50',
  RFQ_CREATED:          'bg-indigo-100 text-indigo-800 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-700/50',
  OPEN:                 'bg-green-100 text-green-800 ring-green-200 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-700/50',
  CLOSED:               'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-700/30 dark:text-gray-300 dark:ring-gray-600/50',
  AWARDED:              'bg-purple-100 text-purple-800 ring-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-700/50',
  APPROVED:             'bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700/50',
  ACCEPTED:             'bg-teal-100 text-teal-800 ring-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:ring-teal-700/50',
  DELIVERED:            'bg-cyan-100 text-cyan-800 ring-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:ring-cyan-700/50',
  COMPLETED:            'bg-green-100 text-green-800 ring-green-200 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-700/50',
  CANCELLED:            'bg-red-100 text-red-800 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-700/50',
  DECLINED:             'bg-red-100 text-red-800 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-700/50',

  // Quotation
  SUBMITTED:            'bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700/50',
  SELECTED:             'bg-green-100 text-green-800 ring-green-200 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-700/50',
  REJECTED:             'bg-red-100 text-red-800 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-700/50',

  // Invoice
  PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800 ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:ring-yellow-700/50',
  VERIFIED:             'bg-green-100 text-green-800 ring-green-200 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-700/50',
  FLAGGED_VARIANCE:     'bg-orange-100 text-orange-800 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:ring-orange-700/50',
  PAID:                 'bg-teal-100 text-teal-800 ring-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:ring-teal-700/50',

  // Payment
  INITIATED:            'bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700/50',
  PROCESSING:           'bg-indigo-100 text-indigo-800 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-700/50',
  FAILED:               'bg-red-100 text-red-800 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-700/50',

  // GRN / Inspection
  PENDING_INSPECTION:   'bg-yellow-100 text-yellow-800 ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:ring-yellow-700/50',
  INSPECTED:            'bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700/50',
  PASSED:               'bg-green-100 text-green-800 ring-green-200 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-700/50',
  PARTIAL:              'bg-orange-100 text-orange-800 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:ring-orange-700/50',

  // Roles
  ADMIN:                'bg-primary-100 text-primary-800 ring-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:ring-primary-700/50',
  PROCUREMENT_MANAGER:  'bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700/50',
  INVENTORY_MANAGER:    'bg-teal-100 text-teal-800 ring-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:ring-teal-700/50',
  FINANCE_MANAGER:      'bg-indigo-100 text-indigo-800 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-700/50',
  VENDOR:               'bg-orange-100 text-orange-800 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:ring-orange-700/50',
}

/**
 * Status badge — pass a status string and it maps to the right color.
 * Falls back to neutral gray for unknown statuses.
 */
export default function Badge({ status, label, className }) {
  const text = label || status || '—'
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-700/30 dark:text-gray-300 dark:ring-gray-600/50'

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset',
        colorClass,
        className
      )}
    >
      {text}
    </span>
  )
}
