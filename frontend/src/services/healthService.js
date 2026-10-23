import api from './api'

export const healthService = {
  getSystemHealth: () => api.get('/api/v1/admin/system-health').then(r => r.data.data),
  getSystemHealthHistory: (range = '24h') =>
    api.get(`/api/v1/admin/system-health/history?range=${range}`).then(r => r.data.data),
  getServiceHistory: (serviceKey, range = '24h') =>
    api.get(`/api/v1/admin/system-health/services/${serviceKey}/history?range=${range}`).then(r => r.data.data),
}
