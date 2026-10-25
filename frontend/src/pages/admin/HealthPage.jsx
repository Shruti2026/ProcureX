import { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  CheckCircle2,
  XCircle,
  Server,
  RefreshCw,
  Database,
  Network,
  Zap,
  HardDrive,
  Layers,
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
import Spinner from '../../components/ui/Spinner'
import ServiceDetailDrawer from '../../components/admin/ServiceDetailDrawer'
import { healthService } from '../../services/healthService'
import { useTheme } from '../../context/ThemeContext'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const STAGGER_DELAYS = [0, 75, 150, 225]

function StatusBadge({ status }) {
  if (!status || status === 'N/A') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200 dark:bg-white/10 dark:text-white/40 dark:border-white/10">
        N/A
      </span>
    )
  }

  const styles =
    status === 'UP'
      ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-500/30'
      : status === 'DOWN'
      ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-500/30'
      : 'bg-gray-100 text-gray-500 border border-gray-200 dark:bg-white/10 dark:text-white/60 dark:border-white/10'

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>
      {status}
    </span>
  )
}

function ServiceCard({ service, style, onClick }) {
  const {
    serviceName,
    port,
    status,
    dbStatus,
    rabbitStatus,
    checkedAt,
    category,
    responseTimeMs,
  } = service

  const checkedAtFormatted = checkedAt
    ? new Date(checkedAt).toLocaleTimeString()
    : '—'

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer rounded-xl p-4 shadow-xs flex flex-col gap-3 group dark:bg-white/5 dark:border-white/10 dark:hover:border-blue-400/50"
      style={style}
    >
      {/* Top row: name + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
            {serviceName}
          </span>
          <span className="text-[11px] text-gray-400 dark:text-white/40">
            Port {port} {responseTimeMs ? `• ${responseTimeMs}ms` : ''}
          </span>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Infrastructure sub-statuses (only if applicable) */}
      {category !== 'INFRASTRUCTURE' ? (
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-white/60">
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span>Database</span>
            </div>
            <StatusBadge status={dbStatus} />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-white/60">
              <Network className="w-3.5 h-3.5 shrink-0" />
              <span>Message Broker</span>
            </div>
            <StatusBadge status={rabbitStatus} />
          </div>
        </div>
      ) : (
        <div className="py-2 text-xs text-slate-500 dark:text-white/60 flex items-center gap-2">
          {service.serviceKey === 'mysql' ? (
            <HardDrive className="w-4 h-4 text-amber-500" />
          ) : (
            <Layers className="w-4 h-4 text-orange-500" />
          )}
          <span>Core Infrastructure Resource</span>
        </div>
      )}

      {/* Footer: last checked */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-white/40 pt-2 border-t border-gray-100 dark:border-white/10 mt-auto">
        <span>Checked: {checkedAtFormatted}</span>
        <span className="text-[11px] text-blue-500 dark:text-blue-400 group-hover:underline font-medium">
          View details &rarr;
        </span>
      </div>
    </div>
  )
}

export default function HealthPage() {
  const { isDark } = useTheme()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedService, setSelectedService] = useState(null)

  // Overall system history timeline state
  const [historyRange, setHistoryRange] = useState('24h')
  const [systemHistory, setSystemHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await healthService.getSystemHealth()
      setData(result)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err?.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const history = await healthService.getSystemHealthHistory(historyRange)
      setSystemHistory(history || [])
    } catch (err) {
      console.error('Failed to load system health history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }, [historyRange])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => {
      fetchHealth()
      fetchHistory()
    }, 30_000)
    return () => clearInterval(id)
  }, [autoRefresh, fetchHealth, fetchHistory])

  // Split into microservices and infrastructure
  const microservices = data?.services?.filter((s) => s.category !== 'INFRASTRUCTURE') || []
  const infrastructure = data?.services?.filter((s) => s.category === 'INFRASTRUCTURE') || []

  // Derived stat cards
  const statCards = data
    ? [
        {
          title: 'Services Online',
          value: data.servicesUp,
          icon: CheckCircle2,
          iconColor: 'text-green-600',
          iconBg: 'bg-green-50',
        },
        {
          title: 'Services Offline',
          value: data.servicesDown,
          icon: XCircle,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-50',
        },
        {
          title: 'Total Monitored',
          value: data.totalServices,
          icon: Server,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-50',
        },
        {
          title: 'System Uptime Rate',
          value:
            data.totalServices > 0
              ? Math.round((data.servicesUp / data.totalServices) * 100) + '%'
              : '—',
          icon: Activity,
          iconColor: 'text-violet-600',
          iconBg: 'bg-violet-50',
        },
      ]
    : []

  const formattedChartData = systemHistory.map((item) => ({
    time: new Date(item.recordedAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    uptime: Number(item.uptimeRate),
    online: item.servicesOnline,
  }))

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Health</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
          Monitor microservices status, Eureka service registry, and infrastructure telemetry.
        </p>
      </div>

      {/* Loading state */}
      {loading && !data && (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error state */}
      {error && !data && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex flex-col items-start gap-3 dark:bg-red-900/20 dark:border-red-500/30">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            Failed to load system health data. Check that all services are running.
          </p>
          <button
            onClick={fetchHealth}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-700 bg-white hover:bg-red-50 transition-colors dark:bg-white/5 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Main content */}
      {data && (
        <>
          {/* Stat cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, i) => (
              <StatCard
                key={card.title}
                {...card}
                style={{
                  animationDelay: reducedMotion ? '0ms' : `${STAGGER_DELAYS[i]}ms`,
                }}
              />
            ))}
          </div>

          {/* System Uptime History Graph Card */}
          <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-xs space-y-4 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  System Availability & Uptime Trend
                </h2>
                <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                  Aggregated telemetry recorded every 60 seconds
                </p>
              </div>

              {/* Range Filters */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/10 p-1 rounded-lg">
                {['1h', '24h', '7d'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setHistoryRange(r)}
                    className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                      historyRange === r
                        ? 'bg-white dark:bg-white/20 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              {historyLoading && formattedChartData.length === 0 ? (
                <Spinner size="md" />
              ) : formattedChartData.length === 0 ? (
                <div className="text-xs text-gray-400 dark:text-white/40">
                  Telemetry snapshot gathering in progress. First snapshot will appear shortly.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={formattedChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="systemUptimeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}
                      tickLine={false}
                      axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      unit="%"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const pt = payload[0].payload
                          return (
                            <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-slate-700">
                              <p className="font-semibold text-slate-300">{pt.time}</p>
                              <p className="text-violet-300">Uptime: {pt.uptime}%</p>
                              <p className="text-emerald-400">Online: {pt.online} / {data.totalServices}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="uptime"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#systemUptimeGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Toolbar: last updated + controls */}
          <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
            <p className="text-xs text-gray-400 dark:text-white/40">
              {lastUpdated
                ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
                : 'Not yet refreshed'}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh((v) => !v)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  autoRefresh
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-500/30 dark:hover:bg-green-900/30'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-white/5 dark:text-white/70 dark:border-white/10 dark:hover:bg-white/10'
                }`}
              >
                Auto-refresh {autoRefresh ? 'On' : 'Off'}
              </button>
              <button
                onClick={() => {
                  fetchHealth()
                  fetchHistory()
                }}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors dark:bg-white/5 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Shared Infrastructure Section */}
          {infrastructure.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-white/60">
                Core Shared Infrastructure
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {infrastructure.map((service, i) => (
                  <ServiceCard
                    key={service.serviceKey}
                    service={service}
                    onClick={() => setSelectedService(service)}
                    style={{
                      animationDelay: reducedMotion ? '0ms' : `${i * 60}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Microservices Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-white/60">
              ProcureX Microservices
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {microservices.map((service, i) => (
                <ServiceCard
                  key={service.serviceKey}
                  service={service}
                  onClick={() => setSelectedService(service)}
                  style={{
                    animationDelay: reducedMotion ? '0ms' : `${i * 60}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Slide-over Detail Drawer */}
      {selectedService && (
        <ServiceDetailDrawer
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  )
}
