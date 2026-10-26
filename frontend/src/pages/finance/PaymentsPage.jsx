import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import { formatDate, formatDateTime, formatCurrency } from '../../utils/formatters'
import { paymentService } from '../../services/paymentService'
import api from '../../services/api'
import toast from 'react-hot-toast'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const COLUMNS = ['Transaction Ref', 'Invoice ID', 'Amount', 'Method', 'Status', 'Initiated', 'Completed']

const PAYMENT_METHODS = ['ACH', 'WIRE', 'CHECK']

function InitiatePaymentModal({ approvedInvoices, onClose, onSuccess }) {
  const today = new Date().toISOString().split('T')[0]
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      invoiceId: '',
      paymentMethod: 'ACH',
      paymentDate: today,
    },
  })

  const onSubmit = async (values) => {
    try {
      await paymentService.initiatePayment({
        invoiceId: values.invoiceId,
        paymentMethod: values.paymentMethod,
        paymentDate: values.paymentDate,
      })
      toast.success('Payment initiated')
      onSuccess()
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to initiate payment'
      toast.error(msg)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-[#1A1035] dark:border dark:border-white/10 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Initiate Payment</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60 transition-colors text-xl leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Invoice */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">
              Invoice
            </label>
            <select
              {...register('invoiceId', { required: 'Invoice is required' })}
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-[#1A1035] dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select an invoice</option>
              {approvedInvoices.map((inv) => (
                <option key={inv.invoiceId ?? inv.id} value={inv.invoiceId ?? inv.id}>
                  {inv.invoiceNumber
                    ? `INV-${inv.invoiceNumber} — ${formatCurrency(inv.totalAmount ?? inv.amount ?? 0)}`
                    : `${inv.invoiceId ?? inv.id} — ${formatCurrency(inv.totalAmount ?? inv.amount ?? 0)}`}
                </option>
              ))}
            </select>
            {errors.invoiceId && (
              <p className="mt-1 text-xs text-red-500">{errors.invoiceId.message}</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">
              Payment Method
            </label>
            <select
              {...register('paymentMethod', { required: 'Payment method is required' })}
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-[#1A1035] dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {errors.paymentMethod && (
              <p className="mt-1 text-xs text-red-500">{errors.paymentMethod.message}</p>
            )}
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              {...register('paymentDate', { required: 'Payment date is required' })}
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white dark:[color-scheme:dark] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.paymentDate && (
              <p className="mt-1 text-xs text-red-500">{errors.paymentDate.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-200 dark:border-white/10 dark:text-white/70 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Initiate Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [approvedInvoices, setApprovedInvoices] = useState([])

  useEffect(() => { loadPayments() }, [page])

  useEffect(() => {
    api
      .get('/api/v1/finance/invoices', { params: { status: 'APPROVED', page: 0, size: 50 } })
      .then((r) => {
        setApprovedInvoices(r.data?.data?.content ?? r.data?.data ?? [])
      })
      .catch(() => {})
  }, [])

  const loadPayments = async () => {
    setLoading(true)
    try {
      const res = await paymentService.getPayments({ page, size: 20 })
      const data = res.data?.data
      setPayments(data?.content ?? [])
      setTotalPages(data?.totalPages ?? 0)
    } catch {
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const handleModalSuccess = () => {
    setShowModal(false)
    loadPayments()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
            View all vendor disbursements and payment history.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Initiate Payment
        </button>
      </div>

      <Table
        columns={COLUMNS}
        loading={loading}
        empty={!loading && payments.length === 0}
        emptyMessage="No payments found."
      >
        {payments.map((p, i) => (
          <tr
            key={p.paymentId}
            className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-100 animate-fade-slide-up"
            style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
          >
            <Table.Td className="font-mono text-xs">{p.transactionReference}</Table.Td>
            <Table.Td className="font-mono text-xs text-gray-400 dark:text-white/40">{p.invoiceId?.slice(-12).toUpperCase()}</Table.Td>
            <Table.Td className="font-medium">{formatCurrency(p.amount)}</Table.Td>
            <Table.Td>{p.paymentMethod}</Table.Td>
            <Table.Td><Badge status={p.status} /></Table.Td>
            <Table.Td>{formatDateTime(p.initiatedAt)}</Table.Td>
            <Table.Td>{p.completedAt ? formatDateTime(p.completedAt) : '—'}</Table.Td>
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

      {showModal && (
        <InitiatePaymentModal
          approvedInvoices={approvedInvoices}
          onClose={() => setShowModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}
