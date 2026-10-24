import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight, Plus, Eye, X, ClipboardList } from 'lucide-react'
import clsx from 'clsx'

import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import { formatDate } from '../../utils/formatters'
import { grnService } from '../../services/grnService'
import { purchaseOrderService } from '../../services/purchaseOrderService'
import { warehouseService } from '../../services/warehouseService'

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const STATUS_TABS = [
  { label: 'All',                 value: '' },
  { label: 'Pending Inspection',  value: 'PENDING_INSPECTION' },
  { label: 'Inspected',           value: 'INSPECTED' },
  { label: 'Closed',              value: 'CLOSED' },
]

const TABLE_COLUMNS = ['GRN Number', 'PO ID', 'Warehouse', 'Status', 'Received At', 'Actions']

/* ─────────────────────────────────────────
   CreateGRNModal — 3-step wizard
───────────────────────────────────────── */
function CreateGRNModal({ isOpen, onClose }) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1) // 1 = select PO, 2 = select warehouse, 3 = confirm quantities
  const [selectedPO, setSelectedPO] = useState(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)
  const [receivedQtys, setReceivedQtys] = useState({})

  /* Fetch approved POs */
  const { data: posData, isLoading: posLoading } = useQuery({
    queryKey: ['approved-pos-for-grn'],
    queryFn: () =>
      purchaseOrderService.getPOs({ status: 'APPROVED', page: 0, size: 50 })
        .then((res) => res.data?.data?.content ?? res.data?.data ?? []),
    enabled: isOpen && step === 1,
    staleTime: 60_000,
  })
  const approvedPOs = posData ?? []

  /* Fetch warehouses */
  const { data: warehousesData, isLoading: warehousesLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () =>
      warehouseService.getWarehouses().then((res) => res.data?.data ?? res.data ?? []),
    enabled: isOpen && step === 2,
    staleTime: 60_000,
  })
  const warehouses = Array.isArray(warehousesData) ? warehousesData : []

  const mutation = useMutation({
    mutationFn: (payload) => grnService.createGRN(payload),
    onSuccess: () => {
      toast.success('GRN created successfully')
      queryClient.invalidateQueries({ queryKey: ['grns'] })
      handleClose()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to create GRN')
    },
  })

  const handleClose = () => {
    setStep(1)
    setSelectedPO(null)
    setSelectedWarehouse(null)
    setReceivedQtys({})
    onClose()
  }

  const handleSelectPO = (po) => {
    setSelectedPO(po)
    const qtys = {}
    const items = po.items ?? po.lineItems ?? []
    items.forEach((item) => { qtys[item.id] = item.quantity ?? 1 })
    setReceivedQtys(qtys)
    setStep(2)
  }

  const handleSelectWarehouse = (wh) => {
    setSelectedWarehouse(wh)
    setStep(3)
  }

  const handleSubmit = () => {
    const items = (selectedPO?.items ?? selectedPO?.lineItems ?? []).map((item) => ({
      purchaseOrderItemId: item.id,
      productId: item.productId ?? item.product?.id,
      quantityReceived: Number(receivedQtys[item.id] ?? item.quantity),
    }))
    mutation.mutate({
      purchaseOrderId: selectedPO.id,
      warehouseId: selectedWarehouse.warehouseId,
      items,
    })
  }

  if (!isOpen) return null

  const poItems = selectedPO?.items ?? selectedPO?.lineItems ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Create GRN</h2>
                <p className="text-xs text-primary-100">
                  Step {step} of 3:{' '}
                  {step === 1 ? 'Select Purchase Order' : step === 2 ? 'Select Warehouse' : 'Confirm Quantities'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={clsx(
                    'h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold',
                    step >= s
                      ? 'bg-white text-primary-700'
                      : 'bg-white/20 text-white/60'
                  )}
                >
                  {s}
                </div>
                {s < 3 && <div className="h-px w-8 bg-white/30" />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-6">

          {/* Step 1: Select PO */}
          {step === 1 && (
            <div className="space-y-3">
              {posLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : approvedPOs.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No approved purchase orders available.</p>
              ) : (
                approvedPOs.map((po) => (
                  <button
                    key={po.id}
                    type="button"
                    onClick={() => handleSelectPO(po)}
                    className="w-full text-left rounded-xl border border-gray-200 bg-gray-50 hover:bg-primary-50 hover:border-primary-200 transition-colors p-4 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {po.poNumber ?? po.id?.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {po.vendorName ?? po.vendor?.companyName ?? '—'}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {po.totalAmount != null
                          ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(po.totalAmount)
                          : '—'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step 2: Select warehouse */}
          {step === 2 && (
            <div className="space-y-3">
              {warehousesLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : warehouses.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No warehouses available.</p>
              ) : (
                warehouses.map((wh) => (
                  <button
                    key={wh.warehouseId}
                    type="button"
                    onClick={() => handleSelectWarehouse(wh)}
                    className="w-full text-left rounded-xl border border-gray-200 bg-gray-50 hover:bg-primary-50 hover:border-primary-200 transition-colors p-4 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    <p className="text-sm font-semibold text-gray-800">{wh.warehouseName}</p>
                    {wh.location && (
                      <p className="text-xs text-gray-500 mt-0.5">{wh.location}</p>
                    )}
                  </button>
                ))
              )}
              <div className="pt-2">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  <ChevronLeft size={14} />
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm quantities */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">PO:</span>{' '}
                  {selectedPO?.poNumber ?? selectedPO?.id?.slice(-8).toUpperCase()}
                </p>
                <p className="text-gray-700 mt-1">
                  <span className="font-medium">Warehouse:</span>{' '}
                  {selectedWarehouse?.warehouseName}
                </p>
              </div>

              {poItems.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No line items on this PO.</p>
              ) : (
                <div className="space-y-3">
                  {poItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {item.productName ?? item.product?.name ?? '—'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Ordered: {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600 whitespace-nowrap">
                          Received Qty
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={item.quantity}
                          value={receivedQtys[item.id] ?? item.quantity}
                          onChange={(e) =>
                            setReceivedQtys((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 gap-3">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                  <ChevronLeft size={14} />
                  Back
                </Button>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={handleClose} disabled={mutation.isPending}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    loading={mutation.isPending}
                    onClick={handleSubmit}
                    disabled={poItems.length === 0}
                  >
                    Create GRN
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   GrnsPage
───────────────────────────────────────── */
export default function GrnsPage() {
  const navigate = useNavigate()
  const [activeStatus, setActiveStatus] = useState('')
  const [page, setPage] = useState(0)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['grns', { status: activeStatus, page }],
    queryFn: () =>
      grnService.getGRNs({
        ...(activeStatus ? { status: activeStatus } : {}),
        page,
        size: 20,
      }).then((res) => res.data?.data),
    keepPreviousData: true,
  })

  const grns = data?.content ?? data ?? []
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
          <h1 className="text-2xl font-bold text-gray-900">Goods Received Notes (GRN)</h1>
          <p className="mt-1 text-sm text-gray-500">
            Process incoming shipments, inspect goods, and record receipts against purchase orders.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} />
          Create GRN
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
        empty={!isLoading && grns.length === 0}
        emptyMessage="No GRNs found."
      >
        {grns.map((grn) => (
          <tr
            key={grn.grnId}
            className="hover:bg-gray-50 transition-colors duration-100 cursor-pointer"
            onClick={() => navigate(`/inventory/grns/${grn.grnId}`)}
          >
            <Table.Td className="font-mono text-xs text-gray-600">
              {grn.grnNumber ?? grn.id?.slice(-8).toUpperCase()}
            </Table.Td>
            <Table.Td className="font-mono text-xs text-gray-500">
              {grn.purchaseOrderId?.slice(-8).toUpperCase() ?? '—'}
            </Table.Td>
            <Table.Td>{grn.warehouseName ?? grn.warehouse?.name ?? '—'}</Table.Td>
            <Table.Td><Badge status={grn.status} /></Table.Td>
            <Table.Td>{formatDate(grn.receivedAt ?? grn.createdAt)}</Table.Td>
            <Table.Td>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/inventory/grns/${grn.grnId}`)
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
      {!isLoading && grns.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />
      )}

      {/* Create GRN Modal */}
      <CreateGRNModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  )
}
