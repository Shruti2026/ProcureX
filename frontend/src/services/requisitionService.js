import api from './api'

/**
 * Fetch a paginated, optionally filtered list of requisitions.
 * @param {{ status?: string, page?: number, size?: number }} params
 */
export const getRequisitions = async (params = {}) => {
  const { data } = await api.get('/api/v1/procurement/requisitions', { params })
  return data.data
}

/**
 * Fetch a single requisition by its UUID.
 * @param {string} id
 */
export const getRequisitionById = async (id) => {
  const { data } = await api.get(`/api/v1/procurement/requisitions/${id}`)
  return data.data
}

/**
 * Create a new requisition.
 * @param {object} payload
 */
export const createRequisition = async (payload) => {
  const { data } = await api.post('/api/v1/procurement/requisitions', payload)
  return data.data
}

/**
 * Update an existing requisition.
 * @param {string} id
 * @param {object} payload
 */
export const updateRequisition = async (id, payload) => {
  const { data } = await api.put(`/api/v1/procurement/requisitions/${id}`, payload)
  return data.data
}

/**
 * Fetch the product catalogue (used in item selectors).
 * @param {object} params  Optional query params (e.g. { search, categoryId })
 */
export const getProducts = async (params = {}) => {
  const { data } = await api.get('/api/v1/products', { params })
  return data.data
}

/**
 * Fetch all product categories.
 */
export const getCategories = async () => {
  const { data } = await api.get('/api/v1/categories')
  return data.data
}
