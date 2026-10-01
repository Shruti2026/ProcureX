import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { ArrowLeft, Pencil, PlusCircle, Trash2, X, FileText } from 'lucide-react'
import clsx from 'clsx'

import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import Spinner from '../../components/ui/Spinner'
import { formatDate, formatDateTime } from '../../utils/formatters'
import {
  getRequisitionById,
  updateRequisition,
  getProducts,
} from '../../services/requisitionService'

/* ─────────────────────────────────────────
   Validation schema for EditRequisitionModal
───────────────────────────────────────── */
const editSchema = yup.object({
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

const ITEMS_COLUMNS = ['Product', 'Unit', 'Quantity', 'Remarks']

/* ─────────────────────────────────────────
   EditRequisitionModal (inline)
───────────────────────────────────────── */
function EditRequisitionModal({ isOpen, onClose, requisition }) {
  const queryClient = useQueryClient()

  const defaultItems =
    requisition?.items?.map((item) => ({
      productId: item.productId ?? item.product?.id ?? '',
      quantity: item.quantity ?? 1,
      remarks: item.remarks ?? '',
    })) ?? [{ productId: '', quantity: 1, remarks: '' }]

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(editSchema),
    defaultValues: {
      title: requisition?.title ?? '',
      requiredDate: requisition?.requiredDate
        ? requisition.requiredDate.substring(0, 10)
        : '',
      description: requisition?.description ?? '',
      items: defaultItems,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  /* Fetch products */
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  })
  const products = productsData?.content ?? productsData ?? []

  const mutation = useMutation({
    mutationFn: (payload) => updateRequisition(requisition.id, payload),
    onSuccess: () => {
      toast.success('Requisition updated successfully')
      queryClient.invalidateQueries({ queryKey: ['requisition', requisition.id] })
      queryClient.invalidateQueries({ queryKey: ['requisitions'] })
      onClose()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update requisition')
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
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Edit Requisition</h2>
                <p className="text-xs text-primary-100">
                  {requisition?.requisitionNumber ?? ''}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of the requisition"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
              {...register('description')}
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Items
                {errors.items?.message && (
                  <span className="ml-2 text-xs font-normal text-red-500">
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
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Product selector */}
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Product
                        </label>
                        <select
                          className={clsx(
                            'w-full rounded-lg border px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
                            errors.items?.[index]?.productId
                              ? 'border-red-400'
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
                          <p className="mt-1 text-xs text-red-500">
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
                        className="mt-6 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   RequisitionDetailPage
───────────────────────────────────────── */
export default function RequisitionDetailPage() {
  const { requisitionId } = useParams()
  const navigate = useNavigate()
  const [isEditOpen, setIsEditOpen] = useState(false)

  const { data: requisition, isLoading, isError } = useQuery({
    queryKey: ['requisition', requisitionId],
    queryFn: () => getRequisitionById(requisitionId),
    retry: (failCount, error) => {
      if (error?.response?.status === 404) return false
      return failCount < 2
    },
  })

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" className="text-primary-500" />
      </div>
    )
  }

  /* ── Not found / error ── */
  if (isError || !requisition) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/procurement/requisitions')}
        >
          <ArrowLeft size={15} />
          Back to Requisitions
        </Button>
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">Requisition not found.</p>
        </div>
      </div>
    )
  }

  const items = requisition.items ?? []

  return (
    <div className="space-y-6">

      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/procurement/requisitions')}
      >
        <ArrowLeft size={15} />
        Back to Requisitions
      </Button>

      {/* Header card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                {requisition.requisitionNumber ?? requisition.id?.slice(-8).toUpperCase()}
              </span>
              <Badge status={requisition.status} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{requisition.title}</h1>
            {requisition.description && (
              <p className="text-sm text-gray-500 max-w-2xl">{requisition.description}</p>
            )}
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-gray-100 pt-5">
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Required By</dt>
            <dd className="mt-1 text-sm font-medium text-gray-800">
              {formatDate(requisition.requiredDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Created</dt>
            <dd className="mt-1 text-sm font-medium text-gray-800">
              {formatDateTime(requisition.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Last Updated</dt>
            <dd className="mt-1 text-sm font-medium text-gray-800">
              {formatDateTime(requisition.updatedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Items</dt>
            <dd className="mt-1 text-sm font-medium text-gray-800">{items.length}</dd>
          </div>
        </dl>
      </div>

      {/* Items table */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Requisition Items</h2>
        <Table
          columns={ITEMS_COLUMNS}
          empty={items.length === 0}
          emptyMessage="No items on this requisition."
        >
          {items.map((item, i) => (
            <tr key={item.id ?? i} className="hover:bg-gray-50 transition-colors duration-100">
              <Table.Td className="font-medium text-gray-900">
                {item.productName ?? item.product?.name ?? '—'}
              </Table.Td>
              <Table.Td>{item.unitOfMeasure ?? item.product?.unitOfMeasure ?? '—'}</Table.Td>
              <Table.Td>{item.quantity}</Table.Td>
              <Table.Td className="text-gray-500">{item.remarks || '—'}</Table.Td>
            </tr>
          ))}
        </Table>
      </div>

      {/* Action bar — only visible when CREATED */}
      {requisition.status === 'CREATED' && (
        <div className="flex justify-end border-t border-gray-100 pt-4">
          <Button
            variant="secondary"
            onClick={() => setIsEditOpen(true)}
          >
            <Pencil size={15} />
            Edit Requisition
          </Button>
        </div>
      )}

      {/* Edit modal — only mounted when status is CREATED */}
      {requisition.status === 'CREATED' && (
        <EditRequisitionModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          requisition={requisition}
        />
      )}
    </div>
  )
}
