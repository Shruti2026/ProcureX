import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { Receipt, CheckCircle2, Tag, CreditCard, Eye, Play, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { formatDate, formatCurrency } from '../../utils/formatters'
import api from '../../services/api'
import { invoiceService } from '../../services/invoiceService'
import { budgetService } from '../../services/budgetService'
import { paymentService } from '../../services/paymentService'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { ROLES } from '../../constants/roles'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const STAGGER_DELAYS = [0, 75, 150, 225]
const RECENT_COLUMNS = ['Invoice Number', 'Vendor ID', 'Amount', 'Status', 'Submitted', 'Actions']

export default function FinanceDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isDark } = useTheme()

  const [kpi, setKpi] = useState({ pending: 0, flagged: 0, budgets: 0, paymentsTotal: 0 })
  const [kpiLoading, setKpiLoading] = useState(true)
  const [invoices, setInvoices] = useState([])
  const [invoicesLoading, setInvoicesLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [budgets, setBudgets] = useState([])

  const today = useMemo(
    () => new Date().toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
    []
  )

  useEffect(() => {
    loadKpis()
    loadRecentInvoices()
  }, [])

  const loadKpis = async () => {
    setKpiLoading(true)
    try {
      const [pendingRes, flaggedRes, budgetRes, paymentsRes] = await Promise.all([
        invoiceService.getInvoices({ status: 'PENDING_VERIFICATION', page: 0, size: 1 }),
        invoiceService.getInvoices({ status: 'FLAGGED_VARIANCE', page: 0, size: 1 }),
        budgetService.getBudgets({ page: 0, size: 1 }),
        paymentService.getPayments({ page: 0, size: 100 }),
      ])

      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const payments = paymentsRes.data?.data?.content ?? []
      const paymentsTotal = payments.reduce((sum, p) => {
        const initiated = p.initiatedAt ? new Date(p.initiatedAt) : null
        if (initiated && initiated.getMonth() === currentMonth && initiated.getFullYear() === currentYear) {
          return sum + (parseFloat(p.amount) || 0)
        }
        return sum
      }, 0)

      setKpi({
        pending: pendingRes.data?.data?.totalElements ?? 0,
        flagged: flaggedRes.data?.data?.totalElements ?? 0,
        budgets: budgetRes.data?.data?.totalElements ?? 0,
        paymentsTotal,
      })

      api.get('/api/v1/finance/budgets?page=0&size=50').then(r => {
        const data = r.data?.data?.content ?? r.data?.data ?? []
        setBudgets(data.map(b => ({
          department: b.departmentName ?? b.department ?? b.name ?? 'Unknown',
          used: b.usedAmount ?? b.spentAmount ?? 0,
          allocated: b.allocatedAmount ?? b.totalAmount ?? 1,
        })))
      }).catch(() => {})
    } catch {
      // silent — stat cards will show 0
    } finally {
      setKpiLoading(false)
    }
  }

  const loadRecentInvoices = async () => {
    setInvoicesLoading(true)
    try {
      const res = await invoiceService.getInvoices({ page: 0, size: 10 })
      setInvoices(res.data?.data?.content ?? [])
    } catch {
      // silent
    } finally {
      setInvoicesLoading(false)
    }
  }

  const handleRunMatch = async (invoiceId) => {
    setActionLoading(invoiceId + '-match')
    try {
      await invoiceService.runMatch(invoiceId)
      toast.success('Three-way match completed')
      loadRecentInvoices()
      loadKpis()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Match failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = async (invoiceId) => {
    setActionLoading(invoiceId + '-approve')
    try {
      await invoiceService.approveInvoice(invoiceId)
      toast.success('Invoice approved')
      loadRecentInvoices()
      loadKpis()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Approval failed')
    } finally {
      setActionLoading(null)
    }
  }

  const isFinanceManager = user?.role === ROLES.FINANCE_MANAGER || user?.role === ROLES.ADMIN

  const statCards = [
    {
      title: 'Pending Invoices',
      value: kpiLoading ? '...' : kpi.pending,
      icon: Receipt,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      title: 'Flagged Invoices',
      value: kpiLoading ? '...' : kpi.flagged,
      icon: CheckCircle2,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
    },
    {
      title: 'Active Budgets',
      value: kpiLoading ? '...' : kpi.budgets,
      icon: Tag,
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-50',
    },
    {
      title: 'Payments This Month',
      value: kpiLoading ? '...' : formatCurrency(kpi.paymentsTotal),
      icon: CreditCard,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/60">{today}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <StatCard
            key={card.title}
            {...card}
            style={{ animationDelay: reducedMotion ? '0ms' : `${STAGGER_DELAYS[i]}ms` }}
          />
        ))}
      </div>

      {budgets.length > 0 && (
        <div className="bg-white dark:bg-white/5 dark:backdrop-blur-sm rounded-xl border border-gray-200 dark:border-white/10 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Budget Utilization</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart layout="vertical" data={budgets} margin={{ left: 20 }}>
              <CartesianGrid stroke={isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'} />
              <XAxis
                type="number"
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}
              />
              <YAxis
                type="category"
                dataKey="department"
                width={120}
                tick={{ fill: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-slate-900 dark:bg-[#1A1035] text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-slate-700 dark:border-white/10">
                      <p className="font-semibold text-slate-300 mb-1">{label}</p>
                      {payload.map((entry, i) => {
                        const pct = entry.payload.allocated
                          ? ((entry.payload.used / entry.payload.allocated) * 100).toFixed(1)
                          : entry.value
                        return (
                          <p key={i} style={{color: entry.color}}>{entry.name}: {pct}%</p>
                        )
                      })}
                    </div>
                  )
                }}
              />
              <Bar dataKey="used" fill="#4f46e5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-3">Recent Invoices</h2>
        <Table
          columns={RECENT_COLUMNS}
          loading={invoicesLoading}
          empty={!invoicesLoading && invoices.length === 0}
          emptyMessage="No invoices found."
        >
          {invoices.map((inv, i) => (
            <tr
              key={inv.invoiceId}
              className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-100 animate-fade-slide-up cursor-pointer"
              style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
              onClick={() => navigate(`/finance/invoices/${inv.invoiceId}`)}
            >
              <Table.Td className="font-medium text-gray-900 dark:text-white">{inv.invoiceNumber}</Table.Td>
              <Table.Td className="text-gray-400 dark:text-white/40 font-mono text-xs">{inv.vendorId?.slice(-8).toUpperCase()}</Table.Td>
              <Table.Td className="font-medium">{formatCurrency(inv.invoiceAmount)}</Table.Td>
              <Table.Td><Badge status={inv.status} /></Table.Td>
              <Table.Td className="text-gray-400 dark:text-white/40">{formatDate(inv.submittedAt)}</Table.Td>
              <Table.Td onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  {inv.status === 'PENDING_VERIFICATION' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={actionLoading === inv.invoiceId + '-match'}
                      onClick={() => handleRunMatch(inv.invoiceId)}
                    >
                      <Play size={12} />
                      Run Match
                    </Button>
                  )}
                  {inv.status === 'VERIFIED' && isFinanceManager && (
                    <Button
                      size="sm"
                      variant="primary"
                      loading={actionLoading === inv.invoiceId + '-approve'}
                      onClick={() => handleApprove(inv.invoiceId)}
                    >
                      <CheckCircle size={12} />
                      Approve
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/finance/invoices/${inv.invoiceId}`)}
                  >
                    <Eye size={12} />
                    View
                  </Button>
                </div>
              </Table.Td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}
