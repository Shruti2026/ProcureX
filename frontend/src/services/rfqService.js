import api from './api'

/**
 * Fetch a paginated list of RFQs with optional filters.
 * @param {{ status?: string, page?: number, size?: number }} params
 */
export const getRFQs = async (params = {}) => {
  const { data } = await api.get('/api/v1/procurement/rfqs', { params })
  return data.data
}

/**
 * Fetch a single RFQ by ID.
 * @param {string} rfqId
 */
export const getRFQById = async (rfqId) => {
  const { data } = await api.get(`/api/v1/procurement/rfqs/${rfqId}`)
  return data.data
}

/**
 * Create a new RFQ.
 * @param {object} payload  { requisitionId, closingDate, invitedVendorIds }
 */
export const createRFQ = async (payload) => {
  const { data } = await api.post('/api/v1/procurement/rfqs', payload)
  return data.data
}

/**
 * Close an open RFQ.
 * @param {string} rfqId
 */
export const closeRFQ = async (rfqId) => {
  const { data } = await api.patch(`/api/v1/procurement/rfqs/${rfqId}/close`)
  return data.data
}

/**
 * Fetch RFQ invitations for the current vendor.
 * @param {{ vendorId?: string, page?: number, size?: number }} params
 */
export const getMyInvitations = async (params = {}) => {
  const { data } = await api.get('/api/v1/procurement/rfqs/my-invitations', { params })
  return data.data
}
