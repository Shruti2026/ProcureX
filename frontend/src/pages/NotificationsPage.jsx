import { useState, useEffect } from 'react'
import { Bell, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import Table from '../components/ui/Table'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Pagination from '../components/ui/Pagination'
import { formatDateTime } from '../utils/formatters'
import { notificationService } from '../services/notificationService'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const COLUMNS = ['Title', 'Message', 'Channel', 'Status', 'Date']

// ---------------------------------------------------------------------------
// Preferences Modal
// ---------------------------------------------------------------------------
function PreferencesModal({ onClose }) {
  const [prefs, setPrefs] = useState({ emailEnabled: true, inAppEnabled: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    notificationService.getPreferences()
      .then(res => {
        const data = res.data?.data
        if (data) {
          setPrefs({ emailEnabled: data.emailEnabled, inAppEnabled: data.inAppEnabled })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await notificationService.updatePreferences(prefs)
      toast.success('Preferences saved')
      onClose()
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#1A1035] dark:border dark:border-white/10 rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h2>
        {loading ? (
          <p className="text-sm text-gray-400 dark:text-white/40 py-4">Loading...</p>
        ) : (
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-white/80">Email Notifications</span>
              <button
                type="button"
                onClick={() => setPrefs(p => ({ ...p, emailEnabled: !p.emailEnabled }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${prefs.emailEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-white/10'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${prefs.emailEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-white/80">In-App Notifications</span>
              <button
                type="button"
                onClick={() => setPrefs(p => ({ ...p, inAppEnabled: !p.inAppEnabled }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${prefs.inAppEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-white/10'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${prefs.inAppEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </label>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showPrefs, setShowPrefs] = useState(false)

  useEffect(() => { loadNotifications() }, [page])
  useEffect(() => { loadUnreadCount() }, [])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const res = await notificationService.getMyNotifications({ page, size: 20 })
      const data = res.data?.data
      setNotifications(data?.content ?? [])
      setTotalPages(data?.totalPages ?? 0)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const res = await notificationService.getUnreadCount()
      setUnreadCount(res.data?.data ?? 0)
    } catch {
      // silent
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
              Stay updated on approvals, status changes, and alerts.
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 ring-1 ring-inset ring-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:ring-primary-500/30">
              {unreadCount} unread
            </span>
          )}
        </div>
        <Button variant="secondary" onClick={() => setShowPrefs(true)}>
          <Settings size={14} /> Preferences
        </Button>
      </div>

      <Table
        columns={COLUMNS}
        loading={loading}
        empty={!loading && notifications.length === 0}
        emptyMessage="No notifications yet."
      >
        {notifications.map((n, i) => (
          <tr
            key={n.notificationId}
            className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-100 animate-fade-slide-up"
            style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
          >
            <Table.Td className="font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{n.title}</Table.Td>
            <Table.Td className="max-w-[280px] truncate text-gray-500 dark:text-white/60">{n.message}</Table.Td>
            <Table.Td><Badge status={n.channel} label={n.channel} /></Table.Td>
            <Table.Td><Badge status={n.status} /></Table.Td>
            <Table.Td className="text-gray-400 dark:text-white/40">{formatDateTime(n.createdAt)}</Table.Td>
          </tr>
        ))}
      </Table>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />
      )}

      {showPrefs && <PreferencesModal onClose={() => setShowPrefs(false)} />}
    </div>
  )
}
