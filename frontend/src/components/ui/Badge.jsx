import clsx from 'clsx'

const STATUS_COLORS = {
  // General
  ACTIVE:               'bg-green-100 text-green-800 ring-green-200',
  INACTIVE:             'bg-gray-100 text-gray-600 ring-gray-200',
  LOCKED:               'bg-red-100 text-red-800 ring-red-200',
  SUSPENDED:            'bg-orange-100 text-orange-800 ring-orange-200',

  // Vendor
  PENDING_APPROVAL:     'bg-yellow-100 text-yellow-800 ring-yellow-200',

  // Requisition / RFQ / PO
  CREATED:              'bg-blue-100 text-blue-800 ring-blue-200',
  RFQ_CREATED:          'bg-indigo-100 text-indigo-800 ring-indigo-200',
  OPEN:                 'bg-green-100 text-green-800 ring-green-200',
  CLOSED:               'bg-gray-100 text-gray-600 ring-gray-200',
  AWARDED:              'bg-purple-100 text-purple-800 ring-purple-200',
  APPROVED:             'bg-blue-100 text-blue-800 ring-blue-200',
  ACCEPTED:             'bg-teal-100 text-teal-800 ring-teal-200',
  DELIVERED:            'bg-cyan-100 text-cyan-800 ring-cyan-200',
  COMPLETED:            'bg-green-100 text-green-800 ring-green-200',
  CANCELLED:            'bg-red-100 text-red-800 ring-red-200',

  // Quotation
  SUBMITTED:            'bg-blue-100 text-blue-800 ring-blue-200',
  SELECTED:             'bg-green-100 text-green-800 ring-green-200',
  REJECTED:             'bg-red-100 text-red-800 ring-red-200',

  // Invoice
  PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  VERIFIED:             'bg-green-100 text-green-800 ring-green-200',
  FLAGGED_VARIANCE:     'bg-orange-100 text-orange-800 ring-orange-200',
  PAID:                 'bg-teal-100 text-teal-800 ring-teal-200',

  // Payment
  INITIATED:            'bg-blue-100 text-blue-800 ring-blue-200',
  PROCESSING:           'bg-indigo-100 text-indigo-800 ring-indigo-200',
  FAILED:               'bg-red-100 text-red-800 ring-red-200',

  // GRN / Inspection
  PENDING_INSPECTION:   'bg-yellow-100 text-yellow-800 ring-yellow-200',
  INSPECTED:            'bg-blue-100 text-blue-800 ring-blue-200',
  PASSED:               'bg-green-100 text-green-800 ring-green-200',
  PARTIAL:              'bg-orange-100 text-orange-800 ring-orange-200',

  // Roles
  ADMIN:                'bg-purple-100 text-purple-800 ring-purple-200',
  PROCUREMENT_MANAGER:  'bg-blue-100 text-blue-800 ring-blue-200',
  INVENTORY_MANAGER:    'bg-teal-100 text-teal-800 ring-teal-200',
  FINANCE_MANAGER:      'bg-indigo-100 text-indigo-800 ring-indigo-200',
  VENDOR:               'bg-orange-100 text-orange-800 ring-orange-200',
}

/**
 * Status badge — pass a status string and it maps to the right color.
 * Falls back to neutral gray for unknown statuses.
 */
export default function Badge({ status, label, className }) {
  const text = label || status || '—'
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600 ring-gray-200'

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
