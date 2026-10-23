import api from './api'

/**
 * Service for administrative operations.
 */
export const adminService = {
  /**
   * Fetches aggregated metrics for the Admin Dashboard.
   * @returns {Promise<import('axios').AxiosResponse<{
   *   totalUsers: number,
   *   activeEmployees: number,
   *   totalVendors: number,
   *   activeVendors: number,
   *   pendingVendors: number,
   *   lockedAccounts: number
   * }>>}
   */
  getDashboardSummary: () => api.get('/api/v1/admin/dashboard/summary'),

  /**
   * Fetches all pending vendor registrations.
   */
  getPendingVendors: () => api.get('/api/v1/admin/vendors/pending'),

  /**
   * Fetches all employees.
   */
  getAllEmployees: () => api.get('/api/v1/admin/users/employees'),
}

export default adminService
