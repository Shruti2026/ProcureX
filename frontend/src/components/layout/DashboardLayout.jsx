import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'

/**
 * Root layout for all authenticated pages.
 * Reads user directly from AuthContext so Navbar always has the latest state.
 * Sidebar on left, Navbar on top, page content via <Outlet />.
 */
export default function DashboardLayout({ onLogout }) {
  const { user } = useAuth()
  const userRole = user?.role

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('sidebar_collapsed', String(sidebarCollapsed))
    } catch {
      // ignore
    }
  }, [sidebarCollapsed])

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-subtle)]">
      <Sidebar
        userRole={userRole}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar
          user={user}
          onLogout={onLogout}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-[var(--color-surface-subtle)]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
