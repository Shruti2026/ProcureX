import clsx from 'clsx'

const STATUS_COLORS = {
  // General
  ACTIVE:               'bg-green-100 text-green-800',
  INACTIVE:             'bg-gray-100 text-gray-600',
  LOCKED:               'bg-red-100 text-red-800',
  SUSPENDED:            'bg-orange-100 text-orange-800',

  // Vendor
  PENDING_APPROVAL:     'bg-yellow-100 text-yellow-800',

  // Requisition / RFQ / PO
  CREATED:              'bg-blue-100 text-blue-800',
  RFQ_CREATED:          'bg-indigo-100 text-indigo-800',
  OPEN:                 'bg-green-100 text-green-800',
  CLOSED:               'bg-gray-100 text-gray-600',
  AWARDED:              'bg-purple-100 text-purple-800',
  APPROVED:             'bg-blue-100 text-blue-800',
  ACCEPTED:             'bg-teal-100 text-teal-800',
  DELIVERED:            'bg-cyan-100 text-cyan-800',
  COMPLETED:            'bg-green-100 text-green-800',
  CANCELLED:            'bg-red-100 text-red-800',

  // Quotation
  SUBMITTED:            'bg-blue-100 text-blue-800',
  SELECTED:             'bg-green-100 text-green-800',
  REJECTED:             'bg-red-100 text-red-800',

  // Invoice
  PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
  VERIFIED:             'bg-green-100 text-green-800',
  FLAGGED_VARIANCE:     'bg-orange-100 text-orange-800',
  PAID:                 'bg-teal-100 text-teal-800',

  // Payment
  INITIATED:            'bg-blue-100 text-blue-800',
  PROCESSING:           'bg-indigo-100 text-indigo-800',
  FAILED:               'bg-red-100 text-red-800',

  // GRN / Inspection
  PENDING_INSPECTION:   'bg-yellow-100 text-yellow-800',
  INSPECTED:            'bg-blue-100 text-blue-800',
  PASSED:               'bg-green-100 text-green-800',
  PARTIAL:              'bg-orange-100 text-orange-800',

  // Roles
  ADMIN:                'bg-purple-100 text-purple-800',
  PROCUREMENT_MANAGER:  'bg-blue-100 text-blue-800',
  INVENTORY_MANAGER:    'bg-teal-100 text-teal-800',
  FINANCE_MANAGER:      'bg-indigo-100 text-indigo-800',
  VENDOR:               'bg-orange-100 text-orange-800',
}

/**
 * Status badge — pass a status string and it maps to the right color.
 * Falls back to neutral gray for unknown statuses.
 */
export default function Badge({ status, label, className }) {
  const text = label || status || '—'
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClass,
        className
      )}
    >
      {text}
    </span>
  )
}
