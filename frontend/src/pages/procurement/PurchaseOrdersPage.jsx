import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, RefreshCw, Eye, Package } from 'lucide-react'
import clsx from 'clsx'

import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import { formatDate, formatCurrency } from '../../utils/formatters'
import { purchaseOrderService } from '../../services/purchaseOrderService'

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const STATUS_TABS = [
  { label: 'All',       value: '' },
  { label: 'Created',   value: 'CREATED' },
  { label: 'Approved',  value: 'APPROVED' },
  { label: 'Accepted',  value: 'ACCEPTED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

const TABLE_COLUMNS = ['PO Number', 'Vendor', 'Total Amount', 'Status', 'Expected Delivery', 'Actions']

/* ─────────────────────────────────────────
   PurchaseOrdersPage
───────────────────────────────────────── */
export default function PurchaseOrdersPage() {
  const navigate = useNavigate()
  const [activeStatus, setActiveStatus] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['purchase-orders', { status: activeStatus, page }],
    queryFn: () =>
      purchaseOrderService.getPOs({
        ...(activeStatus ? { status: activeStatus } : {}),
        page,
        size: 20,
      }).then((res) => res.data?.data),
    keepPreviousData: true,
  })

  const orders = data?.content ?? data ?? []
  const totalPages = data?.totalPages ?? 1
  const isFirst = page === 0
  const isLast = page >= totalPages - 1

  const handleStatusChange = (value) => {
    setActiveStatus(value)
    setPage(0)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage all purchase orders with suppliers.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleStatusChange(tab.value)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none whitespace-nowrap',
              activeStatus === tab.value
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Table
        columns={TABLE_COLUMNS}
        loading={isLoading}
        empty={!isLoading && orders.length === 0}
        emptyMessage="No purchase orders found."
      >
        {orders.map((po) => (
          <tr
            key={po.id}
            className="hover:bg-gray-50 transition-colors duration-100 cursor-pointer"
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
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/procurement/orders/${po.id}`)
                }}
              >
                <Eye size={14} />
                View
              </Button>
            </Table.Td>
          </tr>
        ))}
      </Table>

      {/* Pagination */}
      {!isLoading && orders.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-gray-500">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={isFirst}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={15} />
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={isLast}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
