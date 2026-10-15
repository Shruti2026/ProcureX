import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { Plus, X, Lock, Unlock } from 'lucide-react'

import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Input from '../../components/ui/Input'
import Table from '../../components/ui/Table'
import api from '../../services/api'
import { formatDate } from '../../utils/formatters'

/* ─────────────────────────────────────────
   Yup schema — Create User form
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
   CreateUserModal
───────────────────────────────────────── */
function CreateUserModal({ isOpen, onClose, onCreated }) {
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
    if (isOpen) reset({ fullName: '', email: '', role: '' })
  }, [isOpen, reset])

  const onSubmit = async (data) => {
    try {
      await api.post('/api/v1/admin/users', data)
      toast.success('User created successfully.')
      reset()
      onCreated()
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to create user.'
      toast.error(msg)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 id="create-user-modal-title" className="text-base font-semibold text-gray-900">
            Create User
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
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
              <label htmlFor="user-role" className="text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="user-role"
                aria-invalid={!!errors.role}
                aria-describedby={errors.role ? 'user-role-error' : undefined}
                className={[
                  'w-full rounded-lg border px-3 py-2 text-sm text-gray-900',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  'disabled:bg-gray-50 disabled:cursor-not-allowed',
                  errors.role ? 'border-red-300 focus:ring-red-400' : 'border-gray-200',
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
                <p id="user-role-error" role="alert" className="text-xs text-red-600">
                  {errors.role.message}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create User
            </Button>
          </div>
        </form>
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
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 id="reject-modal-title" className="text-base font-semibold text-gray-900">
            Reject Vendor
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <label htmlFor="reject-reason" className="text-sm font-medium text-gray-700 block">
            Rejection Reason
          </label>
          <textarea
            id="reject-reason"
            rows={3}
            placeholder="Provide a reason for rejection..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
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
   UsersPage
───────────────────────────────────────── */
export default function UsersPage() {
  /* ── Users state ── */
  const [users, setUsers]             = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError]   = useState(null)

  /* ── Vendors state ── */
  const [vendors, setVendors]               = useState([])
  const [vendorsLoading, setVendorsLoading] = useState(true)
  const [vendorsError, setVendorsError]     = useState(null)

  /* ── UI state ── */
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [lockingId, setLockingId]             = useState(null)   // user id currently being locked/unlocked
  const [approvingId, setApprovingId]         = useState(null)   // vendor id being approved
  const [rejectModal, setRejectModal]         = useState({ open: false, vendorId: null })

  /* ─────────────────────────────────────
     Load users — try primary, fallback
  ───────────────────────────────────── */
  const fetchUsers = async () => {
    setUsersLoading(true)
    setUsersError(null)
    try {
      const res = await api.get('/api/v1/admin/users?page=0&size=20')
      const payload = res.data?.data
      setUsers(Array.isArray(payload) ? payload : payload?.content ?? [])
    } catch {
      try {
        const res = await api.get('/api/v1/users?page=0&size=20')
        const payload = res.data?.data
        setUsers(Array.isArray(payload) ? payload : payload?.content ?? [])
      } catch {
        setUsersError('User management API not available')
      }
    } finally {
      setUsersLoading(false)
    }
  }

  /* ─────────────────────────────────────
     Load pending vendors
  ───────────────────────────────────── */
  const fetchPendingVendors = async () => {
    setVendorsLoading(true)
    setVendorsError(null)
    try {
      const res = await api.get('/api/v1/admin/vendors/pending')
      const payload = res.data?.data
      setVendors(Array.isArray(payload) ? payload : payload?.content ?? [])
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to load pending vendors.'
      setVendorsError(msg)
    } finally {
      setVendorsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchPendingVendors()
  }, [])

  /* ─────────────────────────────────────
     Lock / Unlock user
  ───────────────────────────────────── */
  const handleLock = async (user) => {
    setLockingId(user.id)
    try {
      await api.patch(`/api/v1/admin/users/${user.id}/lock`)
      toast.success(`${user.fullName ?? user.email} has been locked.`)
      fetchUsers()
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to lock user.'
      toast.error(msg)
    } finally {
      setLockingId(null)
    }
  }

  const handleUnlock = async (user) => {
    setLockingId(user.id)
    try {
      await api.patch(`/api/v1/admin/users/${user.id}/unlock`)
      toast.success(`${user.fullName ?? user.email} has been unlocked.`)
      fetchUsers()
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to unlock user.'
      toast.error(msg)
    } finally {
      setLockingId(null)
    }
  }

  /* ─────────────────────────────────────
     Approve / Reject vendor
  ───────────────────────────────────── */
  const handleApprove = async (vendor) => {
    setApprovingId(vendor.id)
    try {
      await api.put(`/api/v1/admin/vendors/${vendor.id}/approve`)
      toast.success(`${vendor.companyName ?? vendor.name ?? 'Vendor'} approved.`)
      fetchPendingVendors()
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to approve vendor.'
      toast.error(msg)
    } finally {
      setApprovingId(null)
    }
  }

  const openRejectModal = (vendor) => {
    setRejectModal({ open: true, vendorId: vendor.id, vendorName: vendor.companyName ?? vendor.name ?? 'Vendor' })
  }

  const handleRejectConfirm = async (reason) => {
    try {
      await api.put(`/api/v1/admin/vendors/${rejectModal.vendorId}/reject`, { reason })
      toast.success(`${rejectModal.vendorName} rejected.`)
      setRejectModal({ open: false, vendorId: null })
      fetchPendingVendors()
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Failed to reject vendor.'
      toast.error(msg)
    }
  }

  /* ─────────────────────────────────────
     Render
  ───────────────────────────────────── */
  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage system users, credentials, roles, and account permissions.
        </p>
      </div>

      {/* ══════════════════════════════════
          USER MANAGEMENT SECTION
      ═══════════════════════════════════ */}
      <section aria-labelledby="users-section-title">
        <div className="flex items-center justify-between mb-4">
          <h2 id="users-section-title" className="text-base font-semibold text-gray-900">
            All Users
          </h2>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Create User
          </Button>
        </div>

        {usersError ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">
            {usersError}
          </div>
        ) : (
          <Table
            columns={['Name / Email', 'Role', 'Status', 'Created Date', 'Actions']}
            loading={usersLoading}
            empty={!usersLoading && users.length === 0}
            emptyMessage="No users found."
          >
            {users.map((user, i) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 transition-colors duration-100 animate-fade-slide-up"
                style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
              >
                {/* Name / Email stacked */}
                <Table.Td className="max-w-xs">
                  <div className="font-medium text-gray-900 truncate">
                    {user.fullName ?? '—'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                </Table.Td>

                {/* Role badge */}
                <Table.Td>
                  <Badge status={user.role} label={user.role?.replace(/_/g, ' ')} />
                </Table.Td>

                {/* Status badge */}
                <Table.Td>
                  <Badge status={user.status} />
                </Table.Td>

                {/* Created date */}
                <Table.Td>{formatDate(user.createdAt)}</Table.Td>

                {/* Actions */}
                <Table.Td>
                  {user.status === 'ACTIVE' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={lockingId === user.id}
                      onClick={() => handleLock(user)}
                      aria-label={`Lock ${user.fullName ?? user.email}`}
                    >
                      <Lock className="w-4 h-4" />
                      Lock
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={lockingId === user.id}
                      onClick={() => handleUnlock(user)}
                      aria-label={`Unlock ${user.fullName ?? user.email}`}
                    >
                      <Unlock className="w-4 h-4" />
                      Unlock
                    </Button>
                  )}
                </Table.Td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      {/* ══════════════════════════════════
          PENDING VENDORS SECTION
      ═══════════════════════════════════ */}
      <section aria-labelledby="vendors-section-title">
        <div className="mb-4">
          <h2 id="vendors-section-title" className="text-base font-semibold text-gray-900">
            Pending Vendor Approvals
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Review and approve or reject vendor registration requests.
          </p>
        </div>

        {vendorsError ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">
            {vendorsError}
          </div>
        ) : (
          <Table
            columns={['Vendor Name', 'Contact Email', 'Registration Date', 'Actions']}
            loading={vendorsLoading}
            empty={!vendorsLoading && vendors.length === 0}
            emptyMessage="No pending vendor applications."
          >
            {vendors.map((vendor, i) => (
              <tr
                key={vendor.id}
                className="hover:bg-gray-50 transition-colors duration-100 animate-fade-slide-up"
                style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
              >
                <Table.Td className="font-medium text-gray-900">
                  {vendor.companyName ?? vendor.name ?? '—'}
                </Table.Td>
                <Table.Td>{vendor.contactEmail ?? vendor.email ?? '—'}</Table.Td>
                <Table.Td>{formatDate(vendor.createdAt ?? vendor.registrationDate)}</Table.Td>
                <Table.Td>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      loading={approvingId === vendor.id}
                      onClick={() => handleApprove(vendor)}
                      aria-label={`Approve ${vendor.companyName ?? vendor.name}`}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={approvingId === vendor.id}
                      onClick={() => openRejectModal(vendor)}
                      aria-label={`Reject ${vendor.companyName ?? vendor.name}`}
                    >
                      Reject
                    </Button>
                  </div>
                </Table.Td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      {/* ── Modals ── */}
      <CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={fetchUsers}
      />
      <RejectReasonModal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, vendorId: null })}
        onConfirm={handleRejectConfirm}
      />
    </div>
  )
}
