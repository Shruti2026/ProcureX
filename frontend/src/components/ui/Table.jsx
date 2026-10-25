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
 *         className="hover:bg-primary-50/50 transition-colors duration-150 animate-fade-slide-up"
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
    <div className={clsx('overflow-x-auto rounded-xl border border-primary-100 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-sm', className)}>
      <table className="min-w-full divide-y divide-primary-100 dark:divide-white/10 text-sm">
        <thead className="bg-primary-50 dark:bg-white/5">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-primary-700 dark:text-white/60 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-primary-50 dark:bg-transparent dark:divide-white/10">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center">
                <div className="flex justify-center">
                  <Spinner size="lg" />
                </div>
              </td>
            </tr>
          ) : empty ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-gray-400 dark:text-white/40"
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

Table.Td = function Td({ children, className }) {
  return (
    <td className={clsx('px-4 py-3 text-gray-700 whitespace-nowrap dark:text-white', className)}>
      {children}
    </td>
  )
}
