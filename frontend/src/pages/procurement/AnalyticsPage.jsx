import { useState, useEffect } from 'react'
import { BarChart2, Package, DollarSign, ClipboardList, ShoppingCart, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import clsx from 'clsx'

import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../utils/formatters'
import { analyticsService } from '../../services/analyticsService'
import { useTheme } from '../../context/ThemeContext'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const STAGGER_DELAYS = [0, 75, 150, 225]

const VENDOR_COLUMNS = [
  'Vendor',
  'Total Deliveries',
  'On-Time %',
  'Quality %',
  'Score',
]

function ScoreBadge({ score }) {
  const numScore = Number(score)
  const colorClasses =
    numScore >= 4.0
      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
      : numScore >= 2.5
      ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400'
      : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        colorClasses
      )}
    >
      {numScore.toFixed(2)}
    </span>
  )
}

export default function AnalyticsPage() {
  const { isDark } = useTheme()

  const [summaryLoading, setSummaryLoading] = useState(true)
  const [vendorLoading, setVendorLoading]   = useState(true)
  const [error, setError]                   = useState(false)

  const [summary, setSummary]         = useState(null)
  const [vendorData, setVendorData]   = useState([])
  const [spendData, setSpendData]     = useState([])

  const loadData = async () => {
    setSummaryLoading(true)
    setVendorLoading(true)
    setError(false)

    try {
      const [summaryRes, vendorRes] = await Promise.all([
        analyticsService.getProcurementSummary(),
        analyticsService.getVendorPerformance(),
      ])

      const summaryPayload = summaryRes.data?.data ?? summaryRes.data ?? {}
      const vendorPayload  = vendorRes.data?.data  ?? vendorRes.data  ?? []

      setSummary(summaryPayload)
      setVendorData(Array.isArray(vendorPayload) ? vendorPayload : [])
    } catch {
      setError(true)
    } finally {
      setSummaryLoading(false)
      setVendorLoading(false)
    }

    // Load spend-by-department independently so failures don't affect main data
    analyticsService.getSpendByDepartment().then(r => {
      const raw = r.data?.data ?? []
      setSpendData(raw.map(d => ({
        department: d.department ?? d.departmentName ?? d.name ?? 'Unknown',
        totalSpend:  d.totalSpend ?? d.amount ?? d.total ?? 0,
      })))
    }).catch(() => {})
  }

  useEffect(() => {
    loadData()
  }, [])

  const statCards = [
    {
      title:     'Total POs',
      value:     summaryLoading ? '—' : (summary?.totalPOCount ?? 0),
      icon:      Package,
      iconColor: 'text-blue-600',
      iconBg:    'bg-blue-50',
    },
    {
      title:     'PO Value MTD',
      value:     summaryLoading ? '—' : formatCurrency(summary?.totalPOValueMTD ?? 0),
      icon:      DollarSign,
      iconColor: 'text-teal-600',
      iconBg:    'bg-teal-50',
    },
    {
      title:     'Total GRNs',
      value:     summaryLoading ? '—' : (summary?.totalGrnCount ?? 0),
      icon:      ClipboardList,
      iconColor: 'text-violet-600',
      iconBg:    'bg-violet-50',
    },
    {
      title:     'Open RFQs',
      value:     summaryLoading ? '—' : (summary?.openRfqCount ?? 0),
      icon:      ShoppingCart,
      iconColor: 'text-amber-600',
      iconBg:    'bg-amber-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Procurement Analytics</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
            Spend patterns, supplier performance, and procurement KPIs.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadData}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          Failed to load analytics data. Check your connection and try refreshing.
        </div>
      )}

      {/* KPI stat cards */}
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

      {/* Spend by Department chart */}
      {spendData.length > 0 && (
        <div className="bg-white dark:bg-white/5 dark:backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Spend by Department</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart layout="vertical" data={spendData} margin={{ left: 20 }}>
              <XAxis
                type="number"
                tickFormatter={(v) => formatCurrency(v)}
                tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}
              />
              <YAxis
                type="category"
                dataKey="department"
                width={140}
                tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-slate-900 dark:bg-[#1A1035] text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-slate-700 dark:border-white/10">
                      <p className="font-semibold text-slate-300 mb-1">{label}</p>
                      {payload.map((entry, i) => (
                        <p key={i} style={{color: entry.color}}>{entry.name}: {formatCurrency(entry.value)}</p>
                      ))}
                    </div>
                  )
                }}
              />
              <Bar dataKey="totalSpend" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Vendor Performance table */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-3">Vendor Performance</h2>
        {vendorLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" className="text-primary-500" />
          </div>
        ) : error && vendorData.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-10 text-center text-sm text-gray-400 dark:text-white/40">
            Unable to load vendor performance data.
          </div>
        ) : (
          <Table
            columns={VENDOR_COLUMNS}
            loading={false}
            empty={vendorData.length === 0}
            emptyMessage="No vendor performance data available."
          >
            {vendorData.map((vendor, i) => {
              const vendorDisplay = vendor.vendorName && vendor.vendorName.trim()
                ? vendor.vendorName
                : vendor.vendorId
                  ? vendor.vendorId.slice(0, 8) + '...'
                  : '—'
              const onTimePct = vendor.onTimeRatio != null
                ? (vendor.onTimeRatio * 100).toFixed(1) + '%'
                : '—'
              const qualityPct = vendor.qualityRatio != null
                ? (vendor.qualityRatio * 100).toFixed(1) + '%'
                : '—'

              return (
                <tr
                  key={vendor.vendorId ?? i}
                  className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-100 animate-fade-slide-up"
                  style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
                >
                  <Table.Td className="font-medium text-gray-800 dark:text-white">
                    {vendorDisplay}
                  </Table.Td>
                  <Table.Td>{vendor.totalDeliveries ?? 0}</Table.Td>
                  <Table.Td>{onTimePct}</Table.Td>
                  <Table.Td>{qualityPct}</Table.Td>
                  <Table.Td>
                    <ScoreBadge score={vendor.performanceScore ?? 0} />
                  </Table.Td>
                </tr>
              )
            })}
          </Table>
        )}
      </div>
    </div>
  )
}
