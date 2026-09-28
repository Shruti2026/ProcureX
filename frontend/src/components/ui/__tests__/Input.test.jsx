/**
 * Property tests for Input component
 *
 * Property 4 — Input error state border invariant
 *   Validates: Requirements 6.3
 *
 * Property 5 — Input forwardRef contract
 *   Validates: Requirements 6.6
 */

import { createRef } from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Input from '../Input'

// ---------------------------------------------------------------------------
// Property 4: Input error state border invariant
//
// For any non-empty string passed as the `error` prop, the rendered <input>
// element's className should contain `border-red-300`.
// Validates: Requirements 6.3
// ---------------------------------------------------------------------------
describe('Property 4 — Input error state border invariant', () => {
  const errorStrings = [
    'This field is required',
    'Invalid email address',
    'Password must be at least 8 characters',
    'Value must be a number',
    'e', // single-character edge case
    '  whitespace  ', // whitespace-padded string
    'Error with <special> characters & symbols!',
    '1234567890', // numeric string
  ]

  it.each(errorStrings)(
    'renders border-red-300 on <input> when error="%s"',
    (errorMsg) => {
      const { container } = render(<Input label="Test" error={errorMsg} />)
      const inputEl = container.querySelector('input')

      expect(inputEl).not.toBeNull()
      expect(inputEl.className).toContain('border-red-300')
    }
  )

  it('does NOT apply border-red-300 when error prop is absent', () => {
    const { container } = render(<Input label="Test" />)
    const inputEl = container.querySelector('input')

    expect(inputEl).not.toBeNull()
    expect(inputEl.className).not.toContain('border-red-300')
  })

  it('does NOT apply border-red-300 when error prop is undefined', () => {
    const { container } = render(<Input label="Test" error={undefined} />)
    const inputEl = container.querySelector('input')

    expect(inputEl).not.toBeNull()
    expect(inputEl.className).not.toContain('border-red-300')
  })

  it('applies focus:ring-red-400 alongside border-red-300 for error state', () => {
    const { container } = render(<Input label="Test" error="Some error" />)
    const inputEl = container.querySelector('input')

    expect(inputEl.className).toContain('border-red-300')
    expect(inputEl.className).toContain('focus:ring-red-400')
  })
})

// ---------------------------------------------------------------------------
// Property 5 — Input forwardRef contract
//
// For any valid Input configuration, passing a React ref to the component
// should result in ref.current pointing to an HTMLInputElement after render.
// Validates: Requirements 6.6
// ---------------------------------------------------------------------------
describe('Property 5 — Input forwardRef contract', () => {
  it('ref.current is an HTMLInputElement with no props', () => {
    const ref = createRef()
    render(<Input ref={ref} />)

    expect(ref.current).not.toBeNull()
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('ref.current is an HTMLInputElement when label is provided', () => {
    const ref = createRef()
    render(<Input ref={ref} label="Email" />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('ref.current is an HTMLInputElement when error is provided', () => {
    const ref = createRef()
    render(<Input ref={ref} label="Password" error="Required" />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('ref.current is an HTMLInputElement for type="password"', () => {
    const ref = createRef()
    render(<Input ref={ref} label="Password" type="password" />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current.type).toBe('password')
  })

  it('ref.current is an HTMLInputElement for type="email"', () => {
    const ref = createRef()
    render(<Input ref={ref} label="Email" type="email" />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current.type).toBe('email')
  })

  it('ref.current is an HTMLInputElement when disabled', () => {
    const ref = createRef()
    render(<Input ref={ref} label="Field" disabled />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current.disabled).toBe(true)
  })

  it('ref.current is an HTMLInputElement with label, error, and type combined', () => {
    const ref = createRef()
    render(
      <Input
        ref={ref}
        label="Username"
        error="Username is taken"
        type="text"
        placeholder="Enter username"
      />
    )

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})
