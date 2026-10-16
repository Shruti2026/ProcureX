import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

/**
 * Shared Pagination component.
 *
 * Props:
 *   currentPage   {number}   0-indexed current page
 *   totalPages    {number}   total number of pages
 *   totalElements {number}   (optional) total record count for "Showing X–Y of Z" label
 *   pageSize      {number}   (optional, default 20) records per page
 *   onPageChange  {fn}       called with the new 0-indexed page number
 *   className     {string}   (optional) extra classes on the wrapper
 */
export default function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize = 20,
  onPageChange,
  className,
}) {
  if (!totalPages || totalPages <= 1) return null

  const isFirst = currentPage === 0
  const isLast  = currentPage >= totalPages - 1

  // "Showing X–Y of Z" label when totalElements is provided
  let rangeLabel = `Page ${currentPage + 1} of ${totalPages}`
  if (totalElements != null) {
    const from = currentPage * pageSize + 1
    const to   = Math.min((currentPage + 1) * pageSize, totalElements)
    rangeLabel = `Showing ${from}–${to} of ${totalElements}`
  }

  // Build a compact page number window (at most 5 buttons)
  const windowSize  = Math.min(totalPages, 5)
  const startOffset = Math.max(0, Math.min(currentPage - 2, totalPages - windowSize))
  const pageNumbers = Array.from({ length: windowSize }, (_, i) => startOffset + i)

  return (
    <div className={clsx('flex items-center justify-between px-1', className)}>
      <p className="text-sm text-gray-500">{rangeLabel}</p>

      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirst}
          aria-label="Previous page"
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg
                     text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors duration-100"
        >
          <ChevronLeft size={14} />
          Prev
        </button>

        {/* Page numbers */}
        {pageNumbers.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p + 1}`}
            aria-current={p === currentPage ? 'page' : undefined}
            className={clsx(
              'w-8 h-8 text-sm rounded-lg border transition-colors duration-100',
              p === currentPage
                ? 'bg-primary-600 border-primary-600 text-white font-semibold'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {p + 1}
          </button>
        ))}

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLast}
          aria-label="Next page"
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg
                     text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors duration-100"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
