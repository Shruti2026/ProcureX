import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import clsx from 'clsx'

import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import CreateRFQModal from '../../components/procurement/CreateRFQModal'
import { getRFQs } from '../../services/rfqService'
import { formatDate } from '../../utils/formatters'

/* ─────────────────────────────────────────
   Configuration
───────────────────────────────────────── */
const STATUS_TABS = [
  { label: 'All', value: 'ALL' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Awarded', value: 'AWARDED' },
]

const TABLE_COLUMNS = ['RFQ Number', 'Requisition Title', 'Issue Date', 'Closing Date', 'Vendors', 'Status']

/* ─────────────────────────────────────────
   RfqsPage
───────────────────────────────────────── */
export default function RfqsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('ALL')
  const [page, setPage] = useState(0)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['rfqs', activeTab, page],
    queryFn: () =>
      getRFQs({
        ...(activeTab !== 'ALL' ? { status: activeTab } : {}),
        page,
        size: 10,
      }),
    keepPreviousData: true,
  })

  const rfqs = data?.content ?? (Array.isArray(data) ? data : [])
  const totalPages = data?.totalPages ?? 1
  const isFirst = page === 0
  const isLast = page >= totalPages - 1

  const handleTabChange = (value) => {
    setActiveTab(value)
    setPage(0)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requests for Quotation</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create quotation requests, invite suppliers, and compare bids.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={16} />
          Create RFQ
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleTabChange(tab.value)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none',
              activeTab === tab.value
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
        empty={!isLoading && rfqs.length === 0}
        emptyMessage="No RFQs found."
      >
        {rfqs.map((rfq) => (
          <tr
            key={rfq.rfqId ?? rfq.id}
            className="hover:bg-gray-50 transition-colors duration-100 cursor-pointer"
            onClick={() => navigate(`/procurement/rfqs/${rfq.rfqId ?? rfq.id}`)}
          >
            <Table.Td className="font-mono text-xs text-gray-500">
              {rfq.rfqNumber ?? '—'}
            </Table.Td>
            <Table.Td className="font-medium text-gray-900 max-w-[220px] truncate">
              {rfq.requisitionTitle ?? rfq.requisition?.title ?? '—'}
            </Table.Td>
            <Table.Td>{formatDate(rfq.issueDate ?? rfq.createdAt)}</Table.Td>
            <Table.Td>{formatDate(rfq.closingDate)}</Table.Td>
            <Table.Td>
              {rfq.invitedVendors?.length ?? rfq.vendorCount ?? 0}
            </Table.Td>
            <Table.Td>
              <Badge status={rfq.status} />
            </Table.Td>
          </tr>
        ))}
      </Table>

      {/* Pagination */}
      {!isLoading && rfqs.length > 0 && (
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
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={isLast}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create RFQ Modal */}
      <CreateRFQModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['rfqs'] })}
      />
    </div>
  )
}
