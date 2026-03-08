import api from '@/lib/api';

export const reportsApi = {
  dashboard:          (params) => api.get('/reports/dashboard', { params }),
  salesByDay:         (params) => api.get('/reports/sales-by-day', { params }),
  topProducts:        (params) => api.get('/reports/top-products', { params }),
  salesByChannel:     (params) => api.get('/reports/sales-by-channel', { params }),
  expensesByCategory: (params) => api.get('/reports/expenses-by-category', { params }),
  lowStock:           ()       => api.get('/reports/low-stock'),
};
