import api from '@/lib/api';

export const stockApi = {
  list:    (params) => api.get('/stock', { params }),
  summary: ()       => api.get('/stock/summary'),
  ledger:  (params) => api.get('/stock/ledger', { params }),
  adjust:  (data)   => api.post('/stock/adjust', data),
};
