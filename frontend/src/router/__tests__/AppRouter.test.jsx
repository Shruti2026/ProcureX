import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppRouter from '../AppRouter'
import { AuthContext } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

function renderWithRole(role, initialPath) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  const mockUser = {
    userId: '1',
    email: 'admin@procurex.com',
    role,
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user: mockUser, token: 'fake-token', logout: () => {} }}>
        <MemoryRouter initialEntries={[initialPath]}>
          <AppRouter user={mockUser} onLogout={() => {}} />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  )
}

describe('AppRouter sidebar routes', () => {
  it('renders Audit Logs page on /admin/audit-logs without redirect loops', () => {
    renderWithRole(ROLES.ADMIN, '/admin/audit-logs')
    expect(screen.getByRole('heading', { level: 1, name: 'Audit Logs' })).toBeDefined()
    expect(screen.getByRole('heading', { level: 3, name: 'Audit Trail' })).toBeDefined()
  })

  it('renders Users page on /admin/users', () => {
    renderWithRole(ROLES.ADMIN, '/admin/users')
    expect(screen.getByRole('heading', { level: 1, name: 'Users' })).toBeDefined()
  })

  it('renders Health page on /admin/health', () => {
    renderWithRole(ROLES.ADMIN, '/admin/health')
    expect(screen.getByRole('heading', { level: 1, name: 'System Health' })).toBeDefined()
  })

  it('renders Requisitions page on /procurement/requisitions', () => {
    renderWithRole(ROLES.PROCUREMENT_MANAGER, '/procurement/requisitions')
    expect(screen.getByRole('heading', { level: 1, name: 'Purchase Requisitions' })).toBeDefined()
  })

  it('renders Notifications page on /notifications', () => {
    renderWithRole(ROLES.ADMIN, '/notifications')
    expect(screen.getByRole('heading', { level: 1, name: 'Notifications' })).toBeDefined()
  })
})
