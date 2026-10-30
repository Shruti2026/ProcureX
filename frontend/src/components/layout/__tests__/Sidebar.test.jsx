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
// The redesigned Sidebar uses a dark purple gradient background.
// Active links use bg-white/10 and text-white (not the old bg-primary-50 / text-primary-700).
// Inactive links use text-white/70.
//
// Validates: Requirements 2.4
describe('Property 1 — Active navigation link styling invariant', () => {
  // ── Concrete test 1: Admin role — active Dashboard link ──────────────────
  it('Admin role: active Dashboard link has bg-white/10 and text-white', () => {
    const { container } = renderSidebar(ROLES.ADMIN, '/admin/dashboard')
    const link = container.querySelector('a[href="/admin/dashboard"]')

    expect(link).not.toBeNull()
    expect(link.className).toContain('bg-white/10')
    expect(link.className).toContain('text-white')
  })

  // ── Concrete test 2: Procurement role — active Requisitions link ─────────
  it('Procurement role: active Requisitions link has bg-white/10 and text-white', () => {
    const { container } = renderSidebar(
      ROLES.PROCUREMENT_MANAGER,
      '/procurement/requisitions'
    )
    const link = container.querySelector('a[href="/procurement/requisitions"]')

    expect(link).not.toBeNull()
    expect(link.className).toContain('bg-white/10')
    expect(link.className).toContain('text-white')
  })

  // ── Concrete test 3: Inactive siblings do NOT receive active styles ───────
  it('Admin role: inactive sibling links do NOT have bg-white/10', () => {
    const { container } = renderSidebar(ROLES.ADMIN, '/admin/dashboard')

    const allLinks = Array.from(container.querySelectorAll('a'))
    const inactiveLinks = allLinks.filter(
      (a) => a.getAttribute('href') !== '/admin/dashboard'
    )

    expect(inactiveLinks.length).toBeGreaterThan(0)
    for (const link of inactiveLinks) {
      expect(link.className).not.toContain('bg-white/10')
    }
  })

  // ── Property test: active link classes hold across all roles × all paths ──
  it('active link always has bg-white/10 and text-white across all roles and paths', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_ROLE_PATH_PAIRS),
        ([role, activePath]) => {
          const { container } = renderSidebar(role, activePath)
          const link = container.querySelector(`a[href="${activePath}"]`)

          expect(link).not.toBeNull()
          expect(link.className).toContain('bg-white/10')
          expect(link.className).toContain('text-white')
        }
      ),
      { numRuns: 50 }
    )
  })

  // ── Property test: inactive siblings never carry active classes ───────────
  it('inactive sibling links never have bg-white/10 for any role × active path combination', () => {
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
            expect(link.className).not.toContain('bg-white/10')
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  // ── Collapsible behavior tests ─────────────────────────────────────────────
  it('renders collapsed state with w-16 and expand button', () => {
    const { container, getByRole } = render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Sidebar userRole={ROLES.ADMIN} collapsed={true} onToggle={() => {}} />
      </MemoryRouter>
    )

    const aside = container.querySelector('aside')
    expect(aside.className).toContain('w-16')
    // The expand button (Menu icon) should be present in the header
    expect(getByRole('button', { name: /expand sidebar/i })).toBeDefined()
  })

  it('renders expanded state with w-60 and full brand title', () => {
    const { container, getByText } = render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Sidebar userRole={ROLES.ADMIN} collapsed={false} onToggle={() => {}} />
      </MemoryRouter>
    )

    const aside = container.querySelector('aside')
    expect(aside.className).toContain('w-60')
    expect(getByText('ProcureX')).toBeDefined()
  })
})
