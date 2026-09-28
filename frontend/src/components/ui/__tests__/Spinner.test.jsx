/**
 * Property tests for Spinner component
 *
 * Property 9: Spinner size class correctness
 *   For any size in ['sm', 'md', 'lg'], the rendered Spinner element's className
 *   contains the expected dimension classes.
 *   Validates: Requirements 8.3
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import * as fc from 'fast-check'
import Spinner from '../Spinner'

// Ensure DOM is cleaned up between every test
afterEach(() => cleanup())

// ─── Size dimension map (source of truth) ────────────────────────────────────
const SIZE_CLASSES = {
  sm: ['h-4', 'w-4'],
  md: ['h-6', 'w-6'],
  lg: ['h-10', 'w-10'],
}

const SIZES = Object.keys(SIZE_CLASSES)

// ─── Property 9: Spinner size class correctness ───────────────────────────────
describe('Property 9 — Spinner size class correctness (Validates: Requirements 8.3)', () => {
  it('contains the expected dimension classes for every size in the known size set', () => {
    fc.assert(
      fc.property(
        // Generator: pick any size from the valid size set
        fc.constantFrom(...SIZES),
        (size) => {
          const { getByRole } = render(<Spinner size={size} />)
          const el = getByRole('status')
          const classes = el.className.split(' ')

          const [expectedH, expectedW] = SIZE_CLASSES[size]
          const result =
            classes.includes(expectedH) && classes.includes(expectedW)

          // Clean up DOM after each fast-check iteration
          cleanup()
          return result
        }
      ),
      { numRuns: 30 }
    )
  })

  // Concrete examples for each size — explicit guard against regressions
  it.each(SIZES)('size "%s" renders with correct h/w classes', (size) => {
    const { getByRole } = render(<Spinner size={size} />)
    const el = getByRole('status')
    const classes = el.className.split(' ')

    const [expectedH, expectedW] = SIZE_CLASSES[size]
    expect(classes).toContain(expectedH)
    expect(classes).toContain(expectedW)
  })
})

// ─── Bonus: default className → text-primary-500 ─────────────────────────────
describe('Spinner default color class', () => {
  it('includes text-primary-500 when no className prop is passed', () => {
    const { getByRole } = render(<Spinner />)
    const el = getByRole('status')
    expect(el.className).toContain('text-primary-500')
  })

  it('does not apply text-primary-500 when a custom className is passed', () => {
    const { getByRole } = render(<Spinner className="text-red-500" />)
    const el = getByRole('status')
    expect(el.className).toContain('text-red-500')
    expect(el.className).not.toContain('text-primary-500')
  })

  it('property: any non-empty custom className overrides the default color', () => {
    fc.assert(
      fc.property(
        // Generator: arbitrary Tailwind-like class strings (no whitespace)
        fc.stringMatching(/^text-[a-z]+-[0-9]+$/),
        (customClass) => {
          const { getByRole } = render(<Spinner className={customClass} />)
          const el = getByRole('status')
          const hasCustom = el.className.includes(customClass)
          const lacksDefault = !el.className.includes('text-primary-500')

          // Clean up DOM after each fast-check iteration
          cleanup()
          return hasCustom && lacksDefault
        }
      ),
      { numRuns: 50 }
    )
  })
})
