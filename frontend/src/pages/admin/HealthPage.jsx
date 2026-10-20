import { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  CheckCircle2,
  XCircle,
  Server,
  RefreshCw,
  Database,
  Network,
} from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import { healthService } from '../../services/healthService'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const STAGGER_DELAYS = [0, 75, 150, 225]

/**
 * Returns a styled status pill for a given status string.
 * Handles "UP", "DOWN", "N/A", and unknown/loading states.
 */
function StatusBadge({ status }) {
  if (!status || status === 'N/A') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200">
        N/A
      </span>
    )
  }

  const styles =
    status === 'UP'
      ? 'bg-green-50 text-green-700 border border-green-200'
      : status === 'DOWN'
      ? 'bg-red-50 text-red-700 border border-red-200'
      : 'bg-gray-100 text-gray-500 border border-gray-200'

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>
      {status}
    </span>
  )
}

/**
 * Individual service card shown in the grid.
 */
function ServiceCard({ service, style }) {
  const { serviceName, port, status, dbStatus, rabbitStatus, checkedAt } = service

  const checkedAtFormatted = checkedAt
    ? new Date(checkedAt).toLocaleTimeString()
    : '—'

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col gap-3 animate-fade-slide-up"
      style={style}
    >
      {/* Top row: name + status */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-gray-900 leading-snug">{serviceName}</span>
        <StatusBadge status={status} />
      </div>

      {/* Port */}
      <p className="text-xs text-gray-400">Port {port}</p>

      {/* Infrastructure sub-statuses */}
      <div className="flex flex-col gap-1.5">
        {/* DB Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>Database</span>
          </div>
          <StatusBadge status={dbStatus} />
        </div>

        {/* RabbitMQ Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Network className="w-3.5 h-3.5 shrink-0" />
            <span>Message Broker</span>
          </div>
          <StatusBadge status={rabbitStatus} />
        </div>
      </div>

      {/* Footer: last checked */}
      <p className="text-xs text-gray-400 pt-1 border-t border-gray-100">
        Last checked: {checkedAtFormatted}
      </p>
    </div>
  )
}

export default function HealthPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

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

  // Initial fetch
  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(fetchHealth, 30_000)
    return () => clearInterval(id)
  }, [autoRefresh, fetchHealth])

  // Derived stat cards (computed from live data)
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
          title: 'Total Services',
          value: data.totalServices,
          icon: Server,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-50',
        },
        {
          title: 'Uptime Rate',
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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor microservices status, Eureka service registry, and infrastructure metrics.
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex flex-col items-start gap-3">
          <p className="text-sm font-medium text-red-700">
            Failed to load system health data. Check that all services are running.
          </p>
          <button
            onClick={fetchHealth}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-700 bg-white hover:bg-red-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Main content — visible once we have data */}
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

          {/* Toolbar: last updated + controls */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-gray-400">
              {lastUpdated
                ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
                : 'Not yet refreshed'}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh((v) => !v)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  autoRefresh
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Auto-refresh {autoRefresh ? 'On' : 'Off'}
              </button>
              <button
                onClick={fetchHealth}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Per-service cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.services.map((service, i) => (
              <ServiceCard
                key={service.serviceKey}
                service={service}
                style={{
                  animationDelay: reducedMotion ? '0ms' : `${i * 60}ms`,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
