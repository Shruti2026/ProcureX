import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ChevronLeft, FileText, Calendar, Users, XCircle } from 'lucide-react'

import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import { getRFQById, closeRFQ } from '../../services/rfqService'
import { formatDate, formatDateTime } from '../../utils/formatters'

/* ─────────────────────────────────────────
   RFQDetailPage
───────────────────────────────────────── */
export default function RFQDetailPage() {
  const { rfqId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: rfq, isLoading, isError } = useQuery({
    queryKey: ['rfq', rfqId],
    queryFn: () => getRFQById(rfqId),
    enabled: !!rfqId,
  })

  const closeMutation = useMutation({
    mutationFn: () => closeRFQ(rfqId),
    onSuccess: () => {
      toast.success('RFQ closed successfully')
      queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] })
      queryClient.invalidateQueries({ queryKey: ['rfqs'] })
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to close RFQ')
    },
  })

  const handleClose = () => {
    if (!window.confirm('Close this RFQ? Vendors will no longer be able to submit quotations.')) return
    closeMutation.mutate()
  }

  const canCloseRFQ =
    rfq?.status === 'OPEN' && user?.role === 'PROCUREMENT_MANAGER'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !rfq) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} />
          Back
        </Button>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500">Failed to load RFQ details.</p>
        </div>
      </div>
    )
  }

  const invitedVendors = rfq.invitedVendors ?? []
  const isConcluded = rfq.status === 'CLOSED' || rfq.status === 'AWARDED'

  return (
    <div className="space-y-6">

      {/* Back + Actions */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} />
          Back to RFQs
        </Button>

        {canCloseRFQ && (
          <Button
            variant="danger"
            onClick={handleClose}
            loading={closeMutation.isPending}
          >
            <XCircle size={16} />
            Close RFQ
          </Button>
        )}
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                <FileText className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs font-mono text-gray-400">{rfq.rfqNumber}</p>
                <h1 className="text-2xl font-bold text-gray-900">
                  {rfq.requisitionTitle ?? rfq.requisition?.title ?? 'RFQ Details'}
                </h1>
              </div>
            </div>

            <Badge status={rfq.status} />
          </div>
        </div>

        {/* Meta grid */}
        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
              <Calendar size={12} />
              Issue Date
            </dt>
            <dd className="text-sm font-semibold text-gray-900">
              {formatDate(rfq.issueDate ?? rfq.createdAt)}
            </dd>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
              <Calendar size={12} />
              Closing Date
            </dt>
            <dd className="text-sm font-semibold text-gray-900">
              {formatDate(rfq.closingDate)}
            </dd>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
              <Users size={12} />
              Vendors Invited
            </dt>
            <dd className="text-sm font-semibold text-gray-900">
              {invitedVendors.length}
            </dd>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <dt className="text-xs font-medium text-gray-500 mb-1">Status</dt>
            <dd>
              <Badge status={rfq.status} />
            </dd>
          </div>
        </dl>
      </div>

      {/* Day 5 placeholder for closed/awarded */}
      {isConcluded && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-4">
          <p className="text-sm text-blue-700 font-medium">
            Quotation collection will be available in Day 5.
          </p>
        </div>
      )}

      {/* Invited Vendors table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Invited Vendors</h2>

        <Table
          columns={['Company Name', 'Invitation Status', 'Invited At']}
          empty={invitedVendors.length === 0}
          emptyMessage="No vendors have been invited."
        >
          {invitedVendors.map((inv) => (
            <tr
              key={inv.invitationId ?? inv.vendorId ?? inv.vendor?.vendorId}
              className="hover:bg-gray-50 transition-colors duration-100"
            >
              <Table.Td className="font-medium text-gray-900">
                {inv.companyName ?? inv.vendor?.companyName ?? '—'}
              </Table.Td>
              <Table.Td>
                <Badge status={inv.invitationStatus ?? inv.status} />
              </Table.Td>
              <Table.Td className="text-gray-500">
                {formatDate(inv.invitedAt ?? inv.createdAt)}
              </Table.Td>
            </tr>
          ))}
        </Table>
      </div>

    </div>
  )
}
