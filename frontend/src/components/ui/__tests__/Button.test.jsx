/**
 * Property-based tests for Button component
 *
 * Validates: Requirements 5.1, 5.8
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import Button from '../Button'

// ── Property 2 — Button scale transform invariant ─────────────────────────────
// For any variant in ['primary', 'secondary', 'danger'], the rendered button's
// className must contain `active:scale-[0.97]`.
// For the 'ghost' variant it must NOT contain `active:scale-[0.97]`.
//
// Validates: Requirements 5.1
describe('Property 2 — Button scale transform invariant', () => {
  const SCALE_VARIANTS = ['primary', 'secondary', 'danger']

  it('includes active:scale-[0.97] for every interactive variant', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SCALE_VARIANTS),
        (variant) => {
          const { container } = render(
            <Button variant={variant}>Label</Button>
          )
          const btn = container.querySelector('button')
          expect(btn.className).toContain('active:scale-[0.97]')
        }
      )
    )
  })

  it('does NOT include active:scale-[0.97] for the ghost variant', () => {
    const { container } = render(<Button variant="ghost">Label</Button>)
    const btn = container.querySelector('button')
    expect(btn.className).not.toContain('active:scale-[0.97]')
  })
})

// ── Property 3 — Button prop combination stability ────────────────────────────
// For any combination of size in ['sm', 'md', 'lg'], loading in [true, false],
// and disabled in [true, false], the Button renders without throwing and the
// output contains the correct size-specific padding class.
//
// Size → padding class mapping:
//   sm → px-3
//   md → px-4
//   lg → px-6
//
// Validates: Requirements 5.8
describe('Property 3 — Button prop combination stability', () => {
  const SIZES = ['sm', 'md', 'lg']
  const PADDING = { sm: 'px-3', md: 'px-4', lg: 'px-6' }

  it('renders without throwing and shows correct padding for every size × loading × disabled combination', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SIZES),
        fc.boolean(),
        fc.boolean(),
        (size, loading, disabled) => {
          // Should not throw
          let container
          expect(() => {
            ;({ container } = render(
              <Button size={size} loading={loading} disabled={disabled}>
                Label
              </Button>
            ))
          }).not.toThrow()

          const btn = container.querySelector('button')

          // Button must always be present in the DOM
          expect(btn).not.toBeNull()

          // Must carry the correct padding class for the given size
          expect(btn.className).toContain(PADDING[size])
        }
      )
    )
  })

  it('renders the sm button with px-3 padding', () => {
    const { container } = render(<Button size="sm">Label</Button>)
    expect(container.querySelector('button').className).toContain('px-3')
  })

  it('renders the md button with px-4 padding', () => {
    const { container } = render(<Button size="md">Label</Button>)
    expect(container.querySelector('button').className).toContain('px-4')
  })

  it('renders the lg button with px-6 padding', () => {
    const { container } = render(<Button size="lg">Label</Button>)
    expect(container.querySelector('button').className).toContain('px-6')
  })

  it('is disabled when loading=true regardless of disabled prop', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // disabled prop value
        (disabled) => {
          const { container } = render(
            <Button loading={true} disabled={disabled}>
              Label
            </Button>
          )
          const btn = container.querySelector('button')
          // loading forces the button into a disabled state
          expect(btn).toBeDisabled()
        }
      )
    )
  })
})
