import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { Eye, Plus, PlusCircle, Trash2, X, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import clsx from 'clsx'

import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import Spinner from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'
import { formatDate } from '../../utils/formatters'
import {
  getRequisitions,
  createRequisition,
  getProducts,
} from '../../services/requisitionService'

/* ─────────────────────────────────────────
   Validation schema for CreateRequisitionModal
───────────────────────────────────────── */
const createSchema = yup.object({
  title: yup
    .string()
    .required('Title is required')
    .max(150, 'Title must be 150 characters or fewer'),
  requiredDate: yup
    .string()
    .required('Required date is required'),
  description: yup.string().optional(),
  items: yup
    .array()
    .of(
      yup.object({
        productId: yup.string().required('Product is required'),
        quantity: yup
          .number()
          .typeError('Quantity must be a number')
          .min(1, 'Minimum quantity is 1')
          .required('Quantity is required'),
        remarks: yup.string().optional(),
      })
    )
    .min(1, 'At least one item is required'),
})

/* ─────────────────────────────────────────
   Status filter tabs configuration
───────────────────────────────────────── */
const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Created', value: 'CREATED' },
  { label: 'RFQ Created', value: 'RFQ_CREATED' },
  { label: 'Closed', value: 'CLOSED' },
]

const TABLE_COLUMNS = ['Req. Number', 'Title', 'Status', 'Required Date', 'Created', 'Actions']

/* ─────────────────────────────────────────
   CreateRequisitionModal (inline)
───────────────────────────────────────── */
function CreateRequisitionModal({ isOpen, onClose }) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(createSchema),
    defaultValues: {
      title: '',
      requiredDate: '',
      description: '',
      items: [{ productId: '', quantity: 1, remarks: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  /* Fetch products for the selector */
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  })
  const products = productsData?.content ?? productsData ?? []

  const mutation = useMutation({
    mutationFn: (payload) => createRequisition(payload),
    onSuccess: () => {
      toast.success('Requisition created successfully')
      queryClient.invalidateQueries({ queryKey: ['requisitions'] })
      reset()
      onClose()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to create requisition')
    },
  })

  const onSubmit = (formData) => {
    mutation.mutate({
      title: formData.title,
      description: formData.description || '',
      requiredDate: formData.requiredDate,
      items: formData.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        remarks: item.remarks || '',
      })),
    })
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-[#1A1035] dark:border dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 flex-shrink-0 border-b border-transparent dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">New Purchase Requisition</h2>
                <p className="text-xs text-primary-100">Fill in the details below</p>
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
        </div>

        {/* Scrollable body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="overflow-y-auto flex-1 px-6 py-6 space-y-5"
        >
          {/* Title */}
          <Input
            label="Title"
            placeholder="e.g. Office Supplies Q3"
            error={errors.title?.message}
            {...register('title')}
          />

          {/* Required Date */}
          <Input
            label="Required Date"
            type="date"
            error={errors.requiredDate?.message}
            {...register('requiredDate')}
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1">
              Description <span className="text-gray-400 dark:text-white/40 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of the requisition"
              className="w-full rounded-lg border border-gray-300 dark:border-white/10 px-3 py-2 text-sm text-gray-800 dark:text-white dark:bg-white/5 placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
              {...register('description')}
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80">
                Items
                {errors.items?.message && (
                  <span className="ml-2 text-xs font-normal text-red-500 dark:text-red-400">
                    {errors.items.message}
                  </span>
                )}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => append({ productId: '', quantity: 1, remarks: '' })}
              >
                <PlusCircle size={15} />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Product selector */}
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-medium text-gray-600 dark:text-white/60 mb-1">
                          Product
                        </label>
                        <select
                          className={clsx(
                            'w-full rounded-lg border px-3 py-2 text-sm text-gray-800 dark:text-white bg-white dark:bg-white/5 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
                            errors.items?.[index]?.productId
                              ? 'border-red-400 dark:border-red-500/50'
                              : 'border-gray-300'
                          )}
                          {...register(`items.${index}.productId`)}
                        >
                          <option value="">
                            {productsLoading ? 'Loading...' : 'Select product'}
                          </option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        {errors.items?.[index]?.productId && (
                          <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                            {errors.items[index].productId.message}
                          </p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-1">
                        <Input
                          label="Quantity"
                          type="number"
                          min={1}
                          placeholder="1"
                          error={errors.items?.[index]?.quantity?.message}
                          {...register(`items.${index}.quantity`)}
                        />
                      </div>

                      {/* Remarks */}
                      <div className="sm:col-span-1">
                        <Input
                          label="Remarks (optional)"
                          placeholder="Any notes"
                          error={errors.items?.[index]?.remarks?.message}
                          {...register(`items.${index}.remarks`)}
                        />
                      </div>
                    </div>

                    {/* Remove button */}
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="mt-6 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={mutation.isPending}
            >
              Create Requisition
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   RequisitionsPage
───────────────────────────────────────── */
export default function RequisitionsPage() {
  const navigate = useNavigate()
  const [activeStatus, setActiveStatus] = useState('')
  const [page, setPage] = useState(0)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['requisitions', { status: activeStatus, page }],
    queryFn: () =>
      getRequisitions({
        ...(activeStatus ? { status: activeStatus } : {}),
        page,
        size: 20,
      }),
    keepPreviousData: true,
  })

  const requisitions = data?.content ?? data ?? []
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Requisitions</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
            Create, track, and manage internal purchase requisitions.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus size={16} />
          New Requisition
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-white/10">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleStatusChange(tab.value)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none',
              activeStatus === tab.value
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'text-gray-500 dark:text-white/60 hover:text-gray-700 dark:hover:text-white/80 hover:border-b-2 hover:border-gray-300 dark:hover:border-white/30'
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
        empty={!isLoading && requisitions.length === 0}
        emptyMessage="No requisitions found."
      >
        {requisitions.map((row, i) => (
          <tr
            key={row.id}
            className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-100"
          >
            <Table.Td className="font-mono text-xs text-gray-500 dark:text-white/60">
              {row.requisitionNumber ?? row.id?.slice(-8).toUpperCase()}
            </Table.Td>
            <Table.Td className="font-medium text-gray-900 dark:text-white max-w-[220px] truncate">
              {row.title}
            </Table.Td>
            <Table.Td>
              <Badge status={row.status} />
            </Table.Td>
            <Table.Td>{formatDate(row.requiredDate)}</Table.Td>
            <Table.Td>{formatDate(row.createdAt)}</Table.Td>
            <Table.Td>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/procurement/requisitions/${row.id}`)}
              >
                <Eye size={14} />
                View
              </Button>
            </Table.Td>
          </tr>
        ))}
      </Table>

      {/* Pagination */}
      {!isLoading && requisitions.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />
      )}

      {/* Create modal */}
      <CreateRequisitionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  )
}
