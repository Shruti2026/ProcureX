/**
 * Property-based tests for Table component
 *
 * Validates: Requirements 9.2, 9.6
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import Table from '../Table'

// ── Property 10 — Table header column label styling invariant ─────────────────
// For any non-empty array of column name strings passed to Table, every rendered
// <th> element's className must contain the five required header style classes:
//   text-xs  font-semibold  text-gray-400  uppercase  tracking-wider
//
// Validates: Requirements 9.2
describe('Property 10 — Table header column label styling invariant', () => {
  // Generator: non-empty array of non-empty strings (column names)
  const nonEmptyColumnsArb = fc.array(
    fc.string({ minLength: 1, maxLength: 40 }),
    { minLength: 1, maxLength: 10 }
  )

  const REQUIRED_HEADER_CLASSES = [
    'text-xs',
    'font-semibold',
    'text-gray-400',
    'uppercase',
    'tracking-wider',
  ]

  it('every <th> has all five required header style classes for any non-empty columns array', () => {
    fc.assert(
      fc.property(nonEmptyColumnsArb, (columns) => {
        const { container } = render(<Table columns={columns} />)
        const headers = container.querySelectorAll('th')

        // The number of <th> elements must match the number of columns
        expect(headers.length).toBe(columns.length)

        // Every <th> must contain each required class
        headers.forEach((th) => {
          REQUIRED_HEADER_CLASSES.forEach((cls) => {
            expect(th.className).toContain(cls)
          })
        })
      }),
      { numRuns: 100 }
    )
  })

  it('a single-column table still renders the <th> with all required header classes', () => {
    // Exhaustive check for the single-column edge case
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 40 }),
        (columnName) => {
          const { container } = render(<Table columns={[columnName]} />)
          const headers = container.querySelectorAll('th')

          expect(headers.length).toBe(1)
          REQUIRED_HEADER_CLASSES.forEach((cls) => {
            expect(headers[0].className).toContain(cls)
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('a multi-column table (5 columns) has all required header classes on every <th>', () => {
    const columns = ['ID', 'Title', 'Status', 'Created By', 'Date']
    const { container } = render(<Table columns={columns} />)
    const headers = container.querySelectorAll('th')

    expect(headers.length).toBe(5)
    headers.forEach((th) => {
      REQUIRED_HEADER_CLASSES.forEach((cls) => {
        expect(th.className).toContain(cls)
      })
    })
  })

  it('columns with special characters still produce correctly-styled <th> elements', () => {
    // Stress-test the column label content — content should not affect styling
    const specialColumns = [
      'Invoice #',
      'Amount ($)',
      'Date/Time',
      'Status & Notes',
      'PO Number',
    ]
    const { container } = render(<Table columns={specialColumns} />)
    const headers = container.querySelectorAll('th')

    expect(headers.length).toBe(specialColumns.length)
    headers.forEach((th) => {
      REQUIRED_HEADER_CLASSES.forEach((cls) => {
        expect(th.className).toContain(cls)
      })
    })
  })
})

// ── Property 11 — Table empty message display ─────────────────────────────────
// For any non-empty emptyMessage string, rendering <Table> with empty={true}
// and loading={false} must produce output that includes the exact message string
// somewhere in the table body.
//
// Validates: Requirements 9.6
describe('Property 11 — Table empty message display', () => {
  // Generator: non-empty string — covers varied lengths and characters
  const nonEmptyMessageArb = fc.string({ minLength: 1, maxLength: 200 })

  it('the exact emptyMessage string appears in the rendered output when empty={true} and loading={false}', () => {
    fc.assert(
      fc.property(nonEmptyMessageArb, (message) => {
        const { container } = render(
          <Table
            columns={[]}
            emptyMessage={message}
            empty={true}
            loading={false}
          />
        )

        // The exact message text must appear somewhere inside the table body
        const tbody = container.querySelector('tbody')
        expect(tbody).not.toBeNull()
        expect(tbody.textContent).toContain(message)
      }),
      { numRuns: 100 }
    )
  })

  it('the exact default emptyMessage appears when no emptyMessage prop is supplied and empty={true}', () => {
    const { container } = render(
      <Table columns={[]} empty={true} loading={false} />
    )
    const tbody = container.querySelector('tbody')
    expect(tbody.textContent).toContain('No records found.')
  })

  it('the empty message does NOT appear when loading={true} regardless of empty={true}', () => {
    const message = 'No records found.'
    const { container } = render(
      <Table
        columns={['A']}
        emptyMessage={message}
        empty={true}
        loading={true}
      />
    )
    // When loading, the spinner row is shown — the empty message must not appear
    const tbody = container.querySelector('tbody')
    expect(tbody.textContent).not.toContain(message)
  })

  it('the empty message does NOT appear when empty={false} and children are present', () => {
    const message = 'Nothing to show'
    const { container } = render(
      <Table
        columns={['Name']}
        emptyMessage={message}
        empty={false}
        loading={false}
      >
        <tr>
          <td>Row 1</td>
        </tr>
      </Table>
    )
    const tbody = container.querySelector('tbody')
    // The custom message must not appear; the child row should render instead
    expect(tbody.textContent).not.toContain(message)
    expect(tbody.textContent).toContain('Row 1')
  })

  it('renders the exact message for several representative message strings', () => {
    const messages = [
      'No records found.',
      'No purchase orders available.',
      'Nothing here yet.',
      'Empty.',
      'No data to display at this time.',
    ]

    messages.forEach((msg) => {
      const { container } = render(
        <Table
          columns={['Col1', 'Col2']}
          emptyMessage={msg}
          empty={true}
          loading={false}
        />
      )
      const tbody = container.querySelector('tbody')
      expect(tbody.textContent).toContain(msg)
    })
  })
})
