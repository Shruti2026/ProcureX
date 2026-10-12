import api from './api';

export const inventoryService = {
  getStock:        (params) => api.get('/api/v1/inventory/stock', { params }),
  getTransactions: (params) => api.get('/api/v1/inventory/stock-transactions', { params }),
};
