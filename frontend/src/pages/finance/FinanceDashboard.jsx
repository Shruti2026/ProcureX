import { useMemo } from 'react'
import { Receipt, CheckCircle2, Tag, CreditCard } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const STAT_CARDS = [
  {
    title: 'Pending Invoices',
    value: 14,
    icon: Receipt,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    trend: { direction: 'up', label: '+3 this week' },
  },
  {
    title: 'Verified Invoices',
    value: 57,
    icon: CheckCircle2,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
    trend: { direction: 'up', label: '+8 this month' },
  },
  {
    title: 'Active Budgets',
    value: 8,
    icon: Tag,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
  },
  {
    title: 'Payments This Month',
    value: '$124,500',
    icon: CreditCard,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    trend: { direction: 'up', label: '+12% vs last month' },
  },
]

const COLUMNS = ['Invoice ID', 'Vendor', 'Amount', 'Status', 'Date']

const INVOICE_ROWS = [
  { id: 'INV-2024-041', vendor: 'Acme Supplies Ltd',    amount: '$12,400', status: 'PENDING_VERIFICATION', date: 'Dec 10, 2024' },
  { id: 'INV-2024-040', vendor: 'TechPro Solutions',    amount: '$8,750',  status: 'VERIFIED',             date: 'Dec 09, 2024' },
  { id: 'INV-2024-039', vendor: 'Global Parts Inc',     amount: '$31,200', status: 'PAID',                 date: 'Dec 07, 2024' },
  { id: 'INV-2024-038', vendor: 'Office Depot Co',      amount: '$2,150',  status: 'FLAGGED_VARIANCE',     date: 'Dec 06, 2024' },
  { id: 'INV-2024-037', vendor: 'Warehouse Essentials', amount: '$18,900', status: 'VERIFIED',             date: 'Dec 04, 2024' },
  { id: 'INV-2024-036', vendor: 'FastShip Logistics',   amount: '$5,600',  status: 'PAID',                 date: 'Dec 02, 2024' },
]

const STAGGER_DELAYS = [0, 75, 150, 225]

export default function FinanceDashboard() {
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
        <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
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
        <h2 className="text-base font-semibold text-gray-800 mb-3">Recent Invoices</h2>
        <Table columns={COLUMNS}>
          {INVOICE_ROWS.map((row, i) => (
            <tr
              key={row.id}
              className="hover:bg-gray-50 transition-colors duration-100 animate-fade-slide-up"
              style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
            >
              <Table.Td className="font-medium text-gray-900">{row.id}</Table.Td>
              <Table.Td>{row.vendor}</Table.Td>
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
