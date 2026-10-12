import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, ShoppingCart, Clock, RefreshCw, Package, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { formatDate, formatCurrency } from '../../utils/formatters'
import { purchaseOrderService } from '../../services/purchaseOrderService'
import { getRequisitions } from '../../services/requisitionService'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const STAGGER_DELAYS = [0, 75, 150, 225]

const PO_COLUMNS = ['PO Number', 'Vendor', 'Total Amount', 'Status', 'Expected Delivery', 'Actions']

export default function ProcurementDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [kpiLoading, setKpiLoading] = useState(true)
  const [kpiError, setKpiError] = useState(false)
  const [kpi, setKpi] = useState({
    openRequisitions: 0,
    activeRfqs: 0,
    pendingPoApprovals: 0,
    monthlyPoValue: 0,
  })

  const [posLoading, setPosLoading] = useState(true)
  const [pos, setPos] = useState([])
  const [actionLoading, setActionLoading] = useState(null)

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    []
  )

  const loadKpis = async () => {
    setKpiLoading(true)
    setKpiError(false)
    try {
      const [reqRes, rfqRes, poApprovalRes, poAllRes] = await Promise.all([
        api.get('/api/v1/procurement/requisitions', { params: { status: 'CREATED', page: 0, size: 1 } }),
        api.get('/api/v1/procurement/rfqs', { params: { status: 'OPEN', page: 0, size: 1 } }),
        api.get('/api/v1/procurement/orders', { params: { status: 'CREATED', page: 0, size: 1 } }),
        api.get('/api/v1/procurement/orders', { params: { page: 0, size: 100 } }),
      ])

      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const poItems = poAllRes.data?.data?.content ?? poAllRes.data?.data ?? []
      const monthlyValue = poItems.reduce((sum, po) => {
        const created = po.createdAt ? new Date(po.createdAt) : null
        if (
          created &&
          created.getMonth() === currentMonth &&
          created.getFullYear() === currentYear
        ) {
          return sum + (po.totalAmount ?? 0)
        }
        return sum
      }, 0)

      setKpi({
        openRequisitions: reqRes.data?.data?.totalElements ?? 0,
        activeRfqs: rfqRes.data?.data?.totalElements ?? 0,
        pendingPoApprovals: poApprovalRes.data?.data?.totalElements ?? 0,
        monthlyPoValue: monthlyValue,
      })
    } catch (err) {
      setKpiError(true)
    } finally {
      setKpiLoading(false)
    }
  }

  const loadPos = async () => {
    setPosLoading(true)
    try {
      const res = await purchaseOrderService.getPOs({ page: 0, size: 10 })
      const items = res.data?.data?.content ?? res.data?.data ?? []
      setPos(items)
    } catch {
      // non-fatal — show empty table
    } finally {
      setPosLoading(false)
    }
  }

  useEffect(() => {
    loadKpis()
    loadPos()
  }, [])

  const handleApprove = async (po) => {
    setActionLoading(po.id)
    try {
      await purchaseOrderService.approvePO(po.id)
      toast.success('Purchase order approved')
      loadPos()
      loadKpis()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve purchase order')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (po) => {
    if (!window.confirm(`Cancel purchase order ${po.poNumber ?? po.id?.slice(-8).toUpperCase()}?`)) return
    setActionLoading(po.id)
    try {
      await purchaseOrderService.cancelPO(po.id)
      toast.success('Purchase order cancelled')
      loadPos()
      loadKpis()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel purchase order')
    } finally {
      setActionLoading(null)
    }
  }

  const isProcurementManager = user?.role === ROLES.PROCUREMENT_MANAGER || user?.role === ROLES.ADMIN

  const statCards = [
    {
      title: 'Open Requisitions',
      value: kpiLoading ? '—' : kpi.openRequisitions,
      icon: FileText,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      title: 'Active RFQs',
      value: kpiLoading ? '—' : kpi.activeRfqs,
      icon: ShoppingCart,
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-50',
    },
    {
      title: 'Pending PO Approvals',
      value: kpiLoading ? '—' : kpi.pendingPoApprovals,
      icon: Clock,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      title: 'Monthly PO Value',
      value: kpiLoading ? '—' : formatCurrency(kpi.monthlyPoValue),
      icon: Package,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Procurement Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">{today}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => { loadKpis(); loadPos() }}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {/* KPI error banner */}
      {kpiError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Failed to load KPI data. Check your connection and try refreshing.
        </div>
      )}

      {/* Stat grid */}
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

      {/* Recent Purchase Orders table */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Recent Purchase Orders</h2>
        <Table
          columns={PO_COLUMNS}
          loading={posLoading}
          empty={!posLoading && pos.length === 0}
          emptyMessage="No purchase orders found."
        >
          {pos.map((po, i) => (
            <tr
              key={po.id}
              className="hover:bg-gray-50 transition-colors duration-100 animate-fade-slide-up cursor-pointer"
              style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
              onClick={() => navigate(`/procurement/orders/${po.id}`)}
            >
              <Table.Td className="font-mono text-xs text-gray-600">
                {po.poNumber ?? po.id?.slice(-8).toUpperCase()}
              </Table.Td>
              <Table.Td className="font-medium text-gray-900">
                {po.vendorName ?? po.vendor?.companyName ?? '—'}
              </Table.Td>
              <Table.Td>{formatCurrency(po.totalAmount)}</Table.Td>
              <Table.Td><Badge status={po.status} /></Table.Td>
              <Table.Td>{formatDate(po.expectedDeliveryDate)}</Table.Td>
              <Table.Td>
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/procurement/orders/${po.id}`)}
                  >
                    View
                  </Button>
                  {po.status === 'CREATED' && isProcurementManager && (
                    <Button
                      variant="primary"
                      size="sm"
                      loading={actionLoading === po.id}
                      onClick={() => handleApprove(po)}
                    >
                      <CheckCircle size={13} />
                      Approve
                    </Button>
                  )}
                  {(po.status === 'CREATED' || po.status === 'APPROVED') && (
                    <Button
                      variant="danger"
                      size="sm"
                      loading={actionLoading === po.id}
                      onClick={() => handleCancel(po)}
                    >
                      <XCircle size={13} />
                      Cancel
                    </Button>
                  )}
                </div>
              </Table.Td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}
