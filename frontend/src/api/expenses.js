import api from '@/lib/api';

export const expensesApi = {
  // Categories
  listCategories:  (params)   => api.get('/expenses/categories', { params }),
  getCategory:     (id)       => api.get(`/expenses/categories/${id}`),
  createCategory:  (data)     => api.post('/expenses/categories', data),
  updateCategory:  (id, data) => api.patch(`/expenses/categories/${id}`, data),
  deleteCategory:  (id)       => api.delete(`/expenses/categories/${id}`),
  // Expenses
  list:   (params)   => api.get('/expenses', { params }),
  getOne: (id)       => api.get(`/expenses/${id}`),
  create: (data)     => api.post('/expenses', data),
  update: (id, data) => api.patch(`/expenses/${id}`, data),
  delete: (id)       => api.delete(`/expenses/${id}`),
};
