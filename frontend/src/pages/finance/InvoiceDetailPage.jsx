import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle, XCircle, Play, CreditCard, ArrowRight } from 'lucide-react'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import Spinner from '../../components/ui/Spinner'
import { formatDate, formatDateTime, formatCurrency } from '../../utils/formatters'
import { invoiceService } from '../../services/invoiceService'
import { paymentService } from '../../services/paymentService'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

const LINE_ITEMS_COLS = ['Product Name', 'Qty', 'Unit Price', 'Total Price']
const HISTORY_COLS    = ['From', 'To', 'Changed By', 'Date', 'Remarks']

// ---------------------------------------------------------------------------
// Initiate Payment Modal
// ---------------------------------------------------------------------------
function InitiatePaymentModal({ invoiceId, onClose, onSuccess }) {
  const [method, setMethod] = useState('ACH')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await paymentService.initiatePayment({ invoiceId, paymentMethod: method })
      toast.success('Payment initiated successfully')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to initiate payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Initiate Payment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ACH">ACH</option>
              <option value="WIRE">WIRE</option>
              <option value="CHECK">CHECK</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={loading}>
              Initiate Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function InvoiceDetailPage() {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const [actionLoading, setActionLoading] = useState(null)
  const [showPayModal, setShowPayModal] = useState(false)

  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => invoiceService.getInvoiceById(invoiceId).then(res => res.data?.data),
    retry: (failCount, err) => err?.response?.status === 404 ? false : failCount < 2,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" className="text-primary-500" />
      </div>
    )
  }

  if (isError || !invoice) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/finance/invoices')}>
          <ArrowLeft size={15} /> Back to Invoices
        </Button>
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">Invoice not found.</p>
        </div>
      </div>
    )
  }

  const isFinanceManager = user?.role === ROLES.FINANCE_MANAGER || user?.role === ROLES.ADMIN

  const handleRunMatch = async () => {
    setActionLoading('match')
    try {
      await invoiceService.runMatch(invoiceId)
      toast.success('Three-way match completed')
      invalidate()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Match failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = async () => {
    setActionLoading('approve')
    try {
      await invoiceService.approveInvoice(invoiceId)
      toast.success('Invoice approved')
      invalidate()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Approval failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!window.confirm('Reject this invoice? This cannot be undone.')) return
    setActionLoading('reject')
    try {
      await invoiceService.rejectInvoice(invoiceId)
      toast.success('Invoice rejected')
      invalidate()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Rejection failed')
    } finally {
      setActionLoading(null)
    }
  }

  const items   = invoice.items   ?? []
  const history = invoice.history ?? []
  const match   = invoice.matchResult

  const canRunMatch = invoice.status === 'PENDING_VERIFICATION'
  const canApprove  = invoice.status === 'VERIFIED' && isFinanceManager
  const canReject   = ['PENDING_VERIFICATION', 'VERIFIED', 'FLAGGED_VARIANCE'].includes(invoice.status) && isFinanceManager
  const canPay      = invoice.status === 'APPROVED' && isFinanceManager

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/finance/invoices')}>
        <ArrowLeft size={15} /> Back to Invoices
      </Button>

      {/* Section 1 — Invoice Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Submitted {formatDateTime(invoice.submittedAt)}
            </p>
          </div>
          <Badge status={invoice.status} />
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 text-sm">
          <div>
            <dt className="text-gray-400">PO Reference</dt>
            <dd className="font-mono text-gray-700">{invoice.purchaseOrderId?.slice(-12).toUpperCase()}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Vendor ID</dt>
            <dd className="font-mono text-gray-700">{invoice.vendorId?.slice(-12).toUpperCase()}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Invoice Amount</dt>
            <dd className="font-semibold text-gray-900">{formatCurrency(invoice.invoiceAmount)}</dd>
          </div>
          {invoice.verifiedAt && (
            <div>
              <dt className="text-gray-400">Verified</dt>
              <dd className="text-gray-700">{formatDate(invoice.verifiedAt)}</dd>
            </div>
          )}
          {invoice.approvedAt && (
            <div>
              <dt className="text-gray-400">Approved</dt>
              <dd className="text-gray-700">{formatDate(invoice.approvedAt)}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Section 2 — Line Items */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Line Items</h2>
        <Table columns={LINE_ITEMS_COLS} empty={items.length === 0} emptyMessage="No items.">
          {items.map((item) => (
            <tr key={item.invoiceItemId} className="hover:bg-gray-50">
              <Table.Td className="font-medium">{item.productName}</Table.Td>
              <Table.Td>{item.quantity}</Table.Td>
              <Table.Td>{formatCurrency(item.unitPrice)}</Table.Td>
              <Table.Td className="font-medium">{formatCurrency(item.totalPrice)}</Table.Td>
            </tr>
          ))}
        </Table>
      </div>

      {/* Section 3 — Three-Way Match Result */}
      {match && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Three-Way Match Result</h2>
          <div className={`rounded-xl border p-4 mb-4 ${match.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center gap-2">
              {match.passed
                ? <CheckCircle size={18} className="text-green-600" />
                : <XCircle size={18} className="text-red-600" />
              }
              <span className={`font-semibold text-sm ${match.passed ? 'text-green-700' : 'text-red-700'}`}>
                {match.passed ? 'All checks passed — invoice matches PO and GRN' : `${match.flags?.length} issue(s) detected`}
              </span>
            </div>
          </div>
          {match.flags && match.flags.length > 0 && (
            <div className="space-y-2">
              {match.flags.map((flag, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm">
                  <XCircle size={15} className="text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-orange-700">{flag.productName} — {flag.flagType.replace('_', ' ')}</p>
                    <p className="text-orange-600">{flag.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section 4 — Status History */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Status History</h2>
        <Table columns={HISTORY_COLS} empty={history.length === 0} emptyMessage="No history.">
          {history.map((h, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <Table.Td>{h.fromStatus ? <Badge status={h.fromStatus} /> : <span className="text-gray-300">—</span>}</Table.Td>
              <Table.Td><Badge status={h.toStatus} /></Table.Td>
              <Table.Td className="font-mono text-xs text-gray-400">{h.changedBy?.slice(-8).toUpperCase()}</Table.Td>
              <Table.Td>{formatDateTime(h.changedAt)}</Table.Td>
              <Table.Td className="text-gray-500">{h.remarks || '—'}</Table.Td>
            </tr>
          ))}
        </Table>
      </div>

      {/* Section 5 — Actions */}
      {(canRunMatch || canApprove || canReject || canPay) && (
        <div className="flex flex-wrap gap-2 pt-2">
          {canRunMatch && (
            <Button
              variant="secondary"
              loading={actionLoading === 'match'}
              onClick={handleRunMatch}
            >
              <Play size={14} /> Run Three-Way Match
            </Button>
          )}
          {canApprove && (
            <Button
              variant="primary"
              loading={actionLoading === 'approve'}
              onClick={handleApprove}
            >
              <CheckCircle size={14} /> Approve Invoice
            </Button>
          )}
          {canReject && (
            <Button
              variant="danger"
              loading={actionLoading === 'reject'}
              onClick={handleReject}
            >
              <XCircle size={14} /> Reject Invoice
            </Button>
          )}
          {canPay && (
            <Button
              variant="primary"
              onClick={() => setShowPayModal(true)}
            >
              <CreditCard size={14} /> Initiate Payment
            </Button>
          )}
        </div>
      )}

      {showPayModal && (
        <InitiatePaymentModal
          invoiceId={invoiceId}
          onClose={() => setShowPayModal(false)}
          onSuccess={invalidate}
        />
      )}
    </div>
  )
}
