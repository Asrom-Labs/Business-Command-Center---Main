import api from '@/lib/api';

export const returnsApi = {
  list:    (params) => api.get('/returns', { params }),
  getOne:  (id)     => api.get(`/returns/${id}`),
  process: (data)   => api.post('/returns', data),
  reasons: ()       => api.get('/returns/reasons'),
};
