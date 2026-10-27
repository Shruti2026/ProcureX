import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, KeyRound, LogOut, Moon, Sun, User } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useTheme } from '../../context/ThemeContext'
import { ROLE_LABELS } from '../../constants/roles'
import Badge from '../ui/Badge'
import ChangePasswordModal from '../auth/ChangePasswordModal'
import { notificationService } from '../../services/notificationService'

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [dropdownOpen, setDropdownOpen]   = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const fetchUnreadCount = () => {
      notificationService.getUnreadCount()
        .then(res => setUnreadCount(res.data?.data ?? 0))
        .catch(() => {})
    }
    fetchUnreadCount()
    const intervalId = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(intervalId)
  }, [])

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
  const roleLabel = userRole ? (ROLE_LABELS[userRole] ?? userRole) : null

  return (
    <>
      <nav className="h-16 bg-white border-b border-primary-100 px-6 flex items-center justify-end shrink-0 z-30 dark:bg-[#1A1035]/90 dark:backdrop-blur-sm dark:border-white/10">
        <div className="flex items-center gap-4">
          {/* Theme toggle */}
          <button
            type="button"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
            className="relative p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors duration-150 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.span
                  key="sun"
                  initial={{opacity: 0, scale: 0.7}}
                  animate={{opacity: 1, scale: 1}}
                  exit={{opacity: 0, scale: 0.7}}
                  transition={{duration: 0.15, ease: [0.23, 1, 0.32, 1]}}
                  style={{display: 'flex'}}
                >
                  <Sun size={20} />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{opacity: 0, scale: 0.7}}
                  animate={{opacity: 1, scale: 1}}
                  exit={{opacity: 0, scale: 0.7}}
                  transition={{duration: 0.15, ease: [0.23, 1, 0.32, 1]}}
                  style={{display: 'flex'}}
                >
                  <Moon size={20} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Notification bell */}
          <button
            id="navbar-notifications-btn"
            aria-label="Notifications"
            onClick={() => navigate('/notifications')}
            className="relative p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors duration-150 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-primary-100 dark:bg-white/10" />

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="navbar-profile-btn"
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-primary-50 transition-colors duration-150 dark:hover:bg-white/10"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm shrink-0 dark:bg-white/10 dark:text-white">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : (roleLabel ? roleLabel.charAt(0).toUpperCase() : <User size={16} />)}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-gray-800 font-medium dark:text-white">{user?.fullName ?? roleLabel ?? 'User'}</span>
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-500 transition-transform duration-200 dark:text-white/50 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Animated dropdown panel */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, transform: 'translateY(-8px) scale(0.97)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
                  exit={{ opacity: 0, transform: 'translateY(-8px) scale(0.97)' }}
                  transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute right-0 mt-2 w-52 rounded-xl border border-primary-100 bg-white shadow-lg shadow-primary-900/10 ring-1 ring-black/5 py-1 z-50 dark:bg-[#1A1035] dark:border-white/10 dark:shadow-black/30"
                >
                  {/* Badge */}
                  {userRole && (
                    <div className="px-4 pt-3 pb-2">
                      <Badge status={userRole} label={ROLE_LABELS[userRole] ?? userRole} />
                    </div>
                  )}
                  {/* User identity header */}
                  <div className="px-4 pb-3 border-b border-gray-100 dark:border-white/10 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm shrink-0 dark:bg-white/10 dark:text-white">
                      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : (roleLabel ? roleLabel.charAt(0).toUpperCase() : <User size={16} />)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                        {user?.fullName ?? roleLabel ?? 'User'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-white/50 truncate">
                        {user?.email ?? ''}
                      </span>
                    </div>
                  </div>
                  <button
                    id="navbar-change-password-btn"
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false)
                      setChangePasswordOpen(true)
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 transition-colors duration-150 dark:text-white/80 dark:hover:bg-white/10"
                  >
                    <KeyRound size={16} className="text-gray-500 dark:text-white/50" />
                    Change Password
                  </button>
                  <div className="my-1 border-t border-gray-100 dark:border-white/10" />
                  <button
                    id="navbar-logout-btn"
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false)
                      onLogout()
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <LogOut size={16} className="text-red-500 dark:text-red-400" />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </>
  )
}
