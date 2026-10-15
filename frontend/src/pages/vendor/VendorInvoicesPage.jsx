import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

import { invoiceService } from '../../services/invoiceService'
import { formatCurrency, formatDate } from '../../utils/formatters'

import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Show first 8 chars of a UUID-like id, uppercased */
function shortId(id) {
  if (!id) return '—'
  return id.length > 8 ? id.slice(0, 8).toUpperCase() : id.toUpperCase()
}

// ---------------------------------------------------------------------------
// VendorInvoicesPage
// ---------------------------------------------------------------------------
export default function VendorInvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const PAGE_SIZE = 20

  const fetchInvoices = useCallback(async (pageIndex) => {
    setLoading(true)
    try {
      const response = await invoiceService.getInvoices({ page: pageIndex, size: PAGE_SIZE })
      const payload = response.data.data
      if (payload && typeof payload === 'object' && 'content' in payload) {
        setInvoices(payload.content ?? [])
        setTotalPages(payload.totalPages ?? 1)
      } else {
        setInvoices(Array.isArray(payload) ? payload : [])
        setTotalPages(1)
      }
    } catch {
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvoices(page)
  }, [fetchInvoices, page])

  const handlePrev = () => {
    if (page > 0) setPage((p) => p - 1)
  }

  const handleNext = () => {
    if (page < totalPages - 1) setPage((p) => p + 1)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track submitted invoices and monitor their verification and payment status.
        </p>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-[var(--color-surface-border)] shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500">No invoices found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    'Invoice Number',
                    'PO ID',
                    'Amount',
                    'Status',
                    'Submitted Date',
                    'Payment Status',
                  ].map((col) => (
                    <th
                      key={col}
                      scope="col"
                      className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 transition-colors duration-100"
                  >
                    {/* Invoice Number */}
                    <td className="px-5 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {invoice.invoiceNumber ?? '—'}
                    </td>

                    {/* PO ID (first 8 chars) */}
                    <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap font-mono">
                      {shortId(invoice.purchaseOrderId)}
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {formatCurrency(invoice.totalAmount)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge
                        status={invoice.status}
                        label={invoice.status?.replace(/_/g, ' ')}
                      />
                    </td>

                    {/* Submitted Date */}
                    <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {formatDate(invoice.submittedAt ?? invoice.invoiceDate)}
                    </td>

                    {/* Payment Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {invoice.paymentStatus ? (
                        <Badge
                          status={invoice.paymentStatus}
                          label={invoice.paymentStatus.replace(/_/g, ' ')}
                        />
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrev}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleNext}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
