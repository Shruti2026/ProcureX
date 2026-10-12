import api from './api';

export const grnService = {
  createGRN:          (data)   => api.post('/api/v1/inventory/grns', data),
  getGRNs:            (params) => api.get('/api/v1/inventory/grns', { params }),
  getGRNById:         (id)     => api.get(`/api/v1/inventory/grns/${id}`),
  submitInspection:   (data)   => api.post('/api/v1/inventory/inspections', data),
  getInspectionByGrn: (grnId)  => api.get(`/api/v1/inventory/inspections/grn/${grnId}`),
};
