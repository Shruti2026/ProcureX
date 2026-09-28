/**
 * Property-based tests for Badge component
 *
 * Validates: Requirements 7.2, 7.3, 7.4
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import Badge from '../Badge'

// ── Internal STATUS_COLORS mirror ──────────────────────────────────────────────
// Mirrors the STATUS_COLORS map defined in Badge.jsx so we can derive the
// expected bg class for each key without re-exporting the internal constant.
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

const ALL_KNOWN_KEYS = Object.keys(STATUS_COLORS)

// Helper — extract the bg-* class from a space-separated class string
function extractBgClass(classString) {
  return classString.split(' ').find(c => c.startsWith('bg-'))
}

// ── Property 6 — Badge STATUS_COLORS exhaustive mapping ───────────────────────
// For every key in STATUS_COLORS, rendering <Badge status={key} /> must produce
// a className that contains the registered bg color class (not the fallback
// bg-gray-100 unless that IS the registered class for that key).
//
// Validates: Requirements 7.2
describe('Property 6 — Badge STATUS_COLORS exhaustive mapping', () => {
  it('renders the registered bg class for every known status key', () => {
    fc.assert(
      fc.property(
        // Generator: pick any known status key
        fc.constantFrom(...ALL_KNOWN_KEYS),
        (statusKey) => {
          const { container } = render(<Badge status={statusKey} />)
          const span = container.querySelector('span')
          const className = span.className

          const expectedBg = extractBgClass(STATUS_COLORS[statusKey])

          // The rendered className must contain the registered bg class
          expect(className).toContain(expectedBg)
        }
      )
    )
  })

  it('does not apply the fallback bg-gray-100 for any known status key that has its own color', () => {
    // The keys that legitimately use bg-gray-100 (INACTIVE, CLOSED)
    const grayBgKeys = new Set(
      ALL_KNOWN_KEYS.filter(k => STATUS_COLORS[k].includes('bg-gray-100'))
    )

    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_KNOWN_KEYS.filter(k => !grayBgKeys.has(k))),
        (statusKey) => {
          const { container } = render(<Badge status={statusKey} />)
          const span = container.querySelector('span')
          // For non-gray keys, the fallback bg-gray-100 must NOT be applied
          // via the fallback path (it should instead have its own bg color)
          const expectedBg = extractBgClass(STATUS_COLORS[statusKey])
          expect(span.className).toContain(expectedBg)
          // Confirm the expected bg is not the fallback
          expect(expectedBg).not.toBe('bg-gray-100')
        }
      )
    )
  })
})

// ── Property 7 — Badge ring decoration universality ───────────────────────────
// For any status string — known, unknown, or empty — the rendered element's
// className must contain both `ring-1` and `ring-inset`.
//
// Validates: Requirements 7.3
describe('Property 7 — Badge ring decoration universality', () => {
  it('always includes ring-1 and ring-inset for known status strings', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_KNOWN_KEYS),
        (statusKey) => {
          const { container } = render(<Badge status={statusKey} />)
          const span = container.querySelector('span')
          expect(span.className).toContain('ring-1')
          expect(span.className).toContain('ring-inset')
        }
      )
    )
  })

  it('always includes ring-1 and ring-inset for unknown status strings', () => {
    // Generator: strings that are definitely not valid STATUS_COLORS keys
    const unknownStatusArb = fc.string({ minLength: 1 }).filter(
      s => !(s in STATUS_COLORS)
    )

    fc.assert(
      fc.property(unknownStatusArb, (unknownStatus) => {
        const { container } = render(<Badge status={unknownStatus} />)
        const span = container.querySelector('span')
        expect(span.className).toContain('ring-1')
        expect(span.className).toContain('ring-inset')
      }),
      { numRuns: 50 }
    )
  })

  it('always includes ring-1 and ring-inset for an empty string status', () => {
    const { container } = render(<Badge status="" />)
    const span = container.querySelector('span')
    expect(span.className).toContain('ring-1')
    expect(span.className).toContain('ring-inset')
  })

  it('always includes ring-1 and ring-inset for the literal UNKNOWN_STATUS string', () => {
    const { container } = render(<Badge status="UNKNOWN_STATUS" />)
    const span = container.querySelector('span')
    expect(span.className).toContain('ring-1')
    expect(span.className).toContain('ring-inset')
  })
})

// ── Property 8 — Badge unknown-status fallback ────────────────────────────────
// For any string not present in STATUS_COLORS, the rendered Badge must apply
// the neutral fallback: bg-gray-100 and text-gray-600.
//
// Validates: Requirements 7.4
describe('Property 8 — Badge unknown-status fallback', () => {
  it('renders bg-gray-100 and text-gray-600 for any string not in STATUS_COLORS', () => {
    const unknownStatusArb = fc.string({ minLength: 1 }).filter(
      s => !(s in STATUS_COLORS)
    )

    fc.assert(
      fc.property(unknownStatusArb, (unknownStatus) => {
        const { container } = render(<Badge status={unknownStatus} />)
        const span = container.querySelector('span')
        expect(span.className).toContain('bg-gray-100')
        expect(span.className).toContain('text-gray-600')
      }),
      { numRuns: 50 }
    )
  })

  it('renders the fallback for well-known unknown strings like UNKNOWN_XYZ', () => {
    const unknownKeys = ['UNKNOWN_XYZ', 'RANDOM', 'NOT_A_STATUS', 'foobar', '123']
    for (const key of unknownKeys) {
      const { container } = render(<Badge status={key} />)
      const span = container.querySelector('span')
      expect(span.className).toContain('bg-gray-100')
      expect(span.className).toContain('text-gray-600')
    }
  })

  it('renders the fallback for an empty status string', () => {
    const { container } = render(<Badge status="" />)
    const span = container.querySelector('span')
    expect(span.className).toContain('bg-gray-100')
    expect(span.className).toContain('text-gray-600')
  })
})
