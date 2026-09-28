import clsx from 'clsx'
import Spinner from './Spinner'

/**
 * Reusable table shell.
 *
 * Usage:
 *   <Table columns={['Name', 'Status', 'Date']} loading={isLoading} empty={data.length === 0}>
 *     {data.map((row, i) => (
 *       <tr
 *         key={row.id}
 *         className="hover:bg-gray-50 transition-colors duration-100 animate-fade-slide-up"
 *         style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
 *       >
 *         <Table.Td>{row.name}</Table.Td>
 *         <Table.Td><Badge status={row.status} /></Table.Td>
 *         <Table.Td>{formatDate(row.createdAt)}</Table.Td>
 *       </tr>
 *     ))}
 *   </Table>
 *
 * Stagger delay pattern — define once above your component:
 *   const reducedMotion =
 *     typeof window !== 'undefined' &&
 *     window.matchMedia('(prefers-reduced-motion: reduce)').matches
 */
export default function Table({
  columns = [],
  children,
  loading = false,
  empty = false,
  emptyMessage = 'No records found.',
  className,
}) {
  return (
    <div className={clsx('overflow-x-auto rounded-xl border border-gray-200', className)}>
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center">
                <div className="flex justify-center">
                  <Spinner size="lg" className="text-primary-500" />
                </div>
              </td>
            </tr>
          ) : empty ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  )
}

/** Convenience sub-component for table cells */
Table.Td = function Td({ children, className }) {
  return (
    <td className={clsx('px-4 py-3 text-gray-700 whitespace-nowrap', className)}>
      {children}
    </td>
  )
}
