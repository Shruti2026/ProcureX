import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { X, Edit, Trash2, Plus, ChevronLeft, ChevronRight, Package } from 'lucide-react'
import clsx from 'clsx'

import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/productService'
import { getCategories } from '../../services/categoryService'

/* ─────────────────────────────────────────
   Yup schema
───────────────────────────────────────── */
const productSchema = yup.object({
  productName: yup
    .string()
    .required('Product name is required')
    .max(150, 'Must be 150 characters or fewer'),
  description: yup.string().optional(),
  categoryId: yup.string().required('Category is required'),
  unitOfMeasure: yup.string().required('Unit of measure is required'),
  minimumStock: yup
    .number()
    .typeError('Must be a number')
    .min(0, 'Cannot be negative')
    .required('Minimum stock is required'),
})

/* ─────────────────────────────────────────
   ProductFormModal
───────────────────────────────────────── */
function ProductFormModal({ isOpen, onClose, product, categories }) {
  const queryClient = useQueryClient()
  const isEditing = !!product

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(productSchema),
    defaultValues: {
      productName: product?.productName ?? '',
      description: product?.description ?? '',
      categoryId: product?.categoryId ?? product?.category?.categoryId ?? '',
      unitOfMeasure: product?.unitOfMeasure ?? '',
      minimumStock: product?.minimumStock ?? 0,
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload) => createProduct(payload),
    onSuccess: () => {
      toast.success('Product created successfully')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      handleClose()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to create product')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload) => updateProduct(product.productId ?? product.id, payload),
    onSuccess: () => {
      toast.success('Product updated successfully')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      handleClose()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update product')
    },
  })

  const onSubmit = (formData) => {
    const payload = {
      productName: formData.productName,
      description: formData.description || '',
      categoryId: formData.categoryId,
      unitOfMeasure: formData.unitOfMeasure,
      minimumStock: Number(formData.minimumStock),
    }
    if (isEditing) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {isEditing ? 'Edit Product' : 'New Product'}
                </h2>
                <p className="text-xs text-primary-100">
                  {isEditing ? 'Update product details' : 'Fill in the details below'}
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

        {/* Form body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="overflow-y-auto flex-1 px-6 py-6 space-y-5"
        >
          {/* Product Name */}
          <Input
            label="Product Name"
            placeholder="e.g. A4 Copy Paper"
            error={errors.productName?.message}
            {...register('productName')}
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of the product"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
              {...register('description')}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              className={clsx(
                'w-full rounded-lg border px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent',
                errors.categoryId ? 'border-red-400' : 'border-gray-300'
              )}
              {...register('categoryId')}
            >
              <option value="">Select a category</option>
              {(categories ?? []).map((cat) => (
                <option key={cat.categoryId ?? cat.id} value={cat.categoryId ?? cat.id}>
                  {cat.categoryName ?? cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Unit of Measure */}
          <Input
            label="Unit of Measure"
            placeholder="e.g. Ream, Box, Kg"
            error={errors.unitOfMeasure?.message}
            {...register('unitOfMeasure')}
          />

          {/* Minimum Stock */}
          <Input
            label="Minimum Stock"
            type="number"
            min={0}
            placeholder="0"
            error={errors.minimumStock?.message}
            {...register('minimumStock')}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={isPending}
            >
              {isEditing ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   ProductCatalogPage
───────────────────────────────────────── */
const TABLE_COLUMNS = ['Product Name', 'Category', 'Unit of Measure', 'Min Stock', 'Status', 'Actions']

export default function ProductCatalogPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  const { data: productsPage, isLoading } = useQuery({
    queryKey: ['products', page, pageSize, categoryFilter],
    queryFn: () =>
      getProducts({
        page,
        size: pageSize,
        ...(categoryFilter ? { categoryId: categoryFilter } : {}),
      }),
    keepPreviousData: true,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
    staleTime: 5 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (productId) => deleteProduct(productId),
    onSuccess: () => {
      toast.success('Product deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to delete product')
    },
  })

  const products = productsPage?.content ?? []
  const totalPages = productsPage?.totalPages ?? 1
  const isFirst = page === 0
  const isLast = page >= totalPages - 1

  const handleDelete = (productId, productName) => {
    if (!window.confirm(`Delete product "${productName}"? This action cannot be undone.`)) return
    deleteMutation.mutate(productId)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setEditingProduct(null)
    setIsModalOpen(false)
  }

  const categoryList = Array.isArray(categories) ? categories : categories?.content ?? []

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the master list of procurable products.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => { setEditingProduct(null); setIsModalOpen(true) }}
        >
          <Plus size={16} />
          New Product
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600">Filter by Category</label>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(0) }}
        >
          <option value="">All Categories</option>
          {categoryList.map((cat) => (
            <option key={cat.categoryId ?? cat.id} value={cat.categoryId ?? cat.id}>
              {cat.categoryName ?? cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Table
        columns={TABLE_COLUMNS}
        loading={isLoading}
        empty={!isLoading && products.length === 0}
        emptyMessage="No products found."
      >
        {products.map((product) => (
          <tr key={product.productId ?? product.id} className="hover:bg-gray-50 transition-colors duration-100">
            <Table.Td className="font-medium text-gray-900">
              {product.productName ?? product.name}
            </Table.Td>
            <Table.Td>{product.categoryName ?? product.category?.categoryName ?? '—'}</Table.Td>
            <Table.Td>{product.unitOfMeasure ?? '—'}</Table.Td>
            <Table.Td>{product.minimumStock ?? 0}</Table.Td>
            <Table.Td>
              <Badge status={product.status ?? (product.isActive === false ? 'INACTIVE' : 'ACTIVE')} />
            </Table.Td>
            <Table.Td>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(product)}
                >
                  <Edit size={14} />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(product.productId ?? product.id, product.productName ?? product.name)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Delete
                </Button>
              </div>
            </Table.Td>
          </tr>
        ))}
      </Table>

      {/* Pagination */}
      {!isLoading && products.length > 0 && (
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

      {/* Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        product={editingProduct}
        categories={categoryList}
      />
    </div>
  )
}
