import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle2 } from 'lucide-react'

import { quotationService } from '../../services/quotationService'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import { formatCurrency, formatDate, shortId } from '../../utils/formatters'

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const TABLE_COLUMNS = [
  'Quotation No.',
  'RFQ ID',
  'Total Amount',
  'Lead Time',
  'Status',
  'Submitted Date',
]

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ─────────────────────────────────────────
   VendorQuotationsPage
───────────────────────────────────────── */
export default function VendorQuotationsPage() {
  const [quotations, setQuotations] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const fetchQuotations = async () => {
      setLoading(true)
      try {
        const res = await quotationService.getMyQuotations({ page, size: 20 })
        const payload = res.data?.data ?? res.data
        if (!cancelled) {
          setQuotations(payload?.content ?? (Array.isArray(payload) ? payload : []))
          setTotalPages(payload?.totalPages ?? 1)
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.response?.data?.message || 'Failed to load quotations')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchQuotations()
    return () => {
      cancelled = true
    }
  }, [page])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Quotations</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
          Track the status of quotations you have submitted against open RFQs.
        </p>
      </div>

      {/* Table */}
      <Table
        columns={TABLE_COLUMNS}
        loading={loading}
        empty={!loading && quotations.length === 0}
        emptyMessage="You have not submitted any quotations yet."
      >
        {quotations.map((row, i) => (
          <tr
            key={row.id}
            className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-100 animate-fade-slide-up"
            style={{ animationDelay: reducedMotion ? '0ms' : `${i * 40}ms` }}
          >
            {/* Quotation Number */}
            <Table.Td className="font-mono text-xs text-gray-500 dark:text-white/60">
              {row.quotationNumber ?? shortId(row.id)}
            </Table.Td>

            {/* RFQ ID */}
            <Table.Td className="font-mono text-xs text-gray-500 dark:text-white/60">
              {shortId(row.rfqId)}
            </Table.Td>

            {/* Total Amount */}
            <Table.Td className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(row.totalAmount)}
            </Table.Td>

            {/* Lead Time */}
            <Table.Td className="text-gray-700 dark:text-white/80">
              {row.leadTimeDays != null ? `${row.leadTimeDays} days` : '—'}
            </Table.Td>

            {/* Status + Won indicator */}
            <Table.Td>
              <div className="flex items-center gap-2">
                <Badge status={row.status} />
                {row.status === 'SELECTED' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400">
                    <CheckCircle2 size={13} className="text-green-600 dark:text-green-400" />
                    Won
                  </span>
                )}
              </div>
            </Table.Td>

            {/* Submitted Date */}
            <Table.Td className="text-gray-600 dark:text-white/60">
              {formatDate(row.submittedAt ?? row.createdAt)}
            </Table.Td>
          </tr>
        ))}
      </Table>

      {/* Pagination */}
      {!loading && quotations.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />
      )}
    </div>
  )
}
