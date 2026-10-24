import { useState, useEffect, useMemo } from 'react'
import { ShoppingCart, FileText, Package, Receipt } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import { formatCurrency, formatDate } from '../../utils/formatters'
import api from '../../services/api'
import toast from 'react-hot-toast'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const STAT_CARD_DEFS = [
  {
    title: 'Open RFQs',
    icon: ShoppingCart,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    title: 'My Quotations',
    icon: FileText,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
    trend: { direction: 'up', label: '+2 submitted' },
  },
  {
    title: 'Active Orders',
    icon: Package,
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50',
  },
  {
    title: 'Pending Invoices',
    icon: Receipt,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
  },
]

const COLUMNS = ['PO Number', 'Vendor', 'Amount', 'Status', 'Date']

const STAGGER_DELAYS = [0, 75, 150, 225]

export default function VendorDashboard() {
  const [kpis, setKpis] = useState([null, null, null, null])
  const [poRows, setPoRows] = useState([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    let cancelled = false

    const fetchAll = async () => {
      try {
        const [rfqRes, quotRes, ordersRes, invoicesRes, recentOrdersRes] =
          await Promise.all([
            api.get('/api/v1/procurement/rfqs/my-invitations?page=0&size=1'),
            api.get('/api/v1/procurement/quotations/my-quotations?page=0&size=1'),
            api.get('/api/v1/procurement/orders/my-orders?page=0&size=1'),
            api.get('/api/v1/finance/invoices/my-invoices?page=0&size=1'),
            api.get('/api/v1/procurement/orders/my-orders?page=0&size=6'),
          ])

        if (cancelled) return

        setKpis([
          rfqRes.data?.data?.totalElements ?? 0,
          quotRes.data?.data?.totalElements ?? 0,
          ordersRes.data?.data?.totalElements ?? 0,
          invoicesRes.data?.data?.totalElements ?? 0,
        ])
        setPoRows(recentOrdersRes.data?.data?.content ?? [])
      } catch (err) {
        if (!cancelled) {
          toast.error('Failed to load dashboard data')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchAll()

    return () => {
      cancelled = true
    }
  }, [])

  const statCards = STAT_CARD_DEFS.map((def, i) => ({
    ...def,
    value: loading ? '—' : kpis[i],
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">{today}</p>
      </div>

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

      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Recent Purchase Orders</h2>
        <Table columns={COLUMNS}>
          {poRows.map((row, i) => (
            <tr
              key={row.id ?? i}
              className="hover:bg-gray-50 transition-colors duration-100 animate-fade-slide-up"
              style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
            >
              <Table.Td className="font-medium text-gray-900">
                {row.poNumber ?? row.id ?? '—'}
              </Table.Td>
              <Table.Td>{row.vendorName ?? row.vendor ?? '—'}</Table.Td>
              <Table.Td className="font-medium">
                {formatCurrency(row.totalAmount ?? row.amount)}
              </Table.Td>
              <Table.Td>
                <Badge status={row.status} />
              </Table.Td>
              <Table.Td className="text-gray-400">
                {formatDate(row.createdAt ?? row.orderDate ?? row.date)}
              </Table.Td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}
