import api from './api';

export const budgetService = {
  createBudget:  (data)      => api.post('/api/v1/finance/budgets', data),
  getBudgets:    (params)    => api.get('/api/v1/finance/budgets', { params }),
  getBudgetById: (id)        => api.get(`/api/v1/finance/budgets/${id}`),
  updateBudget:  (id, data)  => api.put(`/api/v1/finance/budgets/${id}`, data),
};
