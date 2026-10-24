import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'

import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import Spinner from '../../components/ui/Spinner'
import { formatDate, formatDateTime } from '../../utils/formatters'
import { grnService } from '../../services/grnService'

const GRN_ITEMS_COLUMNS      = ['Product Name', 'Qty Ordered', 'Qty Received']
const INSPECTION_IN_COLUMNS  = ['Product Name', 'Accepted Qty', 'Rejected Qty', 'Input']
const INSPECTION_OUT_COLUMNS = ['Product Name', 'Accepted Qty', 'Rejected Qty', 'Reason']

export default function GrnDetailPage() {
  const { grnId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  /* Per-item inspection form state: { [itemId]: { acceptedQty, rejectedQty, reason } } */
  const [inspection, setInspection] = useState({})
  const [inspectLoading, setInspectLoading] = useState(false)
  const [formError, setFormError] = useState('')

  /* Fetch GRN */
  const { data: grn, isLoading, isError } = useQuery({
    queryKey: ['grn', grnId],
    queryFn: () => grnService.getGRNById(grnId).then((res) => res.data?.data),
    retry: (failCount, err) => {
      if (err?.response?.status === 404) return false
      return failCount < 2
    },
  })

  /* Fetch inspection results (if status is not PENDING_INSPECTION) */
  const { data: inspectionData, isLoading: inspectionLoading } = useQuery({
    queryKey: ['grn-inspection', grnId],
    queryFn: () => grnService.getInspectionByGrn(grnId).then((res) => res.data?.data),
    enabled: !!grn && grn.status !== 'PENDING_INSPECTION',
    retry: false,
  })

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" className="text-primary-500" />
      </div>
    )
  }

  /* ── Error / not found ── */
  if (isError || !grn) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/grns')}>
          <ArrowLeft size={15} />
          Back to GRNs
        </Button>
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">GRN not found.</p>
        </div>
      </div>
    )
  }

  const grnItems = grn.items ?? grn.grnItems ?? []

  /* Initialize inspection state for an item if not set */
  const getInspectionForItem = (item) => {
    if (!inspection[item.id]) {
      return { acceptedQty: item.receivedQuantity ?? item.quantityReceived ?? 0, rejectedQty: 0, reason: '' }
    }
    return inspection[item.id]
  }

  const setItemInspection = (itemId, field, value) => {
    setInspection((prev) => ({
      ...prev,
      [itemId]: {
        ...getInspectionForItem({ id: itemId }),
        ...prev[itemId],
        [field]: value,
      },
    }))
    setFormError('')
  }

  const handleSubmitInspection = async () => {
    // Validate: accepted + rejected must equal received for each item
    for (const item of grnItems) {
      const received = item.receivedQuantity ?? item.quantityReceived ?? 0
      const state = getInspectionForItem(item)
      const accepted = Number(state.acceptedQty ?? 0)
      const rejected = Number(state.rejectedQty ?? 0)
      if (accepted + rejected !== Number(received)) {
        setFormError(
          `For "${item.productName ?? item.product?.name ?? item.id}": accepted (${accepted}) + rejected (${rejected}) must equal received (${received}).`
        )
        return
      }
    }
    setFormError('')
    setInspectLoading(true)
    try {
      await grnService.submitInspection({
        grnId,
        items: grnItems.map((item) => {
          const state = getInspectionForItem(item)
          return {
            grnItemId: item.id,
            productId: item.productId ?? item.product?.id,
            acceptedQuantity: Number(state.acceptedQty ?? 0),
            rejectedQuantity: Number(state.rejectedQty ?? 0),
            reasonForRejection: state.reason || null,
          }
        }),
      })
      toast.success('Inspection submitted successfully')
      queryClient.invalidateQueries({ queryKey: ['grn', grnId] })
      queryClient.invalidateQueries({ queryKey: ['grn-inspection', grnId] })
      queryClient.invalidateQueries({ queryKey: ['grns'] })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit inspection')
    } finally {
      setInspectLoading(false)
    }
  }

  const inspectionItems = inspectionData?.items ?? inspectionData ?? []

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/grns')}>
        <ArrowLeft size={15} />
        Back to GRNs
      </Button>

      {/* GRN Header card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                {grn.grnNumber ?? grn.id?.slice(-8).toUpperCase()}
              </span>
              <Badge status={grn.status} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Goods Received Note
            </h1>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-100 pt-5">
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">PO ID</dt>
            <dd className="mt-1 text-sm font-medium text-gray-800 font-mono">
              {grn.purchaseOrderId?.slice(-8).toUpperCase() ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Warehouse</dt>
            <dd className="mt-1 text-sm font-medium text-gray-800">
              {grn.warehouseName ?? grn.warehouse?.name ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Received At</dt>
            <dd className="mt-1 text-sm font-medium text-gray-800">
              {formatDateTime(grn.receivedAt ?? grn.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Items</dt>
            <dd className="mt-1 text-sm font-medium text-gray-800">{grnItems.length}</dd>
          </div>
        </dl>
      </div>

      {/* GRN Items table */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">GRN Items</h2>
        <Table
          columns={GRN_ITEMS_COLUMNS}
          empty={grnItems.length === 0}
          emptyMessage="No items on this GRN."
        >
          {grnItems.map((item, i) => (
            <tr key={item.id ?? i} className="hover:bg-gray-50 transition-colors duration-100">
              <Table.Td className="font-medium text-gray-900">
                {item.productName ?? item.product?.name ?? '—'}
              </Table.Td>
              <Table.Td>{item.orderedQuantity ?? item.quantityOrdered ?? '—'}</Table.Td>
              <Table.Td>{item.receivedQuantity ?? item.quantityReceived ?? '—'}</Table.Td>
            </tr>
          ))}
        </Table>
      </div>

      {/* Conditional inspection section */}
      {grn.status === 'PENDING_INSPECTION' && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Inspection Form</h2>

          {formError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {INSPECTION_IN_COLUMNS.map((col) => (
                    <th
                      key={col}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {grnItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                      No items to inspect.
                    </td>
                  </tr>
                ) : (
                  grnItems.map((item, i) => {
                    const state = getInspectionForItem(item)
                    const received = Number(item.receivedQuantity ?? item.quantityReceived ?? 0)
                    return (
                      <tr key={item.id ?? i} className="hover:bg-gray-50 transition-colors duration-100">
                        <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                          {item.productName ?? item.product?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            max={received}
                            value={state.acceptedQty}
                            onChange={(e) => setItemInspection(item.id, 'acceptedQty', e.target.value)}
                            className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            max={received}
                            value={state.rejectedQty}
                            onChange={(e) => setItemInspection(item.id, 'rejectedQty', e.target.value)}
                            className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder="Reason (optional)"
                            value={state.reason}
                            onChange={(e) => setItemInspection(item.id, 'reason', e.target.value)}
                            className="w-48 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                          />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              variant="primary"
              loading={inspectLoading}
              onClick={handleSubmitInspection}
              disabled={grnItems.length === 0}
            >
              Submit Inspection
            </Button>
          </div>
        </div>
      )}

      {(grn.status === 'INSPECTED' || grn.status === 'CLOSED') && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Inspection Summary</h2>
          {inspectionLoading ? (
            <div className="flex justify-center py-10">
              <Spinner size="lg" className="text-primary-500" />
            </div>
          ) : (
            <Table
              columns={INSPECTION_OUT_COLUMNS}
              empty={inspectionItems.length === 0}
              emptyMessage="No inspection data available."
            >
              {inspectionItems.map((item, i) => (
                <tr key={item.id ?? i} className="hover:bg-gray-50 transition-colors duration-100">
                  <Table.Td className="font-medium text-gray-900">
                    {item.productName ?? item.product?.name ?? '—'}
                  </Table.Td>
                  <Table.Td>{item.acceptedQuantity ?? '—'}</Table.Td>
                  <Table.Td>{item.rejectedQuantity ?? '—'}</Table.Td>
                  <Table.Td className="text-gray-500">{item.rejectionReason || '—'}</Table.Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      )}
    </div>
  )
}
