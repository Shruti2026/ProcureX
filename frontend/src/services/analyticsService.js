import api from './api';

export const analyticsService = {
  getProcurementSummary: ()  => api.get('/api/v1/reports/procurement-summary'),
  getVendorPerformance:  ()  => api.get('/api/v1/reports/vendor-performance'),
  getDashboardMetrics:   ()  => api.get('/api/v1/reports/dashboard-metrics'),
  getSpendByDepartment:  ()  => api.get('/api/v1/reports/spend-by-department'),
};
