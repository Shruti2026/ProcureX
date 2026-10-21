import api from './api'

/**
 * Fetches a paginated, server-filtered list of audit log entries.
 *
 * @param {Object} params
 * @param {string|null}  params.action  - Exact action filter (e.g. 'LOGIN')
 * @param {string|null}  params.userId  - Actor UUID filter
 * @param {string|null}  params.from    - ISO datetime range start
 * @param {string|null}  params.to      - ISO datetime range end
 * @param {number}       params.page    - Zero-based page index
 * @param {number}       params.size    - Page size (max 100)
 */
export const getAuditLogs = ({ action, userId, from, to, page = 0, size = 20 } = {}) => {
  const params = { page, size }
  if (action) params.action = action
  if (userId) params.userId = userId
  if (from)   params.from   = from
  if (to)     params.to     = to
  return api.get('/api/v1/admin/audit-logs', { params })
}
