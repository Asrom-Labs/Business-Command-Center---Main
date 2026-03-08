import api from '@/lib/api';

export const transfersApi = {
  list:    (params) => api.get('/transfers', { params }),
  getOne:  (id)     => api.get(`/transfers/${id}`),
  create:  (data)   => api.post('/transfers', data),
  confirm: (id)     => api.post(`/transfers/${id}/confirm`),
  cancel:  (id)     => api.post(`/transfers/${id}/cancel`),
};
