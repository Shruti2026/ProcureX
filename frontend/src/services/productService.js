import api from './api'

/**
 * Fetch a paginated list of products with optional filters.
 * Returns the full Page object (content, totalPages, totalElements, etc.)
 * @param {{ page?: number, size?: number, categoryId?: string, search?: string }} params
 */
export const getProducts = async (params = {}) => {
  const { data } = await api.get('/api/v1/products', { params })
  return data.data // returns the Page object (has .content, .totalPages, .totalElements)
}

/**
 * Fetch a single product by ID.
 * @param {string} productId
 */
export const getProductById = async (productId) => {
  const { data } = await api.get(`/api/v1/products/${productId}`)
  return data.data
}

/**
 * Create a new product.
 * @param {object} payload
 */
export const createProduct = async (payload) => {
  const { data } = await api.post('/api/v1/products', payload)
  return data.data
}

/**
 * Update an existing product.
 * @param {string} productId
 * @param {object} payload
 */
export const updateProduct = async (productId, payload) => {
  const { data } = await api.put(`/api/v1/products/${productId}`, payload)
  return data.data
}

/**
 * Delete a product by ID.
 * @param {string} productId
 */
export const deleteProduct = async (productId) => {
  await api.delete(`/api/v1/products/${productId}`)
}
