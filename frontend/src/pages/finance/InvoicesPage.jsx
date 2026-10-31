import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import { formatDate, formatCurrency } from '../../utils/formatters'
import { invoiceService } from '../../services/invoiceService'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const STATUS_TABS = [
  { label: 'All', value: null },
  { label: 'Pending', value: 'PENDING_VERIFICATION' },
  { label: 'Verified', value: 'VERIFIED' },
  { label: 'Flagged', value: 'FLAGGED_VARIANCE' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Rejected', value: 'REJECTED' },
]

const COLUMNS = ['Invoice Number', 'Vendor', 'Amount', 'Status', 'Submitted', 'Verified', 'Approved']

export default function InvoicesPage() {
  const navigate = useNavigate()
  const [activeStatus, setActiveStatus] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    loadInvoices()
  }, [activeStatus, page])

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const params = { page, size: 20 }
      if (activeStatus) params.status = activeStatus
      const res = await invoiceService.getInvoices(params)
      const data = res.data?.data
      setInvoices(data?.content ?? [])
      setTotalPages(data?.totalPages ?? 0)
    } catch {
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (status) => {
    setActiveStatus(status)
    setPage(0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
          Process vendor invoices, run three-way matching, and approve for payment.
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-white/10">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-100 ${
              activeStatus === tab.value
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 dark:text-white/60 hover:text-gray-700 dark:hover:text-white/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Table
        columns={COLUMNS}
        loading={loading}
        empty={!loading && invoices.length === 0}
        emptyMessage="No invoices found."
      >
        {invoices.map((inv, i) => (
          <tr
            key={inv.invoiceId}
            className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-100 animate-fade-slide-up cursor-pointer"
            style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
            onClick={() => navigate(`/finance/invoices/${inv.invoiceId}`)}
          >
            <Table.Td className="font-medium text-gray-900 dark:text-white">{inv.invoiceNumber}</Table.Td>
            <Table.Td className="text-gray-600 dark:text-white/60 text-sm">
              {inv.vendorName && inv.vendorName.trim()
                ? inv.vendorName
                : inv.vendorId?.slice(-8).toUpperCase()}
            </Table.Td>
            <Table.Td className="font-medium">{formatCurrency(inv.invoiceAmount)}</Table.Td>
            <Table.Td><Badge status={inv.status} /></Table.Td>
            <Table.Td>{formatDate(inv.submittedAt)}</Table.Td>
            <Table.Td>{formatDate(inv.verifiedAt)}</Table.Td>
            <Table.Td>{formatDate(inv.approvedAt)}</Table.Td>
          </tr>
        ))}
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />
      )}
    </div>
  )
}
