import { Bell } from 'lucide-react'
import Badge from '../ui/Badge'
import { ROLE_LABELS } from '../../constants/roles'

/**
 * Top navigation bar.
 * Reads user from AuthContext — stubbed with null-safe checks until
 * AuthContext is wired in Day 2.
 */
export default function Navbar({ user, onLogout }) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
      {/* Logo */}
      <span className="text-xl font-bold text-primary-600 tracking-tight">
        ProcureX
      </span>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button
          aria-label="Notifications"
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Bell size={20} />
          {/* Unread badge — wired in Day 8 */}
          {/* <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" /> */}
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200" />

        {/* User info */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 font-medium">
            {user?.fullName ?? 'User'}
          </span>
          {user?.roles?.[0] && (
            <Badge status={user.roles[0]} label={ROLE_LABELS[user.roles[0]]} />
          )}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
