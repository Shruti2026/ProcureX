import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import PageTransition from './PageTransition'
import { useAuth } from '../../context/AuthContext'

/**
 * Root layout for all authenticated pages.
 * Reads user directly from AuthContext so Navbar always has the latest state.
 * Sidebar on left, Navbar on top, page content via <Outlet />.
 */
export default function DashboardLayout({ onLogout }) {
  const { user } = useAuth()
  const userRole = user?.role
  const location = useLocation()

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
    <div className="flex h-screen bg-primary-50 dark:bg-gradient-to-br dark:from-[#0F0A1E] dark:via-[#1E1B4B] dark:to-[#2D1B69]">
      <Sidebar
        userRole={userRole}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden min-h-0">
        <Navbar
          user={user}
          onLogout={onLogout}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-primary-50 dark:bg-transparent">
          <PageTransition locationKey={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  )
}
