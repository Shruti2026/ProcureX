import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

// Pages are loaded via React.lazy, so assertions must be async
// (waitFor polls until the lazy chunk resolves and the heading appears).
describe('AppRouter sidebar routes', () => {
  it('renders Audit Logs page on /admin/audit-logs without redirect loops', async () => {
    renderWithRole(ROLES.ADMIN, '/admin/audit-logs')
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Audit Logs' })).toBeDefined()
    })
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'Audit Trail' })).toBeDefined()
    })
  })

  it('renders Users page on /admin/users', async () => {
    renderWithRole(ROLES.ADMIN, '/admin/users')
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Users' })).toBeDefined()
    })
  })

  it('renders Health page on /admin/health', async () => {
    renderWithRole(ROLES.ADMIN, '/admin/health')
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'System Health' })).toBeDefined()
    })
  })

  it('renders Requisitions page on /procurement/requisitions', async () => {
    renderWithRole(ROLES.PROCUREMENT_MANAGER, '/procurement/requisitions')
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Purchase Requisitions' })).toBeDefined()
    })
  })

  it('renders Notifications page on /notifications', async () => {
    renderWithRole(ROLES.ADMIN, '/notifications')
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Notifications' })).toBeDefined()
    })
  })
})
