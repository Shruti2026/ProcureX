import api from './api'

export const healthService = {
  getSystemHealth: () => api.get('/api/v1/admin/system-health').then(r => r.data.data),
}
