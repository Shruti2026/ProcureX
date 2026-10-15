import api from './api';

export const paymentService = {
  initiatePayment: (data)        => api.post('/api/v1/finance/payments', data),
  getPayments:     (params)      => api.get('/api/v1/finance/payments', { params }),
  getByInvoice:    (invoiceId)   => api.get(`/api/v1/finance/payments/invoice/${invoiceId}`),
};
