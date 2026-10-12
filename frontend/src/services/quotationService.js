import api from './api';

export const quotationService = {
  submitQuotation:    (data)   => api.post('/api/v1/procurement/quotations', data),
  getQuotationsByRFQ: (rfqId)  => api.get(`/api/v1/procurement/quotations/rfq/${rfqId}`),
  getMyQuotations:    (params) => api.get('/api/v1/procurement/quotations/my-quotations', { params }),
};
