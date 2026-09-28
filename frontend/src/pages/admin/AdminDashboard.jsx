import { useMemo } from 'react'
import { Users, ShieldCheck, Clock, Activity } from 'lucide-react'
import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const STAT_CARDS = [
  {
    title: 'Total Users',
    value: 48,
    icon: Users,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
    trend: { direction: 'up', label: '+3 this month' },
  },
  {
    title: 'Active Vendors',
    value: 23,
    icon: ShieldCheck,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    title: 'Pending Approvals',
    value: 5,
    icon: Clock,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    trend: { direction: 'up', label: '2 new today' },
  },
  {
    title: 'System Uptime',
    value: '99.9%',
    icon: Activity,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
  },
]

const COLUMNS = ['User', 'Action', 'Module', 'Timestamp']

const ACTIVITY_ROWS = [
  { id: 1, user: 'admin@procurex.com',   action: 'Approved vendor',      module: 'Auth',        time: 'Today, 10:42 AM'     },
  { id: 2, user: 'manager@procurex.com', action: 'Created requisition',  module: 'Procurement', time: 'Today, 09:17 AM'     },
  { id: 3, user: 'vendor@acme.com',      action: 'Submitted quotation',  module: 'Procurement', time: 'Today, 08:55 AM'     },
  { id: 4, user: 'inv@procurex.com',     action: 'Updated stock levels', module: 'Inventory',   time: 'Yesterday, 4:30 PM'  },
  { id: 5, user: 'finance@procurex.com', action: 'Verified invoice',     module: 'Finance',     time: 'Yesterday, 3:15 PM'  },
  { id: 6, user: 'admin@procurex.com',   action: 'Reset user password',  module: 'Auth',        time: 'Yesterday, 11:00 AM' },
]

const STAGGER_DELAYS = [0, 75, 150, 225]

export default function AdminDashboard() {
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
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
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

      {/* Recent activity table */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Recent Activity</h2>
        <Table columns={COLUMNS}>
          {ACTIVITY_ROWS.map((row, i) => (
            <tr
              key={row.id}
              className="hover:bg-gray-50 transition-colors duration-100 animate-fade-slide-up"
              style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
            >
              <Table.Td>{row.user}</Table.Td>
              <Table.Td>{row.action}</Table.Td>
              <Table.Td>
                <Badge status={row.module.toUpperCase()} label={row.module} />
              </Table.Td>
              <Table.Td className="text-gray-400">{row.time}</Table.Td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}
