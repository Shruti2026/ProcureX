import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Eye, X, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

import api from '../../services/api'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import { formatDate, daysUntil } from '../../utils/formatters'

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Awarded', value: 'AWARDED' },
  { label: 'Closed', value: 'CLOSED' },
]

const TABLE_COLUMNS = ['RFQ Number', 'Title', 'Closing Date', 'Status', 'Actions']

/* ─────────────────────────────────────────
   ClosingDateCell — shows countdown
───────────────────────────────────────── */
function ClosingDateCell({ dateStr }) {
  const days = daysUntil(dateStr)

  let countdown = null
  if (days === null) {
    countdown = <span className="text-gray-400">—</span>
  } else if (days < 0) {
    countdown = <span className="text-red-600 text-xs font-medium">Expired</span>
  } else if (days <= 3) {
    countdown = (
      <span className="text-red-600 text-xs font-medium">{days} days left</span>
    )
  } else {
    countdown = (
      <span className="text-gray-500 text-xs">{days} days left</span>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-gray-700">{formatDate(dateStr)}</span>
      {countdown}
    </div>
  )
}

/* ─────────────────────────────────────────
   CreateRfqModal
───────────────────────────────────────── */
function CreateRfqModal({ isOpen, onClose }) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      requisitionId: '',
      closingDate: '',
      invitedVendorIds: [],
    },
  })

  // Fetch CREATED requisitions for the dropdown
  const { data: requisitionData, isLoading: requisitionsLoading } = useQuery({
    queryKey: ['requisitions-for-rfq'],
    queryFn: () =>
      api
        .get('/api/v1/procurement/requisitions', { params: { status: 'CREATED', size: 100 } })
        .then((r) => r.data?.data?.content ?? r.data?.data ?? []),
    staleTime: 30_000,
    enabled: isOpen,
  })
  const requisitions = Array.isArray(requisitionData)
    ? requisitionData
    : (requisitionData?.content ?? [])

  // Fetch ACTIVE vendors for the multi-select
  const { data: vendorData, isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors-active'],
    queryFn: () =>
      api
        .get('/api/v1/vendors', { params: { status: 'ACTIVE', size: 100 } })
        .then((r) => r.data?.data?.content ?? r.data?.data ?? []),
    staleTime: 60_000,
    enabled: isOpen,
  })
  const vendors = Array.isArray(vendorData) ? vendorData : (vendorData?.content ?? [])

  const mutation = useMutation({
    mutationFn: (payload) =>
      api.post('/api/v1/procurement/rfqs', payload).then((r) => r.data?.data ?? r.data),
    onSuccess: () => {
      toast.success('RFQ created successfully')
      queryClient.invalidateQueries({ queryKey: ['rfqs'] })
      reset()
      onClose()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to create RFQ')
    },
  })

  const onSubmit = (formData) => {
    // <select multiple> yields a string when only one option is selected in some browsers
    const ids = Array.isArray(formData.invitedVendorIds)
      ? formData.invitedVendorIds
      : [formData.invitedVendorIds]
    mutation.mutate({
      requisitionId: formData.requisitionId,
      closingDate: formData.closingDate,
      invitedVendorIds: ids.filter(Boolean),
    })
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  // Today's date in YYYY-MM-DD for min date constraint
  const todayStr = new Date().toISOString().split('T')[0]

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">New Request for Quotation</h2>
                <p className="text-xs text-primary-100">Fill in the details below</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Form body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="overflow-y-auto flex-1 px-6 py-6 space-y-5"
        >
          {/* Requisition */}
          <div>
            <label htmlFor="rfq-requisition" className="block text-sm font-medium text-gray-700 mb-1">
              Requisition <span className="text-red-500">*</span>
            </label>
            <select
              id="rfq-requisition"
              className={clsx(
                'w-full rounded-lg border px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white',
                errors.requisitionId ? 'border-red-400' : 'border-gray-300'
              )}
              {...register('requisitionId', { required: 'Requisition is required' })}
              disabled={requisitionsLoading}
            >
              <option value="">
                {requisitionsLoading ? 'Loading...' : 'Select a requisition'}
              </option>
              {requisitions.map((req) => (
                <option key={req.id ?? req.requisitionId} value={req.id ?? req.requisitionId}>
                  {req.requisitionNumber ?? req.id ?? req.requisitionId}
                  {req.title ? ` — ${req.title}` : ''}
                </option>
              ))}
            </select>
            {errors.requisitionId && (
              <p className="mt-1 text-xs text-red-500">{errors.requisitionId.message}</p>
            )}
          </div>

          {/* Closing Date */}
          <div>
            <label htmlFor="rfq-closing-date" className="block text-sm font-medium text-gray-700 mb-1">
              Closing Date <span className="text-red-500">*</span>
            </label>
            <input
              id="rfq-closing-date"
              type="date"
              min={todayStr}
              className={clsx(
                'w-full rounded-lg border px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
                errors.closingDate ? 'border-red-400' : 'border-gray-300'
              )}
              {...register('closingDate', {
                required: 'Closing date is required',
                validate: (val) =>
                  !val || val >= todayStr || 'Closing date must be in the future',
              })}
            />
            {errors.closingDate && (
              <p className="mt-1 text-xs text-red-500">{errors.closingDate.message}</p>
            )}
          </div>

          {/* Invited Vendors */}
          <div>
            <label htmlFor="rfq-vendors" className="block text-sm font-medium text-gray-700 mb-1">
              Invite Vendors <span className="text-red-500">*</span>
            </label>
            <p className="mb-1.5 text-xs text-gray-500">Hold Ctrl / Cmd to select multiple vendors.</p>
            <select
              id="rfq-vendors"
              multiple
              size={Math.min(6, Math.max(3, vendors.length))}
              className={clsx(
                'w-full rounded-lg border px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white',
                errors.invitedVendorIds ? 'border-red-400' : 'border-gray-300'
              )}
              {...register('invitedVendorIds', {
                required: 'At least one vendor must be selected',
                validate: (val) => {
                  const arr = Array.isArray(val) ? val : [val]
                  return arr.filter(Boolean).length > 0 || 'At least one vendor must be selected'
                },
              })}
              disabled={vendorsLoading}
            >
              {vendorsLoading ? (
                <option disabled>Loading vendors...</option>
              ) : (
                vendors.map((v) => (
                  <option key={v.vendorId ?? v.id} value={v.vendorId ?? v.id}>
                    {v.companyName ?? v.name ?? v.vendorId}
                  </option>
                ))
              )}
            </select>
            {errors.invitedVendorIds && (
              <p className="mt-1 text-xs text-red-500">{errors.invitedVendorIds.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={mutation.isPending}
            >
              Create RFQ
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   RfqsPage
───────────────────────────────────────── */
export default function RfqsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['rfqs', { status: statusFilter, page }],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), size: '20' })
      if (statusFilter) params.set('status', statusFilter)
      return api
        .get(`/api/v1/procurement/rfqs?${params.toString()}`)
        .then((r) => r.data?.data ?? r.data)
    },
    keepPreviousData: true,
  })

  const rfqs = data?.content ?? (Array.isArray(data) ? data : [])
  const totalPages = data?.totalPages ?? 1
  const isFirst = page === 0
  const isLast = page >= totalPages - 1

  const handleStatusChange = (value) => {
    setStatusFilter(value)
    setPage(0)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requests for Quotation</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create quotation requests, invite suppliers, and compare bids.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} />
          Create RFQ
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleStatusChange(tab.value)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none',
              statusFilter === tab.value
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Table
        columns={TABLE_COLUMNS}
        loading={isLoading}
        empty={!isLoading && rfqs.length === 0}
        emptyMessage="No RFQs found."
      >
        {rfqs.map((row) => (
          <tr key={row.rfqId ?? row.id} className="hover:bg-gray-50 transition-colors duration-100">
            <Table.Td className="font-mono text-xs text-gray-500">
              {row.rfqNumber ?? row.rfqId?.slice(-8).toUpperCase()}
            </Table.Td>
            <Table.Td className="font-medium text-gray-900 max-w-[220px] truncate">
              {row.requisitionTitle ?? row.title ?? '—'}
            </Table.Td>
            <Table.Td>
              <ClosingDateCell dateStr={row.closingDate} />
            </Table.Td>
            <Table.Td>
              <Badge status={row.status} />
            </Table.Td>
            <Table.Td>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // eslint-disable-next-line no-console
                  console.log('View RFQ:', row.rfqId ?? row.id)
                  toast('Detail page coming soon', { icon: null })
                }}
              >
                <Eye size={14} />
                View
              </Button>
            </Table.Td>
          </tr>
        ))}
      </Table>

      {/* Pagination */}
      {!isLoading && rfqs.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />
      )}

      {/* Create modal */}
      <CreateRfqModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  )
}
