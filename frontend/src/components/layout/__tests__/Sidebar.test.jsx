/**
 * Property-based tests for Sidebar component
 *
 * Validates: Requirements 2.4
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as fc from 'fast-check'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '../Sidebar'
import { ROLES } from '../../../constants/roles'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Nav link paths keyed by role — mirrors the NAV_LINKS map in Sidebar.jsx.
 * Kept in sync manually; does not import private internals from Sidebar.
 */
const NAV_PATHS = {
  [ROLES.ADMIN]: [
    '/admin/dashboard',
    '/admin/users',
    '/admin/audit-logs',
    '/admin/health',
  ],
  [ROLES.PROCUREMENT_MANAGER]: [
    '/procurement/dashboard',
    '/procurement/requisitions',
    '/procurement/rfqs',
    '/procurement/orders',
    '/procurement/analytics',
  ],
  [ROLES.INVENTORY_MANAGER]: [
    '/inventory/dashboard',
    '/inventory/stock',
    '/inventory/warehouses',
    '/inventory/grns',
    '/inventory/transactions',
  ],
  [ROLES.FINANCE_MANAGER]: [
    '/finance/dashboard',
    '/finance/invoices',
    '/finance/budgets',
    '/finance/payments',
  ],
  [ROLES.VENDOR]: [
    '/vendor/dashboard',
    '/vendor/rfqs',
    '/vendor/quotations',
    '/vendor/orders',
    '/vendor/invoices',
    '/notifications',
  ],
}

/** All (role, activePath) pairs flattened — used as the fast-check sample space. */
const ALL_ROLE_PATH_PAIRS = Object.entries(NAV_PATHS).flatMap(
  ([role, paths]) => paths.map((path) => [role, path])
)

/** Render Sidebar with the router pointing at `activePath`. */
function renderSidebar(role, activePath) {
  return render(
    <MemoryRouter initialEntries={[activePath]}>
      <Sidebar userRole={role} />
    </MemoryRouter>
  )
}

// ── Property 1 — Active navigation link styling invariant ─────────────────────
// For any nav link rendered in the Sidebar with a matching URL (making it
// active), the rendered <a> element's className MUST contain `bg-primary-50`
// AND `text-primary-700`.
//
// Validates: Requirements 2.4
describe('Property 1 — Active navigation link styling invariant', () => {
  // ── Concrete test 1: Admin role — active Dashboard link ──────────────────
  it('Admin role: active Dashboard link has bg-primary-50 and text-primary-700', () => {
    const { container } = renderSidebar(ROLES.ADMIN, '/admin/dashboard')
    const link = container.querySelector('a[href="/admin/dashboard"]')

    expect(link).not.toBeNull()
    expect(link.className).toContain('bg-primary-50')
    expect(link.className).toContain('text-primary-700')
  })

  // ── Concrete test 2: Procurement role — active Requisitions link ─────────
  it('Procurement role: active Requisitions link has bg-primary-50 and text-primary-700', () => {
    const { container } = renderSidebar(
      ROLES.PROCUREMENT_MANAGER,
      '/procurement/requisitions'
    )
    const link = container.querySelector('a[href="/procurement/requisitions"]')

    expect(link).not.toBeNull()
    expect(link.className).toContain('bg-primary-50')
    expect(link.className).toContain('text-primary-700')
  })

  // ── Concrete test 3: Inactive siblings do NOT receive active styles ───────
  it('Admin role: inactive sibling links do NOT have bg-primary-50', () => {
    const { container } = renderSidebar(ROLES.ADMIN, '/admin/dashboard')

    const allLinks = Array.from(container.querySelectorAll('a'))
    const inactiveLinks = allLinks.filter(
      (a) => a.getAttribute('href') !== '/admin/dashboard'
    )

    expect(inactiveLinks.length).toBeGreaterThan(0)
    for (const link of inactiveLinks) {
      expect(link.className).not.toContain('bg-primary-50')
      expect(link.className).not.toContain('text-primary-700')
    }
  })

  // ── Property test: active link classes hold across all roles × all paths ──
  // Uses a single flat fc.property over ALL_ROLE_PATH_PAIRS to avoid the
  // performance cost of nested fc.assert calls.
  it('active link always has bg-primary-50 and text-primary-700 across all roles and paths', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_ROLE_PATH_PAIRS),
        ([role, activePath]) => {
          const { container } = renderSidebar(role, activePath)
          const link = container.querySelector(`a[href="${activePath}"]`)

          expect(link).not.toBeNull()
          expect(link.className).toContain('bg-primary-50')
          expect(link.className).toContain('text-primary-700')
        }
      ),
      { numRuns: 50 }
    )
  })

  // ── Property test: inactive siblings never carry active classes ───────────
  it('inactive sibling links never have bg-primary-50 for any role × active path combination', () => {
    // Only test roles that have more than one path (otherwise no inactive siblings)
    const pairsWithSiblings = ALL_ROLE_PATH_PAIRS.filter(([role]) => {
      return NAV_PATHS[role].length > 1
    })

    fc.assert(
      fc.property(
        fc.constantFrom(...pairsWithSiblings),
        ([role, activePath]) => {
          const { container } = renderSidebar(role, activePath)
          const inactiveLinks = Array.from(
            container.querySelectorAll('a')
          ).filter((a) => a.getAttribute('href') !== activePath)

          for (const link of inactiveLinks) {
            expect(link.className).not.toContain('bg-primary-50')
            expect(link.className).not.toContain('text-primary-700')
          }
        }
      ),
      { numRuns: 50 }
    )
  })
})
