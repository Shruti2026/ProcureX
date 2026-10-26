import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { Plus, X, Check, Copy, ChevronDown, Trash2 } from 'lucide-react'

import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Table from '../../components/ui/Table'
import api from '../../services/api'
import adminService from '../../services/adminService'
import { useAuth } from '../../context/AuthContext'

/* ─────────────────────────────────────────
   All 6 account statuses from the backend enum
───────────────────────────────────────── */
const ALL_STATUSES = [
  { value: 'ACTIVE',    label: 'Active' },
  { value: 'INACTIVE',  label: 'Inactive' },
  { value: 'LOCKED',    label: 'Locked' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'PENDING',   label: 'Pending' },
  { value: 'REJECTED',  label: 'Rejected' },
]

/* ─────────────────────────────────────────
   StatusSelect — native <select> that always
   renders its popup above overflow:hidden containers.
───────────────────────────────────────── */
function StatusSelect({ user, onChangeStatus, loading }) {
  const handleChange = (e) => {
    const newStatus = e.target.value
    // reset the select back to placeholder so the same value can re-trigger
    e.target.value = ''
    if (newStatus) onChangeStatus(user, newStatus)
  }

  return (
    <div className="relative inline-block">
      <select
        defaultValue=""
        onChange={handleChange}
        disabled={loading}
        className="
          appearance-none cursor-pointer
          rounded-lg border border-gray-200 bg-white
          pl-3 pr-7 py-1.5
          text-xs font-medium text-gray-700
          shadow-sm transition-colors
          hover:bg-gray-50
          focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
          disabled:cursor-not-allowed disabled:opacity-50
          dark:bg-[#1A1035] dark:border-white/10 dark:text-white dark:hover:bg-white/10
        "
        aria-label="Change account status"
      >
        <option value="" disabled>Change Status</option>
        {ALL_STATUSES.filter((s) => s.value !== user.status).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {/* custom chevron */}
      {loading ? (
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-white/20 dark:border-t-white/60" />
        </span>
      ) : (
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400 dark:text-white/40">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5l3 3 3-3" />
          </svg>
        </span>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   Yup schema — Create Manager form
───────────────────────────────────────── */
const createUserSchema = yup.object({
  fullName: yup.string().trim().required('Full name is required'),
  email: yup
    .string()
    .trim()
    .required('Email is required')
    .email('Enter a valid email address'),
  role: yup
    .string()
    .required('Role is required')
    .oneOf(
      ['PROCUREMENT_MANAGER', 'INVENTORY_MANAGER', 'FINANCE_MANAGER'],
      'Select a valid role'
    ),
})

const ROLE_OPTIONS = [
  { value: 'PROCUREMENT_MANAGER', label: 'Procurement Manager' },
  { value: 'INVENTORY_MANAGER',   label: 'Inventory Manager' },
  { value: 'FINANCE_MANAGER',     label: 'Finance Manager' },
]

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ─────────────────────────────────────────
   Helper: normalize user object from backend
───────────────────────────────────────── */
const normalizeUser = (u) => ({
  id: u.userId ?? u.id,
  fullName: u.fullName ?? '—',
  email: u.email ?? '—',
  role: u.role,
  status: u.accountStatus ?? u.status ?? 'ACTIVE',
  createdAt: u.createdAt ?? null,
})

/* ─────────────────────────────────────────
   CreateUserModal
───────────────────────────────────────── */
function CreateUserModal({ isOpen, onClose, onCreated }) {
  const { user: currentUser } = useAuth()
  const [createdCredentials, setCreatedCredentials] = useState(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(createUserSchema),
    defaultValues: { fullName: '', email: '', role: '' },
  })

  useEffect(() => {
    if (isOpen) {
      reset({ fullName: '', email: '', role: '' })
      setCreatedCredentials(null)
      setCopied(false)
    }
  }, [isOpen, reset])

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        organizationId: currentUser?.organizationId || '20e3006c-86ad-11f1-aa2e-462403e66e86',
      }
      const res = await api.post('/api/v1/admin/users', payload)
      const tempPass = res?.data?.data?.temporaryPassword
      if (tempPass) {
        setCreatedCredentials({
          fullName: data.fullName,
          email: data.email,
          tempPass,
        })
      } else {
        toast.success('Manager created successfully.')
        onClose()
      }
      onCreated()
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to create manager.'
      toast.error(msg)
    }
  }

  const handleCopyPassword = () => {
    if (createdCredentials?.tempPass) {
      navigator.clipboard.writeText(createdCredentials.tempPass)
      setCopied(true)
      toast.success('Temporary password copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 dark:bg-[#1A1035] dark:border dark:border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <h2 id="create-user-modal-title" className="text-base font-semibold text-gray-900 dark:text-white">
            {createdCredentials ? 'Manager Credentials' : 'Create Manager'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdCredentials ? (
          <div className="px-6 py-6 space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 dark:bg-green-900/20 dark:border-green-500/30">
              <p className="text-sm font-medium text-green-900 dark:text-green-400">
                Manager account created successfully.
              </p>
              <p className="mt-1 text-xs text-green-700 dark:text-green-400/80">
                Please securely share these login credentials with {createdCredentials.fullName}.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 dark:text-white/80 uppercase tracking-wider">
                Email
              </div>
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-800 font-mono dark:bg-white/5 dark:text-white/80">
                {createdCredentials.email}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 dark:text-white/80 uppercase tracking-wider">
                Temporary Password
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm font-mono text-gray-900 border border-gray-200 dark:bg-white/5 dark:text-white dark:border-white/10">
                <span>{createdCredentials.tempPass}</span>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-sans ml-2 font-medium"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="px-6 py-5 space-y-4">
              <Input
                label="Full Name"
                id="user-full-name"
                placeholder="e.g. Jane Smith"
                error={errors.fullName?.message}
                {...register('fullName')}
              />
              <Input
                label="Email"
                id="user-email"
                type="email"
                placeholder="e.g. jane@company.com"
                error={errors.email?.message}
                {...register('email')}
              />

              {/* Role select */}
              <div className="flex flex-col gap-1">
                <label htmlFor="user-role" className="text-sm font-medium text-gray-700 dark:text-white/80">
                  Role
                </label>
                <select
                  id="user-role"
                  aria-invalid={!!errors.role}
                  aria-describedby={errors.role ? 'user-role-error' : undefined}
                  className={[
                    'w-full rounded-lg border px-3 py-2 text-sm text-gray-900',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    'disabled:bg-gray-50 dark:disabled:bg-white/5 disabled:cursor-not-allowed',
                    'dark:bg-[#1A1035] dark:border-white/10 dark:text-white',
                    errors.role ? 'border-red-300 dark:border-red-500/50 focus:ring-red-400' : 'border-gray-200',
                  ].join(' ')}
                  {...register('role')}
                >
                  <option value="">Select a role</option>
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p id="user-role-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
                    {errors.role.message}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/10">
              <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Create Manager
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   RejectReasonModal — inline reason prompt
───────────────────────────────────────── */
function RejectReasonModal({ isOpen, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy]     = useState(false)

  useEffect(() => {
    if (isOpen) setReason('')
  }, [isOpen])

  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a rejection reason.')
      return
    }
    setBusy(true)
    await onConfirm(reason.trim())
    setBusy(false)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 dark:bg-[#1A1035] dark:border dark:border-white/10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <h2 id="reject-modal-title" className="text-base font-semibold text-gray-900 dark:text-white">
            Reject Vendor
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <label htmlFor="reject-reason" className="text-sm font-medium text-gray-700 dark:text-white/80 block">
            Rejection Reason
          </label>
          <textarea
            id="reject-reason"
            rows={3}
            placeholder="Provide a reason for rejection..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-white/30"
          />
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/10">
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" type="button" loading={busy} onClick={handleConfirm}>
            Reject
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   ConfirmDeleteModal — confirm before deleting a user
───────────────────────────────────────── */
function ConfirmDeleteModal({ isOpen, onClose, onConfirm, userName, loading }) {
  if (!isOpen) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 dark:bg-[#1A1035] dark:border dark:border-white/10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <h2 id="delete-modal-title" className="text-base font-semibold text-gray-900 dark:text-white">
            Delete User
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 dark:text-white/60">
            Are you sure you want to delete{' '}
            <span className="font-medium text-gray-900 dark:text-white">{userName}</span>? This will deactivate
            their account and revoke all active sessions. This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/10">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" type="button" loading={loading} onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   CollapsibleSection — animated accordion wrapper
───────────────────────────────────────── */
function CollapsibleSection({ id, title, description, count, defaultOpen = true, headerRight, children }) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyRef = useRef(null)

  /* Animate height on open/close */
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    if (open) {
      el.style.height = el.scrollHeight + 'px'
      const onEnd = () => { el.style.height = 'auto' }
      el.addEventListener('transitionend', onEnd, { once: true })
    } else {
      // pin current height first so the transition has a starting point
      el.style.height = el.scrollHeight + 'px'
      // force reflow, then collapse
      el.getBoundingClientRect()
      el.style.height = '0px'
    }
  }, [open])

  return (
    <section aria-labelledby={`${id}-title`}>
      {/* ── Section header (always visible) ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`${id}-body`}
        className="w-full flex items-center justify-between mb-4 group focus:outline-none"
      >
        <div className="flex items-start gap-3">
          {/* Animated chevron */}
          <span
            className="mt-0.5 flex-shrink-0 text-gray-400 dark:text-white/40 transition-transform duration-200 ease-out group-hover:text-gray-600 dark:group-hover:text-white/70"
            style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            aria-hidden="true"
          >
            <ChevronDown className="w-4 h-4" />
          </span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h2 id={`${id}-title`} className="text-base font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
              {/* Count pill */}
              {count != null && (
                <span className="inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-white/60 leading-none">
                  {count}
                </span>
              )}
            </div>
            {description && (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-white/60">{description}</p>
            )}
          </div>
        </div>
        {/* Slot for extra controls (e.g. Create Manager button) */}
        {headerRight && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0"
          >
            {headerRight}
          </div>
        )}
      </button>

      {/* ── Collapsible body ── */}
      <div
        id={`${id}-body`}
        ref={bodyRef}
        style={{
          height: defaultOpen ? 'auto' : '0px',
          overflow: 'hidden',
          transition: reducedMotion ? 'none' : 'height 220ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────
   UsersPage
───────────────────────────────────────── */
export default function UsersPage() {
  /* ── Managers state ── */
  const [managers, setManagers]               = useState([])
  const [managersLoading, setManagersLoading] = useState(true)
  const [managersError, setManagersError]     = useState(null)

  /* ── All Vendors state ── */
  const [vendors, setVendors]                 = useState([])
  const [vendorsLoading, setVendorsLoading]   = useState(true)
  const [vendorsError, setVendorsError]       = useState(null)

  /* ── Pending Vendors state ── */
  const [pendingVendors, setPendingVendors]               = useState([])
  const [pendingVendorsLoading, setPendingVendorsLoading] = useState(true)
  const [pendingVendorsError, setPendingVendorsError]     = useState(null)

  /* ── UI state ── */
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [changingStatusId, setChangingStatusId] = useState(null) // user id whose status is being changed
  const [approvingId, setApprovingId]           = useState(null) // vendor id being approved
  const [rejectModal, setRejectModal]           = useState({ open: false, vendorId: null, vendorName: '' })
  const [deleteModal, setDeleteModal]           = useState({ open: false, userId: null, userName: '' })
  const [deletingId, setDeletingId]             = useState(null)

  /* ─────────────────────────────────────
     Load managers (/api/v1/admin/users/employees)
  ───────────────────────────────────── */
  const fetchManagers = async () => {
    setManagersLoading(true)
    setManagersError(null)
    try {
      const res = await api.get('/api/v1/admin/users/employees')
      const payload = res.data?.data
      const list = Array.isArray(payload) ? payload : (payload?.content ?? [])
      setManagers(list.map(normalizeUser))
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to load internal managers.'
      setManagersError(msg)
    } finally {
      setManagersLoading(false)
    }
  }

  /* ─────────────────────────────────────
     Load all registered vendors (/api/v1/admin/vendors)
  ───────────────────────────────────── */
  const fetchAllVendors = async () => {
    setVendorsLoading(true)
    setVendorsError(null)
    try {
      const res = await api.get('/api/v1/admin/vendors')
      const payload = res.data?.data
      const list = Array.isArray(payload) ? payload : (payload?.content ?? [])
      setVendors(list.map(normalizeUser))
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to load vendors.'
      setVendorsError(msg)
    } finally {
      setVendorsLoading(false)
    }
  }

  /* ─────────────────────────────────────
     Load pending vendors (/api/v1/admin/vendors/pending)
  ───────────────────────────────────── */
  const fetchPendingVendors = async () => {
    setPendingVendorsLoading(true)
    setPendingVendorsError(null)
    try {
      const res = await api.get('/api/v1/admin/vendors/pending')
      const payload = res.data?.data
      const list = Array.isArray(payload) ? payload : (payload?.content ?? [])
      setPendingVendors(list.map(normalizeUser))
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to load pending vendors.'
      setPendingVendorsError(msg)
    } finally {
      setPendingVendorsLoading(false)
    }
  }

  useEffect(() => {
    fetchManagers()
    fetchAllVendors()
    fetchPendingVendors()
  }, [])

  /* ─────────────────────────────────────
     Change user status (PUT /api/v1/admin/users/{id}/status)
  ───────────────────────────────────── */
  const handleChangeStatus = async (user, newStatus, refreshCallback) => {
    setChangingStatusId(user.id)
    try {
      await api.put(`/api/v1/admin/users/${user.id}/status`, { status: newStatus })
      const displayName = user.fullName && user.fullName !== '—' ? user.fullName : user.email
      const label = ALL_STATUSES.find((s) => s.value === newStatus)?.label ?? newStatus
      toast.success(`${displayName} set to ${label}.`)
      refreshCallback()
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to update account status.'
      toast.error(msg)
    } finally {
      setChangingStatusId(null)
    }
  }

  /* ─────────────────────────────────────
     Approve / Reject vendor
  ───────────────────────────────────── */
  const handleApprove = async (vendor) => {
    setApprovingId(vendor.id)
    try {
      await api.put(`/api/v1/admin/vendors/${vendor.id}/approve`)
      const displayName = vendor.fullName && vendor.fullName !== '—' ? vendor.fullName : vendor.email
      toast.success(`${displayName} approved successfully.`)
      fetchPendingVendors()
      fetchAllVendors()
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to approve vendor.'
      toast.error(msg)
    } finally {
      setApprovingId(null)
    }
  }

  const openRejectModal = (vendor) => {
    setRejectModal({
      open: true,
      vendorId: vendor.id,
      vendorName: vendor.fullName && vendor.fullName !== '—' ? vendor.fullName : (vendor.email ?? 'Vendor'),
    })
  }

  const handleRejectConfirm = async (reason) => {
    try {
      await api.put(`/api/v1/admin/vendors/${rejectModal.vendorId}/reject`, { reason })
      toast.success(`${rejectModal.vendorName} rejected.`)
      setRejectModal({ open: false, vendorId: null, vendorName: '' })
      fetchPendingVendors()
      fetchAllVendors()
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to reject vendor.'
      toast.error(msg)
    }
  }

  const handleDeleteConfirm = async () => {
    setDeletingId(deleteModal.userId)
    try {
      await adminService.deleteUser(deleteModal.userId)
      toast.success(`${deleteModal.userName} has been deleted.`)
      setDeleteModal({ open: false, userId: null, userName: '' })
      // Refetch all three lists — the user may appear in any of them
      fetchManagers()
      fetchAllVendors()
      fetchPendingVendors()
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to delete user.'
      toast.error(msg)
    } finally {
      setDeletingId(null)
    }
  }

  const openDeleteModal = (user) => {
    const name = user.fullName && user.fullName !== '—' ? user.fullName : (user.email ?? 'User')
    setDeleteModal({ open: false, userId: null, userName: '' }) // reset first
    setDeleteModal({ open: true, userId: user.id, userName: name })
  }

  /* ─────────────────────────────────────
     Render
  ───────────────────────────────────── */
  return (
    <div className="space-y-10">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users & Accounts</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
          Manage internal department managers, registered vendor accounts, and review vendor onboarding applications.
        </p>
      </div>

      {/* ══════════════════════════════════
          1. MANAGERS SECTION
      ═══════════════════════════════════ */}
      <CollapsibleSection
        id="managers"
        title="Internal Managers"
        description="Department leads overseeing procurement, inventory, and finance operations."
        count={managersLoading ? null : managers.length}
        defaultOpen={true}
        headerRight={
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Manager
          </Button>
        }
      >
        {managersError ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 dark:bg-white/5 dark:border-white/10 dark:text-white/60">
            {managersError}
          </div>
        ) : (
          <Table
            columns={['Name / Email', 'Role', 'Status', 'Actions']}
            loading={managersLoading}
            empty={!managersLoading && managers.length === 0}
            emptyMessage="No internal managers found."
          >
            {managers.map((manager, i) => (
              <tr
                key={manager.id}
                className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-100 animate-fade-slide-up"
                style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
              >
                {/* Name / Email stacked */}
                <Table.Td className="max-w-xs">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {manager.fullName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-white/60 truncate">{manager.email}</div>
                </Table.Td>

                {/* Role badge */}
                <Table.Td>
                  <Badge status={manager.role} label={manager.role?.replace(/_/g, ' ')} />
                </Table.Td>

                {/* Status badge */}
                <Table.Td>
                  <Badge status={manager.status} />
                </Table.Td>

                {/* Actions */}
                <Table.Td>
                  <div className="flex items-center gap-2">
                    <StatusSelect
                      user={manager}
                      loading={changingStatusId === manager.id}
                      onChangeStatus={(u, s) => handleChangeStatus(u, s, fetchManagers)}
                    />
                    <button
                      type="button"
                      onClick={() => openDeleteModal(manager)}
                      disabled={deletingId === manager.id}
                      aria-label={`Delete ${manager.fullName}`}
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5 dark:border-red-500/30 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Table.Td>
              </tr>
            ))}
          </Table>
        )}
      </CollapsibleSection>

      {/* ══════════════════════════════════
          2. VENDORS SECTION
      ═══════════════════════════════════ */}
      <CollapsibleSection
        id="vendors"
        title="Registered Vendors"
        description="All vendor partner accounts registered on the platform."
        count={vendorsLoading ? null : vendors.length}
        defaultOpen={true}
      >
        {vendorsError ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 dark:bg-white/5 dark:border-white/10 dark:text-white/60">
            {vendorsError}
          </div>
        ) : (
          <Table
            columns={['Vendor Name / Contact Email', 'Role', 'Status', 'Actions']}
            loading={vendorsLoading}
            empty={!vendorsLoading && vendors.length === 0}
            emptyMessage="No registered vendors found."
          >
            {vendors.map((vendor, i) => (
              <tr
                key={vendor.id}
                className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-100 animate-fade-slide-up"
                style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
              >
                {/* Vendor / Email stacked */}
                <Table.Td className="max-w-xs">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {vendor.fullName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-white/60 truncate">{vendor.email}</div>
                </Table.Td>

                {/* Role badge */}
                <Table.Td>
                  <Badge status={vendor.role} label={vendor.role?.replace(/_/g, ' ')} />
                </Table.Td>

                {/* Status badge */}
                <Table.Td>
                  <Badge status={vendor.status} />
                </Table.Td>

                {/* Actions */}
                <Table.Td>
                  <div className="flex items-center gap-2">
                    <StatusSelect
                      user={vendor}
                      loading={changingStatusId === vendor.id}
                      onChangeStatus={(u, s) => handleChangeStatus(u, s, fetchAllVendors)}
                    />
                    <button
                      type="button"
                      onClick={() => openDeleteModal(vendor)}
                      disabled={deletingId === vendor.id}
                      aria-label={`Delete ${vendor.fullName}`}
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5 dark:border-red-500/30 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Table.Td>
              </tr>
            ))}
          </Table>
        )}
      </CollapsibleSection>

      {/* ══════════════════════════════════
          3. PENDING VENDORS SECTION
      ═══════════════════════════════════ */}
      <CollapsibleSection
        id="pending-vendors"
        title="Pending Vendor Approvals"
        description="Review and approve or reject vendor registration requests."
        count={pendingVendorsLoading ? null : pendingVendors.length}
        defaultOpen={true}
      >
        {pendingVendorsError ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 dark:bg-white/5 dark:border-white/10 dark:text-white/60">
            {pendingVendorsError}
          </div>
        ) : (
          <Table
            columns={['Vendor Name', 'Contact Email', 'Status', 'Actions']}
            loading={pendingVendorsLoading}
            empty={!pendingVendorsLoading && pendingVendors.length === 0}
            emptyMessage="No pending vendor applications."
          >
            {pendingVendors.map((vendor, i) => (
              <tr
                key={vendor.id}
                className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-100 animate-fade-slide-up"
                style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
              >
                <Table.Td className="font-medium text-gray-900 dark:text-white">
                  {vendor.fullName}
                </Table.Td>
                <Table.Td className="dark:text-white/60">{vendor.email}</Table.Td>
                <Table.Td>
                  <Badge status="PENDING_APPROVAL" label="Pending Approval" />
                </Table.Td>
                <Table.Td>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      loading={approvingId === vendor.id}
                      onClick={() => handleApprove(vendor)}
                      aria-label={`Approve ${vendor.fullName}`}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={approvingId === vendor.id}
                      onClick={() => openRejectModal(vendor)}
                      aria-label={`Reject ${vendor.fullName}`}
                    >
                      Reject
                    </Button>
                    <button
                      type="button"
                      onClick={() => openDeleteModal(vendor)}
                      disabled={deletingId === vendor.id}
                      aria-label={`Delete ${vendor.fullName}`}
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5 dark:border-red-500/30 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Table.Td>
              </tr>
            ))}
          </Table>
        )}
      </CollapsibleSection>

      {/* ── Modals ── */}
      <CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={fetchManagers}
      />
      <RejectReasonModal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, vendorId: null, vendorName: '' })}
        onConfirm={handleRejectConfirm}
      />
      <ConfirmDeleteModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, userId: null, userName: '' })}
        onConfirm={handleDeleteConfirm}
        userName={deleteModal.userName}
        loading={!!deletingId}
      />
    </div>
  )
}
