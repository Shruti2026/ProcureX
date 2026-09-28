/**
 * Property-based tests for StatCard component
 *
 * Validates: Requirements 12.1, 12.3, 12.4, 12.5
 */
import { describe, it, expect } from 'vitest'
import { render, within } from '@testing-library/react'
import * as fc from 'fast-check'
import { Star } from 'lucide-react'
import StatCard from '../StatCard'

// ── Shared fixed props ────────────────────────────────────────────────────────
// Properties that test a single axis hold all other props constant so
// failures are unambiguous.
const FIXED_ICON       = Star
const FIXED_ICON_COLOR = 'text-blue-600'
const FIXED_ICON_BG    = 'bg-blue-50'
const FIXED_TITLE      = 'Total Items'
const FIXED_VALUE      = 42

// ── Arbitraries ───────────────────────────────────────────────────────────────
// Non-empty string with no spaces — safe as a single Tailwind class token.
// Uses fc.stringMatching to stay within the Tailwind-like pattern (word-number).
const tailwindClassArb = fc.stringMatching(/^[a-z]+-[a-z]+-[0-9]+$/)

// Non-empty string for title — must contain at least one visible (non-whitespace)
// character so getByText can locate the rendered element.
const nonEmptyStringArb = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)

// Value: either a non-empty string or a non-negative integer
const valueArb = fc.oneof(
  fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  fc.integer({ min: 0 })
)

// ── Property 12 — StatCard prop contract stability ────────────────────────────
// For any valid combination of title (non-empty string), value (string or
// number), iconColor (Tailwind class string), and iconBg (Tailwind class
// string), StatCard renders without throwing.
// The icon is fixed to a known lucide-react component (Star).
//
// Validates: Requirements 12.1
describe('Property 12 — StatCard prop contract stability', () => {
  it('renders without throwing for any valid prop combination', () => {
    fc.assert(
      fc.property(
        nonEmptyStringArb,  // title
        valueArb,           // value
        tailwindClassArb,   // iconColor
        tailwindClassArb,   // iconBg
        (title, value, iconColor, iconBg) => {
          expect(() => {
            render(
              <StatCard
                title={title}
                value={value}
                icon={FIXED_ICON}
                iconColor={iconColor}
                iconBg={iconBg}
              />
            )
          }).not.toThrow()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('renders without throwing when an optional trend prop is included', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('up', 'down'),
        nonEmptyStringArb, // trend label
        (direction, label) => {
          expect(() => {
            render(
              <StatCard
                title={FIXED_TITLE}
                value={FIXED_VALUE}
                icon={FIXED_ICON}
                iconColor={FIXED_ICON_COLOR}
                iconBg={FIXED_ICON_BG}
                trend={{ direction, label }}
              />
            )
          }).not.toThrow()
        }
      )
    )
  })

  it('renders without throwing when no trend prop is provided', () => {
    expect(() => {
      render(
        <StatCard
          title={FIXED_TITLE}
          value={FIXED_VALUE}
          icon={FIXED_ICON}
          iconColor={FIXED_ICON_COLOR}
          iconBg={FIXED_ICON_BG}
        />
      )
    }).not.toThrow()
  })
})

// ── Property 13 — StatCard icon container class passthrough ───────────────────
// For any iconBg and iconColor Tailwind class strings (non-empty, no spaces):
//   • the icon container div (`.rounded-lg`) must include `iconBg` in its className
//   • the icon element (svg) rendered inside the container must include `iconColor`
//     in its className (lucide-react forwards className to the svg element)
//
// Validates: Requirements 12.3
describe('Property 13 — StatCard icon container class passthrough', () => {
  it('applies iconBg to the icon container and iconColor to the icon element', () => {
    fc.assert(
      fc.property(
        tailwindClassArb, // iconBg  — e.g. "bg-blue-50"
        tailwindClassArb, // iconColor — e.g. "text-blue-600"
        (iconBg, iconColor) => {
          const { container } = render(
            <StatCard
              title={FIXED_TITLE}
              value={FIXED_VALUE}
              icon={FIXED_ICON}
              iconColor={iconColor}
              iconBg={iconBg}
            />
          )

          // The icon container is the div that carries rounded-lg
          const iconContainer = container.querySelector('.rounded-lg')
          expect(iconContainer).not.toBeNull()

          // iconBg must appear on the container div itself
          expect(iconContainer.className).toContain(iconBg)

          // iconColor is forwarded to the <Icon> svg child via className prop
          const iconSvg = iconContainer.querySelector('svg')
          expect(iconSvg).not.toBeNull()
          expect(iconSvg.className.baseVal).toContain(iconColor)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('places iconBg on the container and iconColor on the svg for a fixed example', () => {
    const { container } = render(
      <StatCard
        title={FIXED_TITLE}
        value={FIXED_VALUE}
        icon={FIXED_ICON}
        iconColor="text-violet-600"
        iconBg="bg-violet-50"
      />
    )
    const iconContainer = container.querySelector('.rounded-lg')
    expect(iconContainer.className).toContain('bg-violet-50')

    const iconSvg = iconContainer.querySelector('svg')
    expect(iconSvg.className.baseVal).toContain('text-violet-600')
  })
})

// ── Property 14 — StatCard text slot class invariant ─────────────────────────
// For any title string (non-empty, non-whitespace) and value (string or number):
//   • the element rendering `title` must have a className containing `text-gray-500`
//   • the element rendering `value` must have a className containing `text-2xl`,
//     `font-bold`, and `text-gray-900`
//
// Queries are scoped with `within(container)` to prevent cross-render
// accumulation (prior renders remain in the document; scoped queries ignore them).
//
// Validates: Requirements 12.4
describe('Property 14 — StatCard text slot class invariant', () => {
  it('renders title in an element with text-gray-500 class', () => {
    fc.assert(
      fc.property(
        nonEmptyStringArb, // title — non-empty, has visible chars
        valueArb,          // value
        (title, value) => {
          const { container } = render(
            <StatCard
              title={title}
              value={value}
              icon={FIXED_ICON}
              iconColor={FIXED_ICON_COLOR}
              iconBg={FIXED_ICON_BG}
            />
          )

          // Query by DOM structure: title is always the first <p> inside the card
          const paragraphs = container.querySelectorAll('p')
          const titleEl = paragraphs[0]
          expect(titleEl).not.toBeNull()
          expect(titleEl.className).toContain('text-gray-500')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('renders value in an element with text-2xl, font-bold, and text-gray-900 classes', () => {
    fc.assert(
      fc.property(
        nonEmptyStringArb,             // title
        fc.integer({ min: 0, max: 999999 }),
        (title, value) => {
          const { container } = render(
            <StatCard
              title={title}
              value={value}
              icon={FIXED_ICON}
              iconColor={FIXED_ICON_COLOR}
              iconBg={FIXED_ICON_BG}
            />
          )

          // Use getAllByText scoped to this container — take the first match
          // (the value paragraph is the second <p>; title and value cannot collide
          // because title is a string and value is an integer rendered as String())
          const scope = within(container)
          const [valueEl] = scope.getAllByText(String(value))
          expect(valueEl.className).toContain('text-2xl')
          expect(valueEl.className).toContain('font-bold')
          expect(valueEl.className).toContain('text-gray-900')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('title element has text-gray-500 for a fixed example', () => {
    const { container } = render(
      <StatCard
        title="Open Requisitions"
        value={12}
        icon={FIXED_ICON}
        iconColor={FIXED_ICON_COLOR}
        iconBg={FIXED_ICON_BG}
      />
    )
    expect(within(container).getByText('Open Requisitions').className).toContain('text-gray-500')
  })

  it('value element has text-2xl font-bold text-gray-900 for a fixed example', () => {
    const { container } = render(
      <StatCard
        title="Open Requisitions"
        value={12}
        icon={FIXED_ICON}
        iconColor={FIXED_ICON_COLOR}
        iconBg={FIXED_ICON_BG}
      />
    )
    const valueEl = within(container).getByText('12')
    expect(valueEl.className).toContain('text-2xl')
    expect(valueEl.className).toContain('font-bold')
    expect(valueEl.className).toContain('text-gray-900')
  })
})

// ── Property 15 — StatCard trend indicator directional correctness ─────────────
// For trend.direction === 'up':
//   • a TrendingUp icon is rendered (identified by its SVG title / aria-label, or
//     by querying the svg element inside the trend wrapper)
//   • the trend wrapper className contains `text-green-500`
//
// For trend.direction === 'down':
//   • a TrendingDown icon is rendered
//   • the trend wrapper className contains `text-red-500`
//
// Validates: Requirements 12.5
describe('Property 15 — StatCard trend indicator directional correctness', () => {
  // Helper: find the trend container (the div wrapping the trending icon + label)
  // It is identifiable as the div that contains the label text for the trend.
  function getTrendContainer(container, label) {
    // The trend section is the closest ancestor div of the label element
    const labelEl = Array.from(container.querySelectorAll('span')).find(
      el => el.textContent === label
    )
    return labelEl ? labelEl.parentElement : null
  }

  it('shows text-green-500 trend wrapper for direction: up (property)', () => {
    fc.assert(
      fc.property(
        nonEmptyStringArb, // trend label
        (label) => {
          const { container } = render(
            <StatCard
              title={FIXED_TITLE}
              value={FIXED_VALUE}
              icon={FIXED_ICON}
              iconColor={FIXED_ICON_COLOR}
              iconBg={FIXED_ICON_BG}
              trend={{ direction: 'up', label }}
            />
          )

          const trendContainer = getTrendContainer(container, label)
          expect(trendContainer).not.toBeNull()
          expect(trendContainer.className).toContain('text-green-500')
          // Must NOT be the red color
          expect(trendContainer.className).not.toContain('text-red-500')
        }
      ),
      { numRuns: 50 }
    )
  })

  it('shows text-red-500 trend wrapper for direction: down (property)', () => {
    fc.assert(
      fc.property(
        nonEmptyStringArb, // trend label
        (label) => {
          const { container } = render(
            <StatCard
              title={FIXED_TITLE}
              value={FIXED_VALUE}
              icon={FIXED_ICON}
              iconColor={FIXED_ICON_COLOR}
              iconBg={FIXED_ICON_BG}
              trend={{ direction: 'down', label }}
            />
          )

          const trendContainer = getTrendContainer(container, label)
          expect(trendContainer).not.toBeNull()
          expect(trendContainer.className).toContain('text-red-500')
          // Must NOT be the green color
          expect(trendContainer.className).not.toContain('text-green-500')
        }
      ),
      { numRuns: 50 }
    )
  })

  it('renders an svg icon inside the trend wrapper for direction: up', () => {
    const { container } = render(
      <StatCard
        title={FIXED_TITLE}
        value={FIXED_VALUE}
        icon={FIXED_ICON}
        iconColor={FIXED_ICON_COLOR}
        iconBg={FIXED_ICON_BG}
        trend={{ direction: 'up', label: '+5% this week' }}
      />
    )
    const trendContainer = getTrendContainer(container, '+5% this week')
    // An SVG icon (TrendingUp) must exist inside the trend wrapper
    const svg = trendContainer.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(trendContainer.className).toContain('text-green-500')
  })

  it('renders an svg icon inside the trend wrapper for direction: down', () => {
    const { container } = render(
      <StatCard
        title={FIXED_TITLE}
        value={FIXED_VALUE}
        icon={FIXED_ICON}
        iconColor={FIXED_ICON_COLOR}
        iconBg={FIXED_ICON_BG}
        trend={{ direction: 'down', label: '-3% this week' }}
      />
    )
    const trendContainer = getTrendContainer(container, '-3% this week')
    const svg = trendContainer.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(trendContainer.className).toContain('text-red-500')
  })

  it('renders no trend section when trend prop is omitted', () => {
    const { container } = render(
      <StatCard
        title={FIXED_TITLE}
        value={FIXED_VALUE}
        icon={FIXED_ICON}
        iconColor={FIXED_ICON_COLOR}
        iconBg={FIXED_ICON_BG}
      />
    )
    // No element with text-green-500 or text-red-500 trend class should exist
    const greenTrend = container.querySelector('.text-green-500')
    const redTrend   = container.querySelector('.text-red-500')
    expect(greenTrend).toBeNull()
    expect(redTrend).toBeNull()
  })
})
