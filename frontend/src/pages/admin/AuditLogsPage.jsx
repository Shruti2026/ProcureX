import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X,
  ClipboardList, RotateCcw,
} from 'lucide-react'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import { getAuditLogs } from '../../services/auditLogService'

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const PAGE_SIZE = 20

const ALL_ACTIONS = [
  { value: 'LOGIN',              label: 'Login' },
  { value: 'LOGOUT',             label: 'Logout' },
  { value: 'VENDOR_REGISTER',    label: 'Vendor Register' },
  { value: 'CREATE_EMPLOYEE',    label: 'Create Employee' },
  { value: 'APPROVE_VENDOR',     label: 'Approve Vendor' },
  { value: 'REJECT_VENDOR',      label: 'Reject Vendor' },
  { value: 'UPDATE_USER_STATUS', label: 'Update User Status' },
  { value: 'SOFT_DELETE_USER',   label: 'Delete User' },
  { value: 'VENDOR_SELF_DELETE', label: 'Vendor Self-Delete' },
  { value: 'CHANGE_PASSWORD',    label: 'Change Password' },
]

/** Action → color token */
const ACTION_COLORS = {
  LOGIN:              'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700/50',
  LOGOUT:             'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-700/30 dark:text-slate-300 dark:ring-slate-600/50',
  VENDOR_REGISTER:    'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:ring-violet-700/50',
  CREATE_EMPLOYEE:    'bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-700/50',
  APPROVE_VENDOR:     'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:ring-teal-700/50',
  REJECT_VENDOR:      'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-700/50',
  UPDATE_USER_STATUS: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700/50',
  SOFT_DELETE_USER:   'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-700/50',
  VENDOR_SELF_DELETE: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:ring-orange-700/50',
  CHANGE_PASSWORD:    'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-700/50',
}

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function formatTimestamp(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
}

function relativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)  return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const day = Math.floor(h / 24)
  return `${day}d ago`
}

function actionLabel(action) {
  return ALL_ACTIONS.find(a => a.value === action)?.label ?? action?.replace(/_/g, ' ') ?? '—'
}

/** Safely pretty-print JSON string; falls back to raw string */
function prettyJson(raw) {
  if (!raw) return null
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

/* ─────────────────────────────────────────
   ActionBadge
───────────────────────────────────────── */
function ActionBadge({ action }) {
  const colorClass = ACTION_COLORS[action] ?? 'bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-700/30 dark:text-gray-300 dark:ring-gray-600/50'
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${colorClass}`}
    >
      {actionLabel(action)}
    </span>
  )
}

/* ─────────────────────────────────────────
   SkeletonRow — shown while loading
───────────────────────────────────────── */
function SkeletonRow({ index }) {
  return (
    <tr
      className="animate-pulse"
      style={{ animationDelay: reducedMotion ? '0ms' : `${index * 40}ms` }}
    >
      {[120, 180, 100, 140, 100].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-3 rounded bg-gray-200 dark:bg-white/10"
            style={{ width: `${w}px` }}
          />
        </td>
      ))}
    </tr>
  )
}

/* ─────────────────────────────────────────
   DiffPanel — expandable old/new JSON diff
───────────────────────────────────────── */
function DiffPanel({ oldValue, newValue, open }) {
  const ref = useRef(null)
  const old = prettyJson(oldValue)
  const next = prettyJson(newValue)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open) {
      el.style.height = el.scrollHeight + 'px'
      const onEnd = () => { el.style.height = 'auto' }
      el.addEventListener('transitionend', onEnd, { once: true })
    } else {
      el.style.height = el.scrollHeight + 'px'
      el.getBoundingClientRect()
      el.style.height = '0px'
    }
  }, [open])

  return (
    <div
      ref={ref}
      style={{
        height: '0px',
        overflow: 'hidden',
        transition: reducedMotion ? 'none' : 'height 200ms cubic-bezier(0.23, 1, 0.32, 1)',
      }}
    >
      <div className="px-4 pb-4 pt-2">
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40">
              Before
            </p>
            {old ? (
              <pre className="overflow-x-auto rounded bg-white p-2 text-[11px] leading-relaxed text-gray-700 ring-1 ring-gray-200 dark:bg-white/5 dark:text-white/80 dark:ring-white/10">
                {old}
              </pre>
            ) : (
              <p className="text-xs text-gray-400 dark:text-white/40 italic">No snapshot</p>
            )}
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40">
              After
            </p>
            {next ? (
              <pre className="overflow-x-auto rounded bg-white p-2 text-[11px] leading-relaxed text-gray-700 ring-1 ring-gray-200 dark:bg-white/5 dark:text-white/80 dark:ring-white/10">
                {next}
              </pre>
            ) : (
              <p className="text-xs text-gray-400 dark:text-white/40 italic">No snapshot</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   AuditRow — single table row + expandable diff
───────────────────────────────────────── */
function AuditRow({ log, index, expandedId, onToggle }) {
  const isOpen = expandedId === log.auditLogId
  const hasDiff = log.oldValue || log.newValue

  return (
    <>
      <tr
        className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-100 animate-fade-slide-up cursor-default"
        style={{ animationDelay: reducedMotion ? '0ms' : `${index * 30}ms` }}
      >
        {/* Timestamp */}
        <Table.Td>
          <span
            title={formatTimestamp(log.createdAt)}
            className="font-mono text-xs text-gray-700 dark:text-white/60"
          >
            {formatTimestamp(log.createdAt)}
          </span>
          <div className="text-[10px] text-gray-400 dark:text-white/40">{relativeTime(log.createdAt)}</div>
        </Table.Td>

        {/* Actor */}
        <Table.Td className="max-w-[200px]">
          <div className="truncate font-medium text-gray-900 dark:text-white text-sm">
            {log.actorName ?? '—'}
          </div>
          <div className="truncate text-xs text-gray-400 dark:text-white/40">{log.actorEmail ?? log.userId}</div>
        </Table.Td>

        {/* Action badge */}
        <Table.Td>
          <ActionBadge action={log.action} />
        </Table.Td>

        {/* Target entity */}
        <Table.Td>
          <span className="text-xs text-gray-500 dark:text-white/60 font-mono">
            {log.entityName}
          </span>
          {log.entityId && (
            <div className="text-[10px] text-gray-400 dark:text-white/40 font-mono truncate max-w-[160px]">
              {log.entityId}
            </div>
          )}
        </Table.Td>

        {/* Changes toggle */}
        <Table.Td>
          {hasDiff ? (
            <button
              type="button"
              onClick={() => onToggle(log.auditLogId)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium
                         text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-white/10
                         transition-colors duration-150
                         active:scale-95 active:transition-none focus:outline-none focus-visible:ring-2
                         focus-visible:ring-primary-400"
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  View
                </>
              )}
            </button>
          ) : (
            <span className="text-xs text-gray-300 dark:text-white/20">—</span>
          )}
        </Table.Td>
      </tr>

      {/* Expandable diff row */}
      {hasDiff && (
        <tr>
          <td colSpan={5} className="p-0">
            <DiffPanel
              oldValue={log.oldValue}
              newValue={log.newValue}
              open={isOpen}
            />
          </td>
        </tr>
      )}
    </>
  )
}

/* ─────────────────────────────────────────
   Pagination controls
───────────────────────────────────────── */
function Pagination({ page, totalPages, totalElements, pageSize, onPageChange }) {
  const from = totalElements === 0 ? 0 : page * pageSize + 1
  const to   = Math.min((page + 1) * pageSize, totalElements)

  const pageNumbers = []
  const delta = 2
  for (let i = Math.max(0, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
    pageNumbers.push(i)
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/10 pt-4">
      <p className="text-xs text-gray-500 dark:text-white/60">
        {totalElements === 0
          ? 'No results'
          : `Showing ${from}–${to} of ${totalElements.toLocaleString()} entries`}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500
                     hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/10
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors duration-150 active:scale-95 active:transition-none"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pageNumbers[0] > 0 && (
          <>
            <PillButton active={false} onClick={() => onPageChange(0)}>1</PillButton>
            {pageNumbers[0] > 1 && <span className="px-1 text-xs text-gray-400 dark:text-white/40">…</span>}
          </>
        )}

        {pageNumbers.map(n => (
          <PillButton key={n} active={n === page} onClick={() => onPageChange(n)}>
            {n + 1}
          </PillButton>
        ))}

        {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 2 && (
              <span className="px-1 text-xs text-gray-400 dark:text-white/40">…</span>
            )}
            <PillButton active={false} onClick={() => onPageChange(totalPages - 1)}>
              {totalPages}
            </PillButton>
          </>
        )}

        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500
                     hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/10
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors duration-150 active:scale-95 active:transition-none"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function PillButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium
                  transition-colors duration-150 active:scale-95 active:transition-none
                  ${active
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/10'}`}
    >
      {children}
    </button>
  )
}

/* ─────────────────────────────────────────
   AuditLogsPage
───────────────────────────────────────── */
export default function AuditLogsPage() {
  /* ── Filter state ── */
  const [actionFilter, setActionFilter] = useState('')
  const [fromFilter,   setFromFilter]   = useState('')
  const [toFilter,     setToFilter]     = useState('')

  /* ── Committed filters (only applied when user hits Apply or resets) ── */
  const [appliedFilters, setAppliedFilters] = useState({
    action: '', from: '', to: '',
  })

  /* ── Data state ── */
  const [logs,        setLogs]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [page,        setPage]        = useState(0)
  const [totalPages,  setTotalPages]  = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  /* ── UI state ── */
  const [expandedId, setExpandedId] = useState(null)

  /* ─────────────────────────────────────
     Fetch
  ───────────────────────────────────── */
  const fetchLogs = useCallback(async (pageNum, filters) => {
    setLoading(true)
    setError(null)
    setExpandedId(null)
    try {
      const res = await getAuditLogs({
        action: filters.action  || undefined,
        from:   filters.from    ? new Date(filters.from).toISOString()  : undefined,
        to:     filters.to      ? new Date(filters.to).toISOString()    : undefined,
        page:   pageNum,
        size:   PAGE_SIZE,
      })
      const payload = res.data?.data
      setLogs(payload?.content ?? [])
      setTotalPages(payload?.totalPages ?? 0)
      setTotalElements(payload?.totalElements ?? 0)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load audit logs.')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  /* Initial load + re-fetch on page/applied-filters change */
  useEffect(() => {
    fetchLogs(page, appliedFilters)
  }, [page, appliedFilters, fetchLogs])

  /* ─────────────────────────────────────
     Handlers
  ───────────────────────────────────── */
  const handleApplyFilters = () => {
    setPage(0)
    setAppliedFilters({ action: actionFilter, from: fromFilter, to: toFilter })
  }

  const handleReset = () => {
    setActionFilter('')
    setFromFilter('')
    setToFilter('')
    setPage(0)
    setAppliedFilters({ action: '', from: '', to: '' })
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggleDiff = (id) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const isDirty = actionFilter !== appliedFilters.action
    || fromFilter !== appliedFilters.from
    || toFilter   !== appliedFilters.to

  const hasActiveFilters = appliedFilters.action || appliedFilters.from || appliedFilters.to

  /* ─────────────────────────────────────
     Render
  ───────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
          Track system events, security logs, and compliance audit trails.
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-xl border border-[var(--color-surface-border)] shadow-xs p-4 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
        <div className="flex flex-wrap items-end gap-3">

          {/* Action select */}
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-xs font-medium text-gray-500 dark:text-white/80 uppercase tracking-wider">
              Action
            </label>
            <div className="relative">
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white
                           pl-3 pr-8 py-2 text-sm text-gray-700 shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
                           transition-colors
                           dark:bg-[#1A1035] dark:border-white/10 dark:text-white"
              >
                <option value="">All actions</option>
                {ALL_ACTIONS.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-white/40" />
            </div>
          </div>

          {/* From date */}
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-xs font-medium text-gray-500 dark:text-white/80 uppercase tracking-wider">
              From
            </label>
            <input
              type="datetime-local"
              value={fromFilter}
              onChange={e => setFromFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-400
                         focus:border-transparent transition-colors
                         dark:bg-white/5 dark:border-white/10 dark:text-white dark:[color-scheme:dark]"
            />
          </div>

          {/* To date */}
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-xs font-medium text-gray-500 dark:text-white/80 uppercase tracking-wider">
              To
            </label>
            <input
              type="datetime-local"
              value={toFilter}
              onChange={e => setToFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700
                         shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-400
                         focus:border-transparent transition-colors
                         dark:bg-white/5 dark:border-white/10 dark:text-white dark:[color-scheme:dark]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pb-0.5">
            <Button
              onClick={handleApplyFilters}
              disabled={!isDirty && !hasActiveFilters}
              className="flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              Apply
            </Button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                title="Clear all filters"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white
                           px-3 py-2 text-sm font-medium text-gray-600
                           hover:bg-gray-50 transition-colors duration-150
                           active:scale-95 active:transition-none
                           dark:bg-white/5 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/10">
            <span className="text-xs text-gray-400 dark:text-white/40 font-medium">Active filters:</span>
            {appliedFilters.action && (
              <FilterChip
                label={`Action: ${actionLabel(appliedFilters.action)}`}
                onRemove={() => {
                  setActionFilter('')
                  setPage(0)
                  setAppliedFilters(f => ({ ...f, action: '' }))
                }}
              />
            )}
            {appliedFilters.from && (
              <FilterChip
                label={`From: ${new Date(appliedFilters.from).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}`}
                onRemove={() => {
                  setFromFilter('')
                  setPage(0)
                  setAppliedFilters(f => ({ ...f, from: '' }))
                }}
              />
            )}
            {appliedFilters.to && (
              <FilterChip
                label={`To: ${new Date(appliedFilters.to).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}`}
                onRemove={() => {
                  setToFilter('')
                  setPage(0)
                  setAppliedFilters(f => ({ ...f, to: '' }))
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-[var(--color-surface-border)] shadow-xs overflow-hidden dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
        {error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => fetchLogs(page, appliedFilters)}
              className="mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10 text-sm">
                <thead className="bg-gray-50 dark:bg-white/5">
                  <tr>
                    {['Timestamp', 'Actor', 'Action', 'Target', 'Changes'].map(col => (
                      <th
                        key={col}
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-100 dark:divide-white/10">
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} index={i} />)
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                            <ClipboardList className="w-5 h-5 text-gray-400 dark:text-white/40" />
                          </div>
                          <p className="text-sm text-gray-500 dark:text-white/60">
                            {hasActiveFilters
                              ? 'No audit log entries match the current filters.'
                              : 'No audit log entries yet.'}
                          </p>
                          {hasActiveFilters && (
                            <button
                              type="button"
                              onClick={handleReset}
                              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                            >
                              Clear filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, i) => (
                      <AuditRow
                        key={log.auditLogId}
                        log={log}
                        index={i}
                        expandedId={expandedId}
                        onToggle={handleToggleDiff}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalElements > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-white/10">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  pageSize={PAGE_SIZE}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   FilterChip — removable active-filter tag
───────────────────────────────────────── */
function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full
                     bg-primary-50 text-primary-700 ring-1 ring-primary-200 text-xs font-medium
                     dark:bg-primary-900/30 dark:text-primary-400 dark:ring-primary-500/30">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="rounded-full p-0.5 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors duration-100
                   active:scale-90 active:transition-none"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}
