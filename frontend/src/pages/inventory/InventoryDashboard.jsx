import { useMemo } from 'react'
import { Boxes, AlertTriangle, Warehouse, ClipboardList } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const STAT_CARDS = [
  {
    title: 'Total SKUs',
    value: 284,
    icon: Boxes,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    trend: { direction: 'up', label: '+12 this week' },
  },
  {
    title: 'Low Stock Items',
    value: 18,
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
    trend: { direction: 'up', label: '3 critical' },
  },
  {
    title: 'Warehouses',
    value: 4,
    icon: Warehouse,
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50',
  },
  {
    title: 'Pending GRNs',
    value: 9,
    icon: ClipboardList,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
  },
]

const COLUMNS = ['GRN ID', 'Purchase Order', 'Warehouse', 'Status', 'Date']

const GRN_ROWS = [
  { id: 'GRN-001', po: 'PO-2024-089', warehouse: 'Main Warehouse',  status: 'PASSED',             date: 'Dec 10, 2024' },
  { id: 'GRN-002', po: 'PO-2024-087', warehouse: 'North Depot',     status: 'PENDING_INSPECTION', date: 'Dec 09, 2024' },
  { id: 'GRN-003', po: 'PO-2024-085', warehouse: 'South Warehouse', status: 'INSPECTED',          date: 'Dec 07, 2024' },
  { id: 'GRN-004', po: 'PO-2024-083', warehouse: 'Main Warehouse',  status: 'PARTIAL',            date: 'Dec 05, 2024' },
  { id: 'GRN-005', po: 'PO-2024-081', warehouse: 'East Storage',    status: 'PASSED',             date: 'Dec 03, 2024' },
  { id: 'GRN-006', po: 'PO-2024-079', warehouse: 'North Depot',     status: 'INSPECTED',          date: 'Dec 01, 2024' },
]

const STAGGER_DELAYS = [0, 75, 150, 225]

export default function InventoryDashboard() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">{today}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, i) => (
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
        <h2 className="text-base font-semibold text-gray-800 mb-3">Recent GRNs</h2>
        <Table columns={COLUMNS}>
          {GRN_ROWS.map((row, i) => (
            <tr
              key={row.id}
              className="hover:bg-gray-50 transition-colors duration-100 animate-fade-slide-up"
              style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
            >
              <Table.Td className="font-medium text-gray-900">{row.id}</Table.Td>
              <Table.Td>{row.po}</Table.Td>
              <Table.Td>{row.warehouse}</Table.Td>
              <Table.Td><Badge status={row.status} /></Table.Td>
              <Table.Td className="text-gray-400">{row.date}</Table.Td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}
