import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  ShieldCheck,
  Clock,
  Activity,
  AlertTriangle,
  Lock,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { adminService } from '../../services/adminService'
import { healthService } from '../../services/healthService'
import { analyticsService } from '../../services/analyticsService'
import { getAuditLogs } from '../../services/auditLogService'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { useTheme } from '../../context/ThemeContext'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const STAGGER_DELAYS = [0, 75, 150, 225]

const ACTIVITY_COLUMNS = ['User', 'Action', 'Target Entity', 'Timestamp']

export default function AdminDashboard() {
  const { isDark } = useTheme()

  // State
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [summaryData, setSummaryData] = useState(null)
  const [healthData, setHealthData] = useState(null)
  const [procurementSummary, setProcurementSummary] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])
  const [securityLogs, setSecurityLogs] = useState([])
  const [errorBanner, setErrorBanner] = useState(null)

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    []
  )

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setErrorBanner(null)

    try {
      // 1. Fetch admin count metrics & health in parallel
      const [summaryRes, healthRes, auditRes, securityRes, procRes] =
        await Promise.allSettled([
          adminService.getDashboardSummary(),
          healthService.getSystemHealth(),
          getAuditLogs({ page: 0, size: 6 }),
          getAuditLogs({ page: 0, size: 4, action: 'ACCOUNT_LOCKED' }),
          analyticsService.getProcurementSummary(),
        ])

      // Admin Summary Metrics
      if (summaryRes.status === 'fulfilled' && summaryRes.value?.data?.data) {
        setSummaryData(summaryRes.value.data.data)
      } else if (summaryRes.status === 'rejected') {
        console.error('Failed to load summary stats:', summaryRes.reason)
      }

      // System Health
      if (healthRes.status === 'fulfilled' && healthRes.value) {
        setHealthData(healthRes.value)
      } else if (healthRes.status === 'rejected') {
        console.error('Failed to load system health:', healthRes.reason)
      }

      // Live Audit Logs
      if (auditRes.status === 'fulfilled' && auditRes.value?.data?.data?.content) {
        setRecentLogs(auditRes.value.data.data.content)
      } else {
        setRecentLogs([])
      }

      // Security / Account Locked events
      if (securityRes.status === 'fulfilled' && securityRes.value?.data?.data?.content) {
        setSecurityLogs(securityRes.value.data.data.content)
      }

      // Procurement & Spend Snapshot
      if (procRes.status === 'fulfilled' && procRes.value?.data?.data) {
        setProcurementSummary(procRes.value.data.data)
      } else {
        setProcurementSummary(null)
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err)
      setErrorBanner('Failed to load some dashboard metrics. Please retry.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Stat cards derived from live data
  const statCards = useMemo(() => {
    const totalUsers = summaryData ? summaryData.totalUsers : 0
    const activeVendors = summaryData ? summaryData.activeVendors : 0
    const pendingVendors = summaryData ? summaryData.pendingVendors : 0

    // Compute status and uptime percentage based on healthData
    const totalServices = healthData?.totalServices || (healthData?.services ? healthData.services.length : 0)
    const servicesUp = healthData?.servicesUp || 0
    const servicesDown = healthData?.servicesDown || 0

    let statusDisplay = '100% Operational'
    let statusDirection = 'up'
    let iconColor = 'text-emerald-600'
    let iconBg = 'bg-emerald-50'

    if (totalServices === 0) {
      statusDisplay = 'Operational'
    } else if (servicesDown === 0) {
      statusDisplay = '100% Operational'
      statusDirection = 'up'
      iconColor = 'text-emerald-600'
      iconBg = 'bg-emerald-50'
    } else if (servicesUp > 0) {
      const pct = Math.round((servicesUp / totalServices) * 100)
      statusDisplay = `${pct}% Operational`
      statusDirection = 'down'
      iconColor = 'text-amber-600'
      iconBg = 'bg-amber-50'
    } else {
      statusDisplay = 'Degraded'
      statusDirection = 'down'
      iconColor = 'text-red-600'
      iconBg = 'bg-red-50'
    }

    return [
      {
        title: 'Total Users',
        value: totalUsers,
        icon: Users,
        iconColor: 'text-violet-600',
        iconBg: 'bg-violet-50',
        trend: summaryData
          ? {
              direction: 'up',
              label: `${summaryData.activeEmployees} staff, ${summaryData.totalVendors} vendors`,
            }
          : undefined,
      },
      {
        title: 'Active Vendors',
        value: activeVendors,
        icon: ShieldCheck,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-50',
        trend: {
          direction: 'up',
          label: `${summaryData?.totalVendors || 0} registered total`,
        },
      },
      {
        title: 'Pending Approvals',
        value: pendingVendors,
        icon: Clock,
        iconColor: pendingVendors > 0 ? 'text-amber-600' : 'text-gray-500',
        iconBg: pendingVendors > 0 ? 'bg-amber-50' : 'bg-gray-50',
        trend:
          pendingVendors > 0
            ? { direction: 'down', label: 'Action required' }
            : { direction: 'up', label: 'All caught up' },
      },
      {
        title: 'System Status',
        value: statusDisplay,
        icon: Activity,
        iconColor,
        iconBg,
        trend: {
          direction: statusDirection,
          label: totalServices > 0 ? `${servicesUp}/${totalServices} services online` : 'Services monitored',
        },
      },
    ]
  }, [summaryData, healthData])

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/60">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw
              size={14}
              className={refreshing ? 'animate-spin text-primary-600' : ''}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {errorBanner && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between dark:bg-red-900/20 dark:border-red-500/30 dark:text-red-400">
          <span>{errorBanner}</span>
          <Button variant="ghost" size="sm" onClick={() => fetchDashboardData(true)}>
            Retry
          </Button>
        </div>
      )}

      {/* 1. Stat Grid (Real Backend Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-32 animate-pulse flex flex-col justify-between dark:bg-white/5 dark:border-white/10"
              >
                <div className="h-4 bg-gray-200 rounded w-1/2 dark:bg-white/10"></div>
                <div className="h-7 bg-gray-200 rounded w-1/3 dark:bg-white/10"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 dark:bg-white/10"></div>
              </div>
            ))
          : statCards.map((card, i) => (
              <StatCard
                key={card.title}
                {...card}
                style={{
                  animationDelay: reducedMotion ? '0ms' : `${STAGGER_DELAYS[i]}ms`,
                }}
              />
            ))}
      </div>

      {/* 2. Procurement Snapshot & Security Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Procurement & Spend Snapshot */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-primary-600 dark:text-primary-400" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Procurement & Spend Snapshot
                </h2>
              </div>
              <span className="text-xs text-gray-400 dark:text-white/40">Current Month (MTD)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
              <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100 dark:bg-white/5 dark:border-white/10">
                <p className="text-xs font-medium text-gray-500 dark:text-white/60">Purchase Orders</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  {procurementSummary ? procurementSummary.totalPOCount : '0'}
                </p>
                <span className="text-2xs text-gray-400 dark:text-white/40">Issued this month</span>
              </div>

              <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100 dark:bg-white/5 dark:border-white/10">
                <p className="text-xs font-medium text-gray-500 dark:text-white/60">Total PO Value</p>
                <p className="mt-1 text-xl font-bold text-primary-700 dark:text-primary-400">
                  {procurementSummary
                    ? formatCurrency(procurementSummary.totalPOValueMTD)
                    : '₹0.00'}
                </p>
                <span className="text-2xs text-gray-400 dark:text-white/40">Committed budget</span>
              </div>

              <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100 dark:bg-white/5 dark:border-white/10">
                <p className="text-xs font-medium text-gray-500 dark:text-white/60">GRN Receipts</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  {procurementSummary ? procurementSummary.totalGrnCount : '0'}
                </p>
                <span className="text-2xs text-gray-400 dark:text-white/40">Goods received</span>
              </div>

              <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100 dark:bg-white/5 dark:border-white/10">
                <p className="text-xs font-medium text-gray-500 dark:text-white/60">Open RFQs</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  {procurementSummary ? procurementSummary.openRfqCount : '0'}
                </p>
                <span className="text-2xs text-gray-400 dark:text-white/40">Awaiting vendor bids</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs text-gray-500 dark:text-white/60">
            <span>Aggregated across organization departments</span>
            <Link
              to="/procurement/analytics"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium inline-flex items-center gap-1"
            >
              Detailed Analytics <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        {/* Security & Login Activity Widget */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-amber-600 dark:text-amber-400" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Security & Access
                </h2>
              </div>
              {summaryData?.lockedAccounts > 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  {summaryData.lockedAccounts} Locked
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  Normal
                </span>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 dark:bg-white/5 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div
                    className={
                      summaryData?.lockedAccounts > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }
                  >
                    {summaryData?.lockedAccounts > 0 ? (
                      <AlertTriangle size={18} />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      Locked Accounts
                    </p>
                    <p className="text-2xs text-gray-500 dark:text-white/60">
                      Exceeded max failed attempts
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {summaryData?.lockedAccounts || 0}
                  </span>
                </div>
              </div>

              {/* Recent Security Incidents / Lock events */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-white/60 mb-2 uppercase tracking-wide">
                  Recent Security Events
                </p>
                {securityLogs.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-white/40 py-2 italic text-center">
                    No recent security incidents or locks.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {securityLogs.map((log) => (
                      <li
                        key={log.auditLogId}
                        className="text-xs p-2 rounded bg-amber-50/60 border border-amber-100 text-gray-700 flex items-start justify-between gap-2 dark:bg-white/5 dark:border-white/10 dark:text-white/60"
                      >
                        <div className="truncate">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {log.actorEmail || 'System'}
                          </span>
                          <span className="text-gray-500 dark:text-white/60 block truncate">
                            {log.action} ({log.entityName})
                          </span>
                        </div>
                        <span className="text-2xs text-gray-400 dark:text-white/40 shrink-0">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
            <Link
              to="/admin/users"
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium inline-flex items-center gap-1"
            >
              Review User Permissions <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Recent Activity Table (Live Audit Trail Data) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            <p className="text-xs text-gray-500 dark:text-white/60 mt-0.5">
              Live audit events streamed from the platform audit service
            </p>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium inline-flex items-center gap-1"
          >
            View all logs <ExternalLink size={12} />
          </Link>
        </div>

        <Table
          columns={ACTIVITY_COLUMNS}
          loading={loading}
          empty={recentLogs.length === 0}
          emptyMessage="No audit logs recorded yet."
        >
          {recentLogs.map((row, i) => (
            <tr
              key={row.auditLogId || i}
              className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-100 animate-fade-slide-up"
              style={{ animationDelay: reducedMotion ? '0ms' : `${i * 40}ms` }}
            >
              <Table.Td className="font-medium text-gray-900 dark:text-white">
                {row.actorEmail || 'System'}
              </Table.Td>
              <Table.Td>
                <Badge
                  status={row.action}
                  label={row.action.replace(/_/g, ' ')}
                />
              </Table.Td>
              <Table.Td className="text-gray-600 dark:text-white/60">
                {row.entityName || '—'}
              </Table.Td>
              <Table.Td className="text-gray-400 dark:text-white/40 text-xs">
                {formatDateTime(row.createdAt)}
              </Table.Td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}
