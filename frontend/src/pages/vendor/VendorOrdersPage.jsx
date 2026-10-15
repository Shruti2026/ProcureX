import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { purchaseOrderService } from '../../services/purchaseOrderService'
import api from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/formatters'

import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Input from '../../components/ui/Input'

// ---------------------------------------------------------------------------
// InvoiceUploadModal
// ---------------------------------------------------------------------------
function InvoiceUploadModal({ po, onClose, onSuccess }) {
  const todayISO = new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      invoiceNumber: '',
      invoiceDate: todayISO,
      totalAmount: '',
    },
  })

  const onSubmit = async (values) => {
    try {
      await api.post('/api/v1/finance/invoices', {
        purchaseOrderId: po.id,
        invoiceNumber: values.invoiceNumber,
        invoiceDate: values.invoiceDate,
        totalAmount: Number(values.totalAmount),
      })
      toast.success('Invoice submitted successfully')
      onSuccess()
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Failed to submit invoice'
      toast.error(message)
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
        {/* Header */}
        <div>
          <h2
            id="invoice-modal-title"
            className="text-lg font-semibold text-gray-900"
          >
            Upload Invoice
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            PO {po.poNumber} &mdash; {formatCurrency(po.totalAmount)}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input
            label="Invoice Number"
            id="invoiceNumber"
            error={errors.invoiceNumber?.message}
            {...register('invoiceNumber', {
              required: 'Invoice number is required',
            })}
          />

          <Input
            label="Invoice Date"
            id="invoiceDate"
            type="date"
            error={errors.invoiceDate?.message}
            {...register('invoiceDate', {
              required: 'Invoice date is required',
            })}
          />

          <Input
            label="Total Amount"
            id="totalAmount"
            type="number"
            min="0"
            step="0.01"
            error={errors.totalAmount?.message}
            {...register('totalAmount', {
              required: 'Total amount is required',
              min: { value: 0, message: 'Amount must be positive' },
            })}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={isSubmitting}>
              Submit Invoice
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// VendorOrdersPage
// ---------------------------------------------------------------------------
export default function VendorOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null) // tracks po.id under action
  const [invoiceModalPO, setInvoiceModalPO] = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const response = await purchaseOrderService.getPOs({ page: 0, size: 20 })
      const payload = response.data.data
      // API may return a Page object or a plain array
      setOrders(Array.isArray(payload) ? payload : (payload?.content ?? []))
    } catch (err) {
      toast.error('Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Accept
  const handleAccept = async (po) => {
    const confirmed = window.confirm('Accept this PO?')
    if (!confirmed) return
    setActionLoading(po.id)
    try {
      await purchaseOrderService.acceptPO(po.id)
      toast.success(`PO ${po.poNumber} accepted`)
      await fetchOrders()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to accept PO')
    } finally {
      setActionLoading(null)
    }
  }

  // Decline
  const handleDecline = async (po) => {
    const reason = window.prompt('Reason for decline:')
    if (reason === null) return // user cancelled
    setActionLoading(po.id)
    try {
      await purchaseOrderService.declinePO(po.id, reason)
      toast.success(`PO ${po.poNumber} declined`)
      await fetchOrders()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to decline PO')
    } finally {
      setActionLoading(null)
    }
  }

  // Invoice modal success
  const handleInvoiceSuccess = async () => {
    setInvoiceModalPO(null)
    await fetchOrders()
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review, accept or decline incoming orders and submit invoices for fulfilled deliveries.
        </p>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-[var(--color-surface-border)] shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500">No purchase orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['PO Number', 'Total Amount', 'Status', 'Expected Delivery', 'Actions'].map(
                    (col) => (
                      <th
                        key={col}
                        scope="col"
                        className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {orders.map((po) => {
                  const isActing = actionLoading === po.id
                  return (
                    <tr key={po.id} className="hover:bg-gray-50 transition-colors duration-100">
                      {/* PO Number */}
                      <td className="px-5 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {po.poNumber ?? '—'}
                      </td>

                      {/* Total Amount */}
                      <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {formatCurrency(po.totalAmount)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge status={po.status} label={po.status?.replace(/_/g, ' ')} />
                      </td>

                      {/* Expected Delivery */}
                      <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {formatDate(po.expectedDeliveryDate)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {po.status === 'SENT_TO_VENDOR' && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              loading={isActing}
                              onClick={() => handleAccept(po)}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              loading={isActing}
                              onClick={() => handleDecline(po)}
                            >
                              Decline
                            </Button>
                          </div>
                        )}

                        {po.status === 'ACCEPTED' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setInvoiceModalPO(po)}
                          >
                            Upload Invoice
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice upload modal */}
      {invoiceModalPO && (
        <InvoiceUploadModal
          po={invoiceModalPO}
          onClose={() => setInvoiceModalPO(null)}
          onSuccess={handleInvoiceSuccess}
        />
      )}
    </div>
  )
}
