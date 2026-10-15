import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FileSearch, X, ChevronLeft, ChevronRight, SendHorizonal } from 'lucide-react'
import clsx from 'clsx'

import api from '../../services/api'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import Input from '../../components/ui/Input'
import { formatDate, daysUntil } from '../../utils/formatters'

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const TABLE_COLUMNS = ['RFQ Number', 'Title', 'Closing Date', 'Status', 'Actions']

/* ─────────────────────────────────────────
   ClosingDateCell — shows formatted date + countdown
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
   QuotationSubmitModal
───────────────────────────────────────── */
function QuotationSubmitModal({ rfq, onClose }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      leadTimeDays: '',
      paymentTerms: '',
      totalAmount: '',
    },
  })

  const onSubmit = async (formData) => {
    try {
      await api.post('/api/v1/procurement/quotations', {
        rfqId: rfq.id,
        leadTimeDays: Number(formData.leadTimeDays),
        paymentTerms: formData.paymentTerms,
        totalAmount: Number(formData.totalAmount),
      })
      toast.success('Quotation submitted successfully')
      reset()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit quotation')
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <SendHorizonal className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Submit Quotation</h2>
                <p
                  className="text-xs text-primary-100 max-w-[220px] truncate"
                  title={rfq.title}
                >
                  {rfq.title}
                </p>
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
          {/* Lead Time */}
          <Input
            label="Lead Time (days)"
            type="number"
            placeholder="e.g. 14"
            error={errors.leadTimeDays?.message}
            {...register('leadTimeDays', {
              required: 'Lead time is required',
              min: { value: 1, message: 'Must be at least 1 day' },
            })}
          />

          {/* Payment Terms */}
          <Input
            label="Payment Terms"
            type="text"
            placeholder="e.g. Net 30"
            error={errors.paymentTerms?.message}
            {...register('paymentTerms', {
              required: 'Payment terms are required',
            })}
          />

          {/* Total Amount */}
          <Input
            label="Total Amount"
            type="number"
            placeholder="e.g. 150000"
            error={errors.totalAmount?.message}
            {...register('totalAmount', {
              required: 'Total amount is required',
              min: { value: 0.01, message: 'Amount must be greater than 0' },
            })}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={isSubmitting}
            >
              Submit Quotation
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   VendorRfqsPage
───────────────────────────────────────── */
export default function VendorRfqsPage() {
  const [rfqs, setRfqs] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedRfq, setSelectedRfq] = useState(null)

  useEffect(() => {
    let cancelled = false

    const fetchRfqs = async () => {
      setLoading(true)
      try {
        const res = await api.get(
          `/api/v1/procurement/rfqs?status=OPEN&page=${page}&size=20`
        )
        const payload = res.data?.data ?? res.data
        if (!cancelled) {
          setRfqs(payload?.content ?? (Array.isArray(payload) ? payload : []))
          setTotalPages(payload?.totalPages ?? 1)
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.response?.data?.message || 'Failed to load RFQs')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRfqs()
    return () => { cancelled = true }
  }, [page])

  const isFirst = page === 0
  const isLast = page >= totalPages - 1

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Open RFQs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse open requests for quotation and submit your bids.
          </p>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={TABLE_COLUMNS}
        loading={loading}
        empty={!loading && rfqs.length === 0}
        emptyMessage="No open RFQs available at this time."
      >
        {rfqs.map((row) => (
          <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-100">
            <Table.Td className="font-mono text-xs text-gray-500">
              {row.rfqNumber ?? row.id?.slice(-8).toUpperCase()}
            </Table.Td>
            <Table.Td className="font-medium text-gray-900 max-w-[220px] truncate">
              {row.title}
            </Table.Td>
            <Table.Td>
              <ClosingDateCell dateStr={row.closingDate} />
            </Table.Td>
            <Table.Td>
              <Badge status={row.status} />
            </Table.Td>
            <Table.Td>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedRfq(row)}
              >
                <FileSearch size={14} />
                Submit Quotation
              </Button>
            </Table.Td>
          </tr>
        ))}
      </Table>

      {/* Pagination */}
      {!loading && rfqs.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-gray-500">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={isFirst}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={15} />
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={isLast}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      )}

      {/* Quotation submit modal */}
      {selectedRfq && (
        <QuotationSubmitModal
          rfq={selectedRfq}
          onClose={() => setSelectedRfq(null)}
        />
      )}
    </div>
  )
}
