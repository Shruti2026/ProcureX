import { useState, useRef, useEffect } from 'react'
import { Bell, ChevronDown, KeyRound, LogOut, User } from 'lucide-react'
import Badge from '../ui/Badge'
import { ROLE_LABELS } from '../../constants/roles'
import ChangePasswordModal from '../auth/ChangePasswordModal'

/**
 * Top navigation bar with user profile dropdown.
 * Displays user role, notification bell, Change Password modal, and Logout.
 */
export default function Navbar({ user, onLogout }) {
  const [dropdownOpen, setDropdownOpen]   = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const userRole = user?.role

  return (
    <>
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 z-30">
        {/* Logo */}
        <span className="text-xl font-bold text-primary-600 tracking-tight">
          ProcureX
        </span>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notification bell */}
          <button
            id="navbar-notifications-btn"
            aria-label="Notifications"
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell size={20} />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200" />

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="navbar-profile-btn"
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
            >
              {/* Avatar circle */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-semibold text-sm shrink-0">
                {user?.email?.charAt(0)?.toUpperCase() ?? <User size={16} />}
              </div>

              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-gray-800 font-medium">{user?.email ?? 'User'}</span>
                {userRole && (
                  <span className="text-xs text-gray-500">{ROLE_LABELS[userRole] ?? userRole}</span>
                )}
              </div>

              <ChevronDown
                size={16}
                className={`text-gray-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 py-1 z-50 animate-fade-in">
                {/* Role badge row */}
                {userRole && (
                  <div className="px-4 py-2 border-b border-gray-100">
                    <Badge status={userRole} label={ROLE_LABELS[userRole] ?? userRole} />
                  </div>
                )}

                {/* Change Password */}
                <button
                  id="navbar-change-password-btn"
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false)
                    setChangePasswordOpen(true)
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <KeyRound size={16} className="text-gray-500" />
                  Change Password
                </button>

                {/* Divider */}
                <div className="my-1 border-t border-gray-100" />

                {/* Logout */}
                <button
                  id="navbar-logout-btn"
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false)
                    onLogout()
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} className="text-red-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </>
  )
}
