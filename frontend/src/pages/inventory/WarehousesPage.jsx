import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { Plus, X, Pencil } from 'lucide-react'

import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Input from '../../components/ui/Input'
import { warehouseService } from '../../services/warehouseService'

/* ─────────────────────────────────────────
   Yup schema
───────────────────────────────────────── */
const warehouseSchema = yup.object({
  name:     yup.string().trim().required('Name is required'),
  location: yup.string().trim().required('Location is required'),
  capacity: yup
    .number()
    .typeError('Capacity must be a number')
    .required('Capacity is required')
    .positive('Capacity must be greater than 0'),
})

/* ─────────────────────────────────────────
   WarehouseModal — create or edit
───────────────────────────────────────── */
function WarehouseModal({ isOpen, onClose, warehouse }) {
  const queryClient = useQueryClient()
  const isEditing = Boolean(warehouse)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(warehouseSchema),
    defaultValues: {
      name:     warehouse?.name     ?? '',
      location: warehouse?.location ?? '',
      capacity: warehouse?.capacity ?? '',
    },
  })

  /* Re-populate form whenever the modal opens or the warehouse changes */
  useEffect(() => {
    if (isOpen) {
      reset({
        name:     warehouse?.name     ?? '',
        location: warehouse?.location ?? '',
        capacity: warehouse?.capacity ?? '',
      })
    }
  }, [isOpen, warehouse, reset])

  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing
        ? warehouseService.updateWarehouse(warehouse.id, data)
        : warehouseService.createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      toast.success(isEditing ? 'Warehouse updated.' : 'Warehouse created.')
      reset()
      onClose()
    },
    onError: (err) => {
      const msg = err?.response?.data?.message ?? 'Something went wrong.'
      toast.error(msg)
    },
  })

  const onSubmit = (data) => mutation.mutate(data)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="warehouse-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 id="warehouse-modal-title" className="text-base font-semibold text-gray-900">
            {isEditing ? 'Edit Warehouse' : 'Create Warehouse'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="px-6 py-5 space-y-4">
            <Input
              label="Name"
              id="warehouse-name"
              placeholder="e.g. Main Distribution Center"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Location"
              id="warehouse-location"
              placeholder="e.g. Chicago, IL"
              error={errors.location?.message}
              {...register('location')}
            />
            <Input
              label="Capacity"
              id="warehouse-capacity"
              type="number"
              placeholder="e.g. 5000"
              error={errors.capacity?.message}
              {...register('capacity')}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting || mutation.isPending}>
              {isEditing ? 'Save Changes' : 'Create Warehouse'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   Table columns
───────────────────────────────────────── */
const TABLE_COLUMNS = ['Name', 'Location', 'Capacity', 'Actions']

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ─────────────────────────────────────────
   WarehousesPage
───────────────────────────────────────── */
export default function WarehousesPage() {
  const [modalOpen, setModalOpen]       = useState(false)
  const [editWarehouse, setEditWarehouse] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () =>
      warehouseService.getWarehouses().then((res) => res.data?.data ?? res.data ?? []),
    staleTime: 60_000,
  })

  const warehouses = Array.isArray(data) ? data : []

  const openCreate = () => {
    setEditWarehouse(null)
    setModalOpen(true)
  }

  const openEdit = (warehouse) => {
    setEditWarehouse(warehouse)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditWarehouse(null)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage warehouse facilities, storage locations, and capacity.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Create Warehouse
        </Button>
      </div>

      {/* Table */}
      <Table
        columns={TABLE_COLUMNS}
        loading={isLoading}
        empty={!isLoading && warehouses.length === 0}
        emptyMessage="No warehouses found. Create one to get started."
      >
        {warehouses.map((wh, i) => (
          <tr
            key={wh.id}
            className="hover:bg-gray-50 transition-colors duration-100 animate-fade-slide-up"
            style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
          >
            <Table.Td className="font-medium text-gray-900">{wh.name}</Table.Td>
            <Table.Td>{wh.location}</Table.Td>
            <Table.Td>{wh.capacity?.toLocaleString()}</Table.Td>
            <Table.Td>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEdit(wh)}
                aria-label={`Edit ${wh.name}`}
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            </Table.Td>
          </tr>
        ))}
      </Table>

      {/* Modal */}
      <WarehouseModal
        isOpen={modalOpen}
        onClose={closeModal}
        warehouse={editWarehouse}
      />
    </div>
  )
}
