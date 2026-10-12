import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boxes, Warehouse, ClipboardList, RefreshCw, Plus } from 'lucide-react'
import clsx from 'clsx'

import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { formatDate, shortId } from '../../utils/formatters'
import { warehouseService } from '../../services/warehouseService'
import { inventoryService } from '../../services/inventoryService'
import { grnService } from '../../services/grnService'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const STAGGER_DELAYS = [0, 75, 150]

const STOCK_COLUMNS = ['Product ID', 'Warehouse', 'Qty On Hand', 'Qty Reserved']
const GRN_COLUMNS   = ['GRN Number', 'Received At', 'Status', 'Actions']

export default function InventoryDashboard() {
  const navigate = useNavigate()

  const [kpiLoading, setKpiLoading] = useState(true)
  const [kpiError, setKpiError] = useState(false)
  const [kpi, setKpi] = useState({ warehouses: 0, stockItems: 0, pendingGrns: 0 })

  const [stockLoading, setStockLoading] = useState(true)
  const [stockItems, setStockItems] = useState([])

  const [grnsLoading, setGrnsLoading] = useState(true)
  const [pendingGrns, setPendingGrns] = useState([])

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

  const loadAll = async () => {
    setKpiLoading(true)
    setKpiError(false)
    setStockLoading(true)
    setGrnsLoading(true)

    try {
      const [whRes, stockRes, grnRes] = await Promise.all([
        warehouseService.getWarehouses(),
        inventoryService.getStock({ page: 0, size: 1 }),
        grnService.getGRNs({ status: 'PENDING_INSPECTION', page: 0, size: 1 }),
      ])

      const warehouses = whRes.data?.data ?? whRes.data ?? []
      const warehouseCount = Array.isArray(warehouses) ? warehouses.length : 0
      const stockCount = stockRes.data?.data?.totalElements ?? 0
      const grnCount   = grnRes.data?.data?.totalElements ?? 0

      setKpi({ warehouses: warehouseCount, stockItems: stockCount, pendingGrns: grnCount })
    } catch {
      setKpiError(true)
    } finally {
      setKpiLoading(false)
    }

    // Stock overview
    try {
      const res = await inventoryService.getStock({ page: 0, size: 10 })
      const items = res.data?.data?.content ?? res.data?.data ?? []
      setStockItems(items)
    } catch {
      // non-fatal
    } finally {
      setStockLoading(false)
    }

    // Pending GRNs
    try {
      const res = await grnService.getGRNs({ status: 'PENDING_INSPECTION', page: 0, size: 5 })
      const items = res.data?.data?.content ?? res.data?.data ?? []
      setPendingGrns(items)
    } catch {
      // non-fatal
    } finally {
      setGrnsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const statCards = [
    {
      title: 'Total Warehouses',
      value: kpiLoading ? '—' : kpi.warehouses,
      icon: Warehouse,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50',
    },
    {
      title: 'Stock Items',
      value: kpiLoading ? '—' : kpi.stockItems,
      icon: Boxes,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
    },
    {
      title: 'Pending GRNs',
      value: kpiLoading ? '—' : kpi.pendingGrns,
      icon: ClipboardList,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">{today}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadAll}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {kpiError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Failed to load KPI data. Check your connection and try refreshing.
        </div>
      )}

      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Stock overview table */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Stock Overview</h2>
        <Table
          columns={STOCK_COLUMNS}
          loading={stockLoading}
          empty={!stockLoading && stockItems.length === 0}
          emptyMessage="No stock items found."
        >
          {stockItems.map((item, i) => (
            <tr
              key={item.id ?? i}
              className="hover:bg-gray-50 transition-colors duration-100 animate-fade-slide-up"
              style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
            >
              <Table.Td className="font-mono text-xs text-gray-500">
                {shortId(item.productId ?? item.id)}
              </Table.Td>
              <Table.Td>{item.warehouseName ?? item.warehouse?.name ?? '—'}</Table.Td>
              <Table.Td
                className={clsx(
                  (item.quantityOnHand ?? 0) < 10 && 'bg-amber-50 text-amber-800 font-semibold'
                )}
              >
                {item.quantityOnHand ?? '—'}
              </Table.Td>
              <Table.Td>{item.quantityReserved ?? '—'}</Table.Td>
            </tr>
          ))}
        </Table>
      </div>

      {/* Pending GRNs section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">Pending Inspections</h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/inventory/grns')}
          >
            <Plus size={14} />
            Create GRN
          </Button>
        </div>
        <Table
          columns={GRN_COLUMNS}
          loading={grnsLoading}
          empty={!grnsLoading && pendingGrns.length === 0}
          emptyMessage="No pending GRNs."
        >
          {pendingGrns.map((grn, i) => (
            <tr
              key={grn.id ?? i}
              className="hover:bg-gray-50 transition-colors duration-100 animate-fade-slide-up"
              style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
            >
              <Table.Td className="font-mono text-xs text-gray-600">
                {grn.grnNumber ?? grn.id?.slice(-8).toUpperCase()}
              </Table.Td>
              <Table.Td>{formatDate(grn.receivedAt ?? grn.createdAt)}</Table.Td>
              <Table.Td><Badge status={grn.status} /></Table.Td>
              <Table.Td>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/inventory/grns/${grn.id}`)}
                >
                  View
                </Button>
              </Table.Td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}
