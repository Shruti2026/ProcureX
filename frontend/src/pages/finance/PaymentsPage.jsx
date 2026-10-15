import { useState, useEffect } from 'react'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import { formatDate, formatDateTime, formatCurrency } from '../../utils/formatters'
import { paymentService } from '../../services/paymentService'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const COLUMNS = ['Transaction Ref', 'Invoice ID', 'Amount', 'Method', 'Status', 'Initiated', 'Completed']

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => { loadPayments() }, [page])

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="mt-1 text-sm text-gray-500">
          View all vendor disbursements and payment history.
        </p>
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
            className="hover:bg-gray-50 transition-colors duration-100 animate-fade-slide-up"
            style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
          >
            <Table.Td className="font-mono text-xs">{p.transactionReference}</Table.Td>
            <Table.Td className="font-mono text-xs text-gray-400">{p.invoiceId?.slice(-12).toUpperCase()}</Table.Td>
            <Table.Td className="font-medium">{formatCurrency(p.amount)}</Table.Td>
            <Table.Td>{p.paymentMethod}</Table.Td>
            <Table.Td><Badge status={p.status} /></Table.Td>
            <Table.Td>{formatDateTime(p.initiatedAt)}</Table.Td>
            <Table.Td>{p.completedAt ? formatDateTime(p.completedAt) : '—'}</Table.Td>
          </tr>
        ))}
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >Previous</button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
