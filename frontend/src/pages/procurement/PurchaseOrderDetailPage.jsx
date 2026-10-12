import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle, XCircle, ArrowRight } from 'lucide-react'

import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import Spinner from '../../components/ui/Spinner'
import { formatDate, formatDateTime, formatCurrency } from '../../utils/formatters'
import { purchaseOrderService } from '../../services/purchaseOrderService'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

const LINE_ITEMS_COLUMNS = ['Product Name', 'Quantity', 'Unit Price', 'Total Price']
const HISTORY_COLUMNS    = ['From', 'To', 'Changed By', 'Date', 'Remarks']

export default function PurchaseOrderDetailPage() {
  const { poId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const [actionLoading, setActionLoading] = useState(null)

  const { data: po, isLoading, isError } = useQuery({
    queryKey: ['purchase-order', poId],
    queryFn: () => purchaseOrderService.getPOById(poId).then((res) => res.data?.data),
    retry: (failCount, err) => {
      if (err?.response?.status === 404) return false
      return failCount < 2
    },
  })

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" className="text-primary-500" />
      </div>
    )
  }

  /* ── Error / not found ── */
  if (isError || !po) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/procurement/orders')}
        >
          <ArrowLeft size={15} />
          Back to Purchase Orders
        </Button>
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">Purchase order not found.</p>
        </div>
      </div>
    )
  }

  const isProcurementManager =
    user?.role === ROLES.PROCUREMENT_MANAGER || user?.role === ROLES.ADMIN

  const handleApprove = async () => {
    setActionLoading('approve')
    try {
      await purchaseOrderService.approvePO(poId)
      toast.success('Purchase order approved')
      queryClient.invalidateQueries({ queryKey: ['purchase-order', poId] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve purchase order')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async () => {
    if (
      !window.confirm(
        `Cancel purchase order ${po.poNumber ?? po.id?.slice(-8).toUpperCase()}? This cannot be undone.`
      )
    ) return
    setActionLoading('cancel')
    try {
      await purchaseOrderService.cancelPO(poId)
      toast.success('Purchase order cancelled')
      queryClient.invalidateQueries({ queryKey: ['purchase-order', poId] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel purchase order')
    } finally {
      setActionLoading(null)
    }
  }

  const items   = po.items   ?? po.lineItems   ?? []
  const history = po.statusHistory ?? po.history ?? []

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/procurement/orders')}
      >
        <ArrowLeft size={15} />
        Back to Purchase Orders
      </Button>

      {/* PO Header card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                {po.poNumber ?? po.id?.slice(-8).toUpperCase()}
              </span>
              <Badge status={po.status} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              {po.vendorName ?? po.vendor?.companyName ?? 'Purchase Order'}
            </h1>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-100 pt-5">
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Order Date</dt>
            <dd className="mt-1 text-sm font-medium text-gray-800">
              {formatDate(po.orderDate ?? po.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Expected Delivery</dt>
            <dd className="mt-1 text-sm font-medium text-gray-800">
              {formatDate(po.expectedDeliveryDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Total Amount</dt>
            <dd className="mt-1 text-sm font-medium text-gray-800">
              {formatCurrency(po.totalAmount)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Line Items</dt>
            <dd className="mt-1 text-sm font-medium text-gray-800">{items.length}</dd>
          </div>
        </dl>
      </div>

      {/* Line Items table */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Line Items</h2>
        <Table
          columns={LINE_ITEMS_COLUMNS}
          empty={items.length === 0}
          emptyMessage="No line items on this purchase order."
        >
          {items.map((item, i) => (
            <tr key={item.id ?? i} className="hover:bg-gray-50 transition-colors duration-100">
              <Table.Td className="font-medium text-gray-900">
                {item.productName ?? item.product?.name ?? '—'}
              </Table.Td>
              <Table.Td>{item.quantity ?? '—'}</Table.Td>
              <Table.Td>{formatCurrency(item.unitPrice)}</Table.Td>
              <Table.Td>{formatCurrency(item.totalPrice ?? (item.unitPrice * item.quantity))}</Table.Td>
            </tr>
          ))}
        </Table>
      </div>

      {/* Status History timeline */}
      {history.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Status History</h2>
          <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
            {history.map((entry, i) => (
              <div key={entry.id ?? i} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800 min-w-0">
                  <span className="text-gray-500">{entry.fromStatus ?? '—'}</span>
                  <ArrowRight size={14} className="text-gray-400 shrink-0" />
                  <span>{entry.toStatus ?? '—'}</span>
                </div>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500">
                  <span>{entry.changedBy ?? '—'}</span>
                  <span>{formatDateTime(entry.changedAt)}</span>
                  {entry.remarks && (
                    <span className="italic text-gray-400">{entry.remarks}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {(
        (po.status === 'CREATED' && isProcurementManager) ||
        (po.status === 'CREATED' || po.status === 'APPROVED')
      ) && (
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          {po.status === 'CREATED' && isProcurementManager && (
            <Button
              variant="primary"
              loading={actionLoading === 'approve'}
              onClick={handleApprove}
            >
              <CheckCircle size={15} />
              Approve PO
            </Button>
          )}
          {(po.status === 'CREATED' || po.status === 'APPROVED') && (
            <Button
              variant="danger"
              loading={actionLoading === 'cancel'}
              onClick={handleCancel}
            >
              <XCircle size={15} />
              Cancel PO
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
