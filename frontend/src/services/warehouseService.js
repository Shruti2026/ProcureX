import api from './api';

export const warehouseService = {
  getWarehouses:    ()         => api.get('/api/v1/inventory/warehouses'),
  getWarehouseById: (id)       => api.get(`/api/v1/inventory/warehouses/${id}`),
  createWarehouse:  (data)     => api.post('/api/v1/inventory/warehouses', data),
  updateWarehouse:  (id, data) => api.put(`/api/v1/inventory/warehouses/${id}`, data),
  deleteWarehouse:  (id)       => api.delete(`/api/v1/inventory/warehouses/${id}`),
};
