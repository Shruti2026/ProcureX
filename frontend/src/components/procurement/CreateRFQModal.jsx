import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { X, FileText, Calendar, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Spinner from '../ui/Spinner'
import { getRequisitions } from '../../services/requisitionService'
import { getVendors } from '../../services/vendorService'
import { createRFQ } from '../../services/rfqService'
import { formatDate } from '../../utils/formatters'

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function getTomorrowString() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

/* ─────────────────────────────────────────
   CreateRFQModal — 3-step wizard
───────────────────────────────────────── */
export default function CreateRFQModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [selectedRequisition, setSelectedRequisition] = useState(null)
  const [closingDate, setClosingDate] = useState('')
  const [selectedVendorIds, setSelectedVendorIds] = useState([])

  /* Step 1 — Requisitions */
  const { data: requisitionsData, isLoading: requisitionsLoading } = useQuery({
    queryKey: ['requisitions-for-rfq'],
    queryFn: () => getRequisitions({ status: 'CREATED', size: 50 }),
    enabled: isOpen,
    staleTime: 2 * 60 * 1000,
  })

  /* Step 3 — Vendors */
  const { data: vendorsData, isLoading: vendorsLoading } = useQuery({
    queryKey: ['active-vendors'],
    queryFn: () => getVendors({ status: 'ACTIVE', size: 100 }),
    enabled: isOpen && step === 3,
    staleTime: 2 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: (payload) => createRFQ(payload),
    onSuccess: () => {
      toast.success('RFQ created successfully')
      if (onSuccess) onSuccess()
      handleClose()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to create RFQ')
    },
  })

  const requisitions = Array.isArray(requisitionsData)
    ? requisitionsData
    : requisitionsData?.content ?? []

  const vendors = Array.isArray(vendorsData)
    ? vendorsData
    : vendorsData?.content ?? []

  const handleClose = () => {
    setStep(1)
    setSelectedRequisition(null)
    setClosingDate('')
    setSelectedVendorIds([])
    onClose()
  }

  const handleVendorToggle = (vendorId) => {
    setSelectedVendorIds((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId]
    )
  }

  const handleSubmit = () => {
    if (!selectedRequisition || !closingDate || selectedVendorIds.length === 0) return
    createMutation.mutate({
      requisitionId: selectedRequisition.requisitionId ?? selectedRequisition.id,
      closingDate,
      invitedVendorIds: selectedVendorIds,
    })
  }

  if (!isOpen) return null

  const stepIcons = [FileText, Calendar, Users]
  const stepLabels = ['Select Requisition', 'Set Closing Date', 'Select Vendors']

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Create RFQ</h2>
              <p className="text-xs text-primary-100">Step {step} of 3 — {stepLabels[step - 1]}</p>
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

          {/* Step indicators */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => {
              const Icon = stepIcons[s - 1]
              return (
                <div
                  key={s}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    s === step
                      ? 'bg-white text-primary-700'
                      : s < step
                      ? 'bg-white/30 text-white'
                      : 'bg-white/10 text-primary-200'
                  )}
                >
                  <Icon size={12} />
                  {stepLabels[s - 1]}
                </div>
              )
            })}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-6">

          {/* ── Step 1: Select Requisition ── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Select a requisition to create an RFQ for. Only requisitions with status "Created" are shown.
              </p>

              {requisitionsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : requisitions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No eligible requisitions found.
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {requisitions.map((req) => (
                    <button
                      key={req.requisitionId ?? req.id}
                      type="button"
                      onClick={() => setSelectedRequisition(req)}
                      className={clsx(
                        'w-full text-left rounded-lg border px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400',
                        selectedRequisition?.requisitionId === (req.requisitionId ?? req.id) ||
                        selectedRequisition?.id === (req.requisitionId ?? req.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm">{req.title}</span>
                        <Badge status={req.status} />
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        <span className="font-mono">
                          {req.requisitionNumber ?? (req.id?.slice(-8).toUpperCase())}
                        </span>
                        <span>{formatDate(req.createdAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  disabled={!selectedRequisition}
                  onClick={() => setStep(2)}
                >
                  Next
                  <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Set Closing Date ── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Set the deadline by which vendors must submit their quotations.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Closing Date
                </label>
                <input
                  type="date"
                  min={getTomorrowString()}
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
                {!closingDate && (
                  <p className="mt-1 text-xs text-gray-400">Please select a closing date to continue.</p>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  <ChevronLeft size={15} />
                  Back
                </Button>
                <Button
                  variant="primary"
                  disabled={!closingDate}
                  onClick={() => setStep(3)}
                >
                  Next
                  <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Select Vendors ── */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Select one or more active vendors to invite to this RFQ.
              </p>

              {vendorsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : vendors.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No active vendors available.
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {vendors.map((vendor) => {
                    const vendorId = vendor.vendorId ?? vendor.id
                    const isChecked = selectedVendorIds.includes(vendorId)
                    return (
                      <label
                        key={vendorId}
                        className={clsx(
                          'flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors',
                          isChecked
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleVendorToggle(vendorId)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {vendor.companyName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{vendor.email}</p>
                        </div>
                        <Badge status={vendor.vendorStatus ?? vendor.status} />
                      </label>
                    )
                  })}
                </div>
              )}

              {selectedVendorIds.length > 0 && (
                <p className="text-xs text-primary-600 font-medium">
                  {selectedVendorIds.length} vendor{selectedVendorIds.length > 1 ? 's' : ''} selected
                </p>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  <ChevronLeft size={15} />
                  Back
                </Button>
                <Button
                  variant="primary"
                  disabled={selectedVendorIds.length === 0 || createMutation.isPending}
                  loading={createMutation.isPending}
                  onClick={handleSubmit}
                >
                  Create RFQ
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
