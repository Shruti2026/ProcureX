import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { inventoryService } from '../../services/inventoryService'
import { formatDate } from '../../utils/formatters'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

// ─── Column definitions ───────────────────────────────────────────────────────
const COLUMNS = [
  { label: 'Product ID',      key: 'productId' },
  { label: 'Warehouse',       key: 'warehouse' },
  { label: 'Qty On Hand',     key: 'quantityOnHand' },
  { label: 'Reserved Qty',    key: 'reservedQuantity' },
  { label: 'Unit of Measure', key: 'unitOfMeasure' },
  { label: 'Last Updated',    key: 'lastUpdated' },
]

const PAGE_SIZE = 20

export default function StockPage() {
  const [page, setPage] = useState(0)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['stock', page],
    queryFn: async () => {
      const res = await inventoryService.getStock({ page, size: PAGE_SIZE })
      return res.data.data          // { content: [], totalPages: n, totalElements: n, ... }
    },
    keepPreviousData: true,
    staleTime: 30_000,
  })

  const rows       = data?.content    ?? []
  const totalPages = data?.totalPages ?? 1

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Levels</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
          Current inventory levels by product and warehouse.
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
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Failed to load stock records</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-white/40">{error?.message ?? 'Unknown error'}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500 dark:text-white/60">No stock records found.</p>
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
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono whitespace-nowrap">
                      {row.productId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-white/60 whitespace-nowrap">
                      {row.warehouseName ?? row.warehouse ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white tabular-nums whitespace-nowrap">
                      {row.quantityOnHand != null ? row.quantityOnHand : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-white/60 tabular-nums whitespace-nowrap">
                      {row.reservedQuantity ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-white/60 whitespace-nowrap">
                      {row.unitOfMeasure ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-white/60 whitespace-nowrap">
                      {formatDate(row.updatedAt ?? row.createdAt)}
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
