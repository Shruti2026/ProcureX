import { useState, useEffect } from 'react'
import { BarChart2, Package, DollarSign, ClipboardList, ShoppingCart, RefreshCw } from 'lucide-react'
import clsx from 'clsx'

import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { formatCurrency } from '../../utils/formatters'
import { analyticsService } from '../../services/analyticsService'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const STAGGER_DELAYS = [0, 75, 150, 225]

const VENDOR_COLUMNS = [
  'Vendor ID',
  'Total Deliveries',
  'On-Time %',
  'Quality %',
  'Score',
]

function ScoreBadge({ score }) {
  const numScore = Number(score)
  const colorClasses =
    numScore >= 4.0
      ? 'bg-green-100 text-green-800'
      : numScore >= 2.5
      ? 'bg-amber-100 text-amber-800'
      : 'bg-red-100 text-red-800'

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
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [vendorLoading, setVendorLoading]   = useState(true)
  const [error, setError]                   = useState(false)

  const [summary, setSummary]         = useState(null)
  const [vendorData, setVendorData]   = useState([])

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
          <h1 className="text-2xl font-bold text-gray-900">Procurement Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
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
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
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

      {/* Vendor Performance table */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Vendor Performance</h2>
        {vendorLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" className="text-primary-500" />
          </div>
        ) : error && vendorData.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
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
              const vendorIdShort = vendor.vendorId
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
                  className="hover:bg-gray-50 transition-colors duration-100 animate-fade-slide-up"
                  style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
                >
                  <Table.Td className="font-mono text-xs text-gray-600">
                    {vendorIdShort}
                  </Table.Td>
                  <Table.Td>{vendor.totalDeliveries ?? 0}</Table.Td>
                  <Table.Td>{onTimePct}</Table.Td>
                  <Table.Td>{qualityPct}</Table.Td>
                  <Table.Td>
                    <ScoreBadge score={vendor.score ?? 0} />
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
