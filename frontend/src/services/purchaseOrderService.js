import api from './api';

export const purchaseOrderService = {
  createPO:  (data)        => api.post('/api/v1/procurement/orders', data),
  getPOs:    (params)      => api.get('/api/v1/procurement/orders', { params }),
  getPOById: (id)          => api.get(`/api/v1/procurement/orders/${id}`),
  approvePO: (id, remarks) => api.post(`/api/v1/procurement/orders/${id}/approve`, null, { params: { remarks } }),
  cancelPO:  (id, remarks) => api.patch(`/api/v1/procurement/orders/${id}/cancel`, null, { params: { remarks } }),
};
