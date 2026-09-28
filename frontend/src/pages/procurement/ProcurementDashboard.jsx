import { useMemo } from 'react'
import { FileText, ShoppingCart, Package, Clock } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const STAT_CARDS = [
  {
    title: 'Open Requisitions',
    value: 12,
    icon: FileText,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    trend: { direction: 'up', label: '+2 this week' },
  },
  {
    title: 'Active RFQs',
    value: 7,
    icon: ShoppingCart,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
  },
  {
    title: 'Purchase Orders',
    value: 34,
    icon: Package,
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50',
    trend: { direction: 'up', label: '+4 this month' },
  },
  {
    title: 'Pending Approvals',
    value: 3,
    icon: Clock,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
  },
]

const COLUMNS = ['ID', 'Title', 'Status', 'Created By', 'Date']

const REQUISITION_ROWS = [
  { id: 'REQ-001', title: 'Office Supplies Q4',       status: 'APPROVED',         createdBy: 'John Doe',     date: 'Dec 10, 2024' },
  { id: 'REQ-002', title: 'IT Equipment Upgrade',     status: 'PENDING_APPROVAL', createdBy: 'Jane Smith',   date: 'Dec 08, 2024' },
  { id: 'REQ-003', title: 'Warehouse Shelving Units', status: 'RFQ_CREATED',      createdBy: 'Mike Johnson', date: 'Dec 06, 2024' },
  { id: 'REQ-004', title: 'Cleaning Supplies',        status: 'CREATED',          createdBy: 'Sarah Lee',    date: 'Dec 04, 2024' },
  { id: 'REQ-005', title: 'Safety Equipment',         status: 'OPEN',             createdBy: 'Tom Brown',    date: 'Dec 02, 2024' },
  { id: 'REQ-006', title: 'Server Room Cooling',      status: 'APPROVED',         createdBy: 'Emily Clark',  date: 'Nov 30, 2024' },
]

const STAGGER_DELAYS = [0, 75, 150, 225]

export default function ProcurementDashboard() {
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
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Procurement Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">{today}</p>
      </div>

      {/* Stat grid */}
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

      {/* Recent requisitions table */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Recent Requisitions</h2>
        <Table columns={COLUMNS}>
          {REQUISITION_ROWS.map((row, i) => (
            <tr
              key={row.id}
              className="hover:bg-gray-50 transition-colors duration-100 animate-fade-slide-up"
              style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
            >
              <Table.Td className="font-medium text-gray-900">{row.id}</Table.Td>
              <Table.Td>{row.title}</Table.Td>
              <Table.Td><Badge status={row.status} /></Table.Td>
              <Table.Td>{row.createdBy}</Table.Td>
              <Table.Td className="text-gray-400">{row.date}</Table.Td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}
