import { useState, useEffect, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'

import { purchaseOrderService } from '../../services/purchaseOrderService'
import { invoiceService } from '../../services/invoiceService'
import { formatCurrency, formatDate } from '../../utils/formatters'

import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Input from '../../components/ui/Input'

// ---------------------------------------------------------------------------
// InvoiceUploadModal
// ---------------------------------------------------------------------------
function InvoiceUploadModal({ po, onClose, onSuccess }) {
  const [fetchLoading, setFetchLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { items: [] } })

  const { fields, replace } = useFieldArray({ control, name: 'items' })

  // Fetch full PO (with line items) on mount
  useEffect(() => {
    let cancelled = false
    setFetchLoading(true)
    setFetchError(null)

    purchaseOrderService
      .getPOById(po.id)
      .then((res) => {
        if (cancelled) return
        const fullPO = res.data?.data ?? res.data
        const lineItems = fullPO?.items ?? fullPO?.lineItems ?? []
        replace(
          lineItems.map((item) => ({
            productId: item.productId ?? item.id ?? '',
            productName: item.productName ?? '',
            quantity: item.quantity ?? 1,
            unitPrice: item.unitPrice ?? 0,
          }))
        )
      })
      .catch((err) => {
        if (cancelled) return
        setFetchError(
          err?.response?.data?.message || 'Failed to load PO line items.'
        )
      })
      .finally(() => {
        if (!cancelled) setFetchLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [po.id, replace])

  const onSubmit = async () => {
    const payload = {
      purchaseOrderId: po.id,
      items: fields.map((field, i) => ({
        productId: field.productId,
        productName: field.productName,
        quantity: Number(getValues(`items.${i}.quantity`)),
        unitPrice: Number(getValues(`items.${i}.unitPrice`)),
      })),
    }

    try {
      await invoiceService.submitInvoice(payload)
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 space-y-5">
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

        {/* Loading state */}
        {fetchLoading && (
          <div className="flex items-center justify-center py-10">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error state */}
        {!fetchLoading && fetchError && (
          <div className="space-y-4">
            <p className="text-sm text-red-600">{fetchError}</p>
            <div className="flex justify-end">
              <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}

        {/* Line-item form */}
        {!fetchLoading && !fetchError && (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {fields.length === 0 ? (
              <p className="text-sm text-gray-500">No line items found for this PO.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/2">
                        Product
                      </th>
                      <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Quantity
                      </th>
                      <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Unit Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {fields.map((field, index) => (
                      <tr key={field.id} className="align-top">
                        {/* Hidden fields for productId and productName */}
                        <input
                          type="hidden"
                          {...register(`items.${index}.productId`)}
                        />
                        <input
                          type="hidden"
                          {...register(`items.${index}.productName`)}
                        />

                        {/* Product name — read-only label */}
                        <td className="py-3 pr-4 text-gray-800 font-medium">
                          {field.productName || '—'}
                        </td>

                        {/* Quantity */}
                        <td className="py-3 pr-4">
                          <Input
                            id={`items.${index}.quantity`}
                            type="number"
                            min="1"
                            step="1"
                            error={errors.items?.[index]?.quantity?.message}
                            {...register(`items.${index}.quantity`, {
                              required: 'Required',
                              min: { value: 1, message: 'Must be > 0' },
                              valueAsNumber: true,
                            })}
                          />
                        </td>

                        {/* Unit Price */}
                        <td className="py-3">
                          <Input
                            id={`items.${index}.unitPrice`}
                            type="number"
                            min="0"
                            step="0.01"
                            error={errors.items?.[index]?.unitPrice?.message}
                            {...register(`items.${index}.unitPrice`, {
                              required: 'Required',
                              min: { value: 0, message: 'Must be >= 0' },
                              valueAsNumber: true,
                            })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

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
              <Button
                type="submit"
                size="sm"
                loading={isSubmitting}
                disabled={fields.length === 0}
              >
                Submit Invoice
              </Button>
            </div>
          </form>
        )}
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
