import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Activity,
  Clock,
  Database,
  Network,
  Zap,
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
import { healthService } from '../../services/healthService'
import Spinner from '../ui/Spinner'

export default function ServiceDetailDrawer({ service, onClose }) {
  const [range, setRange] = useState('24h')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  // Trigger slide-in animation on mount
  useEffect(() => {
    // Request animation frame so DOM is mounted with initial translated position before transitioning
    const frame = requestAnimationFrame(() => {
      setIsOpen(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  // Smooth slide-out closing handler
  const handleClose = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => {
      onClose?.()
    }, 280) // Match transition duration (300ms curve)
  }, [onClose])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  useEffect(() => {
    if (!service?.serviceKey) return
    let active = true
    setLoading(true)

    healthService
      .getServiceHistory(service.serviceKey, range)
      .then((data) => {
        if (active) setHistory(data || [])
      })
      .catch((err) => {
        console.error('Failed to load service telemetry:', err)
        if (active) setHistory([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [service?.serviceKey, range])

  if (!service) return null

  // Chart telemetry formatting
  const chartData = history.map((pt) => {
    const time = new Date(pt.recordedAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
    return {
      time,
      latency: pt.responseTimeMs,
      status: pt.status,
      isUp: pt.status === 'UP' ? 100 : 0,
    }
  })

  // Calculate uptime % in window
  const upPoints = history.filter((h) => h.status === 'UP').length
  const uptimePct =
    history.length > 0 ? Math.round((upPoints / history.length) * 100) : 100

  // Avg latency
  const avgLatency =
    history.length > 0
      ? Math.round(
          history.reduce((acc, curr) => acc + curr.responseTimeMs, 0) /
            history.length
        )
      : service.responseTimeMs || 0

  let parsedDetails = null
  try {
    if (service.detailsJson) {
      parsedDetails = JSON.parse(service.detailsJson)
    }
  } catch (e) {
    // raw string
  }

  const drawerContent = (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden flex justify-end transition-colors duration-300 ${
        isOpen ? 'bg-slate-900/50 backdrop-blur-xs' : 'bg-transparent pointer-events-none'
      }`}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-xl bg-white shadow-2xl h-full flex flex-col transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-gray-900">
                {service.serviceName}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  service.status === 'UP'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {service.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Port: <span className="font-mono text-gray-700">{service.port}</span> | Key:{' '}
              <span className="font-mono text-gray-700">{service.serviceKey}</span> |{' '}
              {service.category || 'MICROSERVICE'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                Uptime ({range})
              </span>
              <p className="text-lg font-bold text-gray-900 mt-1">{uptimePct}%</p>
            </div>
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Avg Latency
              </span>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {avgLatency} <span className="text-xs font-normal text-gray-500">ms</span>
              </p>
            </div>
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-violet-500" />
                Last Ping
              </span>
              <p className="text-xs font-medium text-gray-900 mt-2 truncate">
                {service.checkedAt
                  ? new Date(service.checkedAt).toLocaleTimeString()
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Subsystem Health Cards */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Subsystem & Dependency Connectivity
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 border border-gray-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-medium text-gray-700">Database</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    service.dbStatus === 'UP'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : service.dbStatus === 'DOWN'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {service.dbStatus || 'N/A'}
                </span>
              </div>
              <div className="p-3.5 border border-gray-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-medium text-gray-700">Message Broker</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    service.rabbitStatus === 'UP'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : service.rabbitStatus === 'DOWN'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {service.rabbitStatus || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Response Latency Graph */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                Response Latency Telemetry
              </h3>
              {/* Range Selector */}
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
                {['1h', '24h', '7d'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`text-xs px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      range === r
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-xl bg-slate-50/50 h-56 flex flex-col justify-center">
              {loading ? (
                <div className="flex justify-center">
                  <Spinner size="md" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="text-center text-xs text-gray-400">
                  No telemetry snapshots recorded yet. Telemetry gathers every 60s.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      unit="ms"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-md shadow-lg border border-slate-700">
                              <p className="font-semibold text-slate-200">{data.time}</p>
                              <p className="text-blue-300">Latency: {data.latency} ms</p>
                              <p className={data.status === 'UP' ? 'text-green-400' : 'text-red-400'}>
                                Status: {data.status}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="latency"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#latencyGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Raw Diagnostic Payload */}
          {parsedDetails && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Diagnostic Snapshot
              </h3>
              <pre className="p-3 bg-slate-900 text-slate-100 text-xs rounded-xl overflow-x-auto max-h-48 font-mono">
                {JSON.stringify(parsedDetails, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(drawerContent, document.body)
}
