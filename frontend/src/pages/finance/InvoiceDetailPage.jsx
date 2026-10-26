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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white dark:bg-[#1A1035] dark:border dark:border-white/10 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Initiate Payment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full border border-gray-200 dark:border-white/10 dark:bg-[#1A1035] dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-12 text-center">
          <p className="text-gray-500 dark:text-white/60">Invoice not found.</p>
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
      <div className="bg-white dark:bg-white/5 dark:backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{invoice.invoiceNumber}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
              Submitted {formatDateTime(invoice.submittedAt)}
            </p>
          </div>
          <Badge status={invoice.status} />
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 text-sm">
          <div>
            <dt className="text-gray-400 dark:text-white/40">PO Reference</dt>
            <dd className="font-mono text-gray-700 dark:text-white/60">{invoice.purchaseOrderId?.slice(-12).toUpperCase()}</dd>
          </div>
          <div>
            <dt className="text-gray-400 dark:text-white/40">Vendor ID</dt>
            <dd className="font-mono text-gray-700 dark:text-white/60">{invoice.vendorId?.slice(-12).toUpperCase()}</dd>
          </div>
          <div>
            <dt className="text-gray-400 dark:text-white/40">Invoice Amount</dt>
            <dd className="font-semibold text-gray-900 dark:text-white">{formatCurrency(invoice.invoiceAmount)}</dd>
          </div>
          {invoice.verifiedAt && (
            <div>
              <dt className="text-gray-400 dark:text-white/40">Verified</dt>
              <dd className="text-gray-700 dark:text-white/60">{formatDate(invoice.verifiedAt)}</dd>
            </div>
          )}
          {invoice.approvedAt && (
            <div>
              <dt className="text-gray-400 dark:text-white/40">Approved</dt>
              <dd className="text-gray-700 dark:text-white/60">{formatDate(invoice.approvedAt)}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Section 2 — Line Items */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-3">Line Items</h2>
        <Table columns={LINE_ITEMS_COLS} empty={items.length === 0} emptyMessage="No items.">
          {items.map((item) => (
            <tr key={item.invoiceItemId} className="hover:bg-gray-50 dark:hover:bg-white/5">
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
          <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-3">Three-Way Match Result</h2>

          {/* Pass / Fail banner */}
          <div className={`rounded-xl border p-4 mb-4 ${match.passed ? 'border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-900/20' : 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-900/20'}`}>
            <div className="flex items-center gap-2">
              {match.passed
                ? <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                : <XCircle size={18} className="text-red-600 dark:text-red-400" />
              }
              <span className={`font-semibold text-sm ${match.passed ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {match.passed
                  ? 'All checks passed — invoice matches PO and GRN'
                  : `${match.flags?.length ?? 'Some'} issue(s) detected — review discrepancies below`}
              </span>
            </div>

            {/* Totals comparison row */}
            <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
              <div className="rounded-lg bg-white/70 dark:bg-white/5 border border-current/10 px-3 py-2">
                <p className="text-gray-500 dark:text-white/60 mb-0.5">Invoice Amount</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(match.invoiceAmount ?? invoice.invoiceAmount)}</p>
              </div>
              <div className="rounded-lg bg-white/70 dark:bg-white/5 border border-current/10 px-3 py-2">
                <p className="text-gray-500 dark:text-white/60 mb-0.5">PO Amount</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(match.poAmount)}</p>
              </div>
              <div className="rounded-lg bg-white/70 dark:bg-white/5 border border-current/10 px-3 py-2">
                <p className="text-gray-500 dark:text-white/60 mb-0.5">GRN Accepted Amount</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(match.grnAcceptedAmount)}</p>
              </div>
            </div>
          </div>

          {/* Side-by-side comparison table */}
          {(match.lineComparisons ?? match.items)?.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-white/10 text-sm">
                <thead className="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-white/60 uppercase tracking-wide">Product</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-white/60 uppercase tracking-wide">Invoice Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-white/60 uppercase tracking-wide">PO Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-white/60 uppercase tracking-wide">GRN Accepted Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-white/60 uppercase tracking-wide">Invoice Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-white/60 uppercase tracking-wide">PO Price</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-white/60 uppercase tracking-wide">Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/10 bg-white dark:bg-transparent">
                  {(match.lineComparisons ?? match.items).map((line, idx) => {
                    const qtyMatch  = line.invoiceQty  === line.poQty  && line.invoiceQty  === line.grnQty
                    const priceMatch = !line.invoicePrice || !line.poPrice || Math.abs(line.invoicePrice - line.poPrice) < 0.01
                    const rowOk = line.matched ?? (qtyMatch && priceMatch)
                    return (
                      <tr key={idx} className={rowOk ? 'bg-white dark:bg-transparent' : 'bg-red-50 dark:bg-red-900/20'}>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{line.productName ?? '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{line.invoiceQty ?? '—'}</td>
                        <td className={`px-4 py-3 text-right tabular-nums ${line.invoiceQty !== line.poQty ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>{line.poQty ?? '—'}</td>
                        <td className={`px-4 py-3 text-right tabular-nums ${line.invoiceQty !== line.grnQty ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>{line.grnQty ?? '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(line.invoicePrice)}</td>
                        <td className={`px-4 py-3 text-right tabular-nums ${!priceMatch ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>{formatCurrency(line.poPrice)}</td>
                        <td className="px-4 py-3 text-center">
                          {rowOk
                            ? <CheckCircle size={15} className="text-green-500 dark:text-green-400 mx-auto" />
                            : <XCircle    size={15} className="text-red-500 dark:text-red-400 mx-auto" />
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Flag list (when no line comparisons but flags present) */}
          {!(match.lineComparisons ?? match.items)?.length && match.flags?.length > 0 && (
            <div className="space-y-2 mt-2">
              {match.flags.map((flag, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-500/30 p-3 text-sm">
                  <XCircle size={15} className="text-orange-500 dark:text-orange-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-orange-700 dark:text-orange-300">{flag.productName} — {flag.flagType?.replace(/_/g, ' ')}</p>
                    <p className="text-orange-600 dark:text-orange-400">{flag.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section 4 — Status History */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-3">Status History</h2>
        <Table columns={HISTORY_COLS} empty={history.length === 0} emptyMessage="No history.">
          {history.map((h, i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5">
              <Table.Td>{h.fromStatus ? <Badge status={h.fromStatus} /> : <span className="text-gray-300 dark:text-white/20">—</span>}</Table.Td>
              <Table.Td><Badge status={h.toStatus} /></Table.Td>
              <Table.Td className="font-mono text-xs text-gray-400 dark:text-white/40">{h.changedBy?.slice(-8).toUpperCase()}</Table.Td>
              <Table.Td>{formatDateTime(h.changedAt)}</Table.Td>
              <Table.Td className="text-gray-500 dark:text-white/60">{h.remarks || '—'}</Table.Td>
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
