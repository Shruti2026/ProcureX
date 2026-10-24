import api from './api';

export const invoiceService = {
  submitInvoice:  (data)          => api.post('/api/v1/finance/invoices', data),
  getInvoices:    (params)        => api.get('/api/v1/finance/invoices', { params }),
  getMyInvoices:  (params)        => api.get('/api/v1/finance/invoices/my-invoices', { params }),
  getInvoiceById: (id)            => api.get(`/api/v1/finance/invoices/${id}`),
  runMatch:       (id)            => api.post(`/api/v1/finance/invoices/${id}/match`),
  approveInvoice: (id, remarks)   => api.post(`/api/v1/finance/invoices/${id}/approve`, null, { params: { remarks } }),
  rejectInvoice:  (id, remarks)   => api.post(`/api/v1/finance/invoices/${id}/reject`, null, { params: { remarks } }),
};
