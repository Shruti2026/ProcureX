import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

/**
 * Root layout for all authenticated pages.
 * Sidebar on left, Navbar on top, page content via <Outlet />.
 *
 * Props are passed down until AuthContext is wired in Day 2.
 */
export default function DashboardLayout({ user, onLogout }) {
  const userRole = user?.roles?.[0]

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar userRole={userRole} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar user={user} onLogout={onLogout} />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
