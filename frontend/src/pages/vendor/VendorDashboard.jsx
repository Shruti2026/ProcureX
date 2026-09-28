import { useMemo } from 'react'
import { ShoppingCart, FileText, Package, Receipt } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const STAT_CARDS = [
  {
    title: 'Open RFQs',
    value: 5,
    icon: ShoppingCart,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    title: 'My Quotations',
    value: 11,
    icon: FileText,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
    trend: { direction: 'up', label: '+2 submitted' },
  },
  {
    title: 'Active Orders',
    value: 3,
    icon: Package,
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50',
  },
  {
    title: 'Pending Invoices',
    value: 2,
    icon: Receipt,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
  },
]

const COLUMNS = ['PO Number', 'Item Description', 'Amount', 'Status', 'Date']

const PO_ROWS = [
  { id: 'PO-2024-089', description: 'Industrial Shelving Units (x20)',  amount: '$14,600', status: 'ACCEPTED',  date: 'Dec 10, 2024' },
  { id: 'PO-2024-085', description: 'Safety Helmets & Gear (x100)',     amount: '$4,200',  status: 'DELIVERED', date: 'Dec 07, 2024' },
  { id: 'PO-2024-081', description: 'Server Rack Equipment',            amount: '$28,500', status: 'APPROVED',  date: 'Dec 03, 2024' },
  { id: 'PO-2024-077', description: 'Office Chairs (x50)',              amount: '$9,750',  status: 'COMPLETED', date: 'Nov 28, 2024' },
  { id: 'PO-2024-072', description: 'Network Cables & Accessories',     amount: '$1,890',  status: 'COMPLETED', date: 'Nov 22, 2024' },
  { id: 'PO-2024-068', description: 'Forklift Battery Replacements',    amount: '$6,400',  status: 'CANCELLED', date: 'Nov 18, 2024' },
]

const STAGGER_DELAYS = [0, 75, 150, 225]

export default function VendorDashboard() {
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
        <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
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
        <h2 className="text-base font-semibold text-gray-800 mb-3">Recent Purchase Orders</h2>
        <Table columns={COLUMNS}>
          {PO_ROWS.map((row, i) => (
            <tr
              key={row.id}
              className="hover:bg-gray-50 transition-colors duration-100 animate-fade-slide-up"
              style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
            >
              <Table.Td className="font-medium text-gray-900">{row.id}</Table.Td>
              <Table.Td>{row.description}</Table.Td>
              <Table.Td className="font-medium">{row.amount}</Table.Td>
              <Table.Td><Badge status={row.status} /></Table.Td>
              <Table.Td className="text-gray-400">{row.date}</Table.Td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}
