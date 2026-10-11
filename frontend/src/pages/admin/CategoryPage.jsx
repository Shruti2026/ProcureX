import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { X, Edit, Trash2, Plus, Tag } from 'lucide-react'
import clsx from 'clsx'

import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Table from '../../components/ui/Table'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/categoryService'

/* ─────────────────────────────────────────
   Yup schema
───────────────────────────────────────── */
const categorySchema = yup.object({
  categoryName: yup
    .string()
    .required('Category name is required')
    .max(100, 'Must be 100 characters or fewer'),
  description: yup.string().optional(),
})

/* ─────────────────────────────────────────
   CategoryFormModal
───────────────────────────────────────── */
function CategoryFormModal({ isOpen, onClose, category }) {
  const queryClient = useQueryClient()
  const isEditing = !!category

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(categorySchema),
    defaultValues: {
      categoryName: category?.categoryName ?? '',
      description: category?.description ?? '',
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload) => createCategory(payload),
    onSuccess: () => {
      toast.success('Category created successfully')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      handleClose()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to create category')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload) => updateCategory(category.categoryId ?? category.id, payload),
    onSuccess: () => {
      toast.success('Category updated successfully')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      handleClose()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to update category')
    },
  })

  const onSubmit = (formData) => {
    const payload = {
      categoryName: formData.categoryName,
      description: formData.description || '',
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
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Tag className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {isEditing ? 'Edit Category' : 'New Category'}
                </h2>
                <p className="text-xs text-primary-100">
                  {isEditing ? 'Update category details' : 'Fill in the details below'}
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
          className="px-6 py-6 space-y-5"
        >
          {/* Category Name */}
          <Input
            label="Category Name"
            placeholder="e.g. Office Supplies"
            error={errors.categoryName?.message}
            {...register('categoryName')}
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of the category"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
              {...register('description')}
            />
          </div>

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
              {isEditing ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   CategoryPage
───────────────────────────────────────── */
const TABLE_COLUMNS = ['Category Name', 'Description', 'Actions']

export default function CategoryPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  })

  const deleteMutation = useMutation({
    mutationFn: (categoryId) => deleteCategory(categoryId),
    onSuccess: () => {
      toast.success('Category deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to delete category'
      toast.error(msg)
    },
  })

  const categories = Array.isArray(categoriesData)
    ? categoriesData
    : categoriesData?.content ?? []

  const handleDelete = (categoryId, categoryName) => {
    if (!window.confirm(`Delete category "${categoryName}"? This action cannot be undone.`)) return
    deleteMutation.mutate(categoryId)
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setEditingCategory(null)
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage product categories for the procurement catalog.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => { setEditingCategory(null); setIsModalOpen(true) }}
        >
          <Plus size={16} />
          New Category
        </Button>
      </div>

      {/* Table */}
      <Table
        columns={TABLE_COLUMNS}
        loading={isLoading}
        empty={!isLoading && categories.length === 0}
        emptyMessage="No categories found."
      >
        {categories.map((cat) => (
          <tr key={cat.categoryId ?? cat.id} className="hover:bg-gray-50 transition-colors duration-100">
            <Table.Td className="font-medium text-gray-900">
              {cat.categoryName ?? cat.name}
            </Table.Td>
            <Table.Td className="text-gray-500 max-w-[400px] truncate">
              {cat.description || '—'}
            </Table.Td>
            <Table.Td>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(cat)}
                >
                  <Edit size={14} />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(cat.categoryId ?? cat.id, cat.categoryName ?? cat.name)}
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

      {/* Modal */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        category={editingCategory}
      />
    </div>
  )
}
