import api from './api'

/**
 * Fetch all categories with optional filters.
 * @param {{ page?: number, size?: number }} params
 */
export const getCategories = async (params = {}) => {
  const { data } = await api.get('/api/v1/categories', { params })
  return data.data
}

/**
 * Create a new category.
 * @param {object} payload
 */
export const createCategory = async (payload) => {
  const { data } = await api.post('/api/v1/categories', payload)
  return data.data
}

/**
 * Update an existing category.
 * @param {string} categoryId
 * @param {object} payload
 */
export const updateCategory = async (categoryId, payload) => {
  const { data } = await api.put(`/api/v1/categories/${categoryId}`, payload)
  return data.data
}

/**
 * Delete a category by ID.
 * @param {string} categoryId
 */
export const deleteCategory = async (categoryId) => {
  await api.delete(`/api/v1/categories/${categoryId}`)
}
