import api from './api'

/**
 * Fetch the current user's vendor profile.
 */
export const getMyVendorProfile = async () => {
  const { data } = await api.get('/api/v1/vendors/me')
  return data.data
}

/**
 * Fetch a vendor by ID.
 * @param {string} vendorId
 */
export const getVendorById = async (vendorId) => {
  const { data } = await api.get(`/api/v1/vendors/${vendorId}`)
  return data.data
}

/**
 * Fetch a paginated list of vendors with optional filters.
 * @param {{ status?: string, page?: number, size?: number }} params
 */
export const getVendors = async (params = {}) => {
  const { data } = await api.get('/api/v1/vendors', { params })
  return data.data
}

/**
 * Fetch all product mappings for a given vendor.
 * @param {string} vendorId
 */
export const getMyVendorProducts = async (vendorId) => {
  const { data } = await api.get(`/api/v1/vendor-products/vendor/${vendorId}`)
  return data.data
}

/**
 * Fetch all vendor mappings for a given product.
 * @param {string} productId
 */
export const getVendorsByProduct = async (productId) => {
  const { data } = await api.get(`/api/v1/vendor-products/product/${productId}`)
  return data.data
}

/**
 * Create a new vendor-product mapping.
 * @param {object} data
 */
export const createVendorProductMapping = async (payload) => {
  const { data } = await api.post('/api/v1/vendor-products', payload)
  return data.data
}

/**
 * Update an existing vendor-product mapping.
 * @param {string} vendorProductId
 * @param {object} payload
 */
export const updateVendorProductMapping = async (vendorProductId, payload) => {
  const { data } = await api.put(`/api/v1/vendor-products/${vendorProductId}`, payload)
  return data.data
}
