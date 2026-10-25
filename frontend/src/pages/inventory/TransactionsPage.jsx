import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { inventoryService } from '../../services/inventoryService'
import { formatDate } from '../../utils/formatters'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

// ─── Transaction type badge styling ──────────────────────────────────────────
const TYPE_CLASSES = {
  INCOMING: 'text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs font-medium',
  OUTGOING: 'text-red-700 bg-red-50 px-2 py-0.5 rounded text-xs font-medium',
  RESERVED: 'text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded text-xs font-medium',
  DAMAGED:  'text-orange-700 bg-orange-50 px-2 py-0.5 rounded text-xs font-medium',
  ADJUSTED: 'text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium',
}

function TransactionTypeBadge({ type }) {
  const cls = TYPE_CLASSES[type] ?? 'text-gray-700 bg-gray-100 dark:bg-white/10 dark:text-white/70 px-2 py-0.5 rounded text-xs font-medium'
  return <span className={cls}>{type}</span>
}

// ─── Column header ────────────────────────────────────────────────────────────
const COLUMNS = [
  { label: 'Date',             key: 'date' },
  { label: 'Product ID',       key: 'productId' },
  { label: 'Warehouse',        key: 'warehouse' },
  { label: 'Transaction Type', key: 'transactionType' },
  { label: 'Quantity',         key: 'quantity' },
  { label: 'Reference',        key: 'reference' },
  { label: 'Performed By',     key: 'performedBy' },
]

const PAGE_SIZE = 20

export default function TransactionsPage() {
  const [page, setPage] = useState(0)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['stock-transactions', page],
    queryFn: async () => {
      const res = await inventoryService.getStockTransactions({ page, size: PAGE_SIZE })
      return res.data.data          // { content: [], totalPages: n, totalElements: n, ... }
    },
    keepPreviousData: true,
    staleTime: 30_000,
  })

  const rows       = data?.content      ?? []
  const totalPages = data?.totalPages   ?? 1

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function handlePrev() {
    setPage((p) => Math.max(0, p - 1))
  }

  function handleNext() {
    setPage((p) => Math.min(totalPages - 1, p + 1))
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Transactions</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
          Audit material movements, stock transfers, adjustments, and write-offs.
        </p>
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-white/5 dark:backdrop-blur-sm rounded-xl border border-[var(--color-surface-border)] dark:border-white/10 shadow-xs overflow-hidden">

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="py-16 text-center">
            <p className="text-sm text-red-600 font-medium">Failed to load transactions</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-white/40">{error?.message ?? 'Unknown error'}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500 dark:text-white/60">No transactions found.</p>
          </div>
        )}

        {/* Data table */}
        {!isLoading && !isError && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-white/10">
              <thead className="bg-gray-50 dark:bg-white/5">
                <tr>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-white/60 uppercase tracking-wide whitespace-nowrap"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/10">
                {rows.map((row, idx) => (
                  <tr
                    key={row.id ?? idx}
                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-75"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-white/60 whitespace-nowrap">
                      {formatDate(row.transactionDate ?? row.createdAt ?? row.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono whitespace-nowrap">
                      {row.productId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-white/60 whitespace-nowrap">
                      {row.warehouseName ?? row.warehouse ?? '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <TransactionTypeBadge type={row.transactionType ?? row.type} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white tabular-nums whitespace-nowrap">
                      {row.quantity != null ? row.quantity : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-white/60 whitespace-nowrap">
                      {row.referenceNumber ?? row.reference ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-white/60 whitespace-nowrap">
                      {row.performedBy ?? row.createdBy ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer — always visible once data arrives */}
        {!isLoading && !isError && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
            <p className="text-xs text-gray-500 dark:text-white/60">
              Page <span className="font-semibold text-gray-700 dark:text-white">{page + 1}</span> of{' '}
              <span className="font-semibold text-gray-700 dark:text-white">{Math.max(totalPages, 1)}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrev}
                disabled={page === 0}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNext}
                disabled={page >= totalPages - 1}
                aria-label="Next page"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
