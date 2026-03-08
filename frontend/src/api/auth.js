import api from '@/lib/api';

export const authApi = {
  login:          (email, password) => api.post('/auth/login', { email, password }),
  register:       (data)            => api.post('/auth/register', data),
  me:             ()                => api.get('/auth/me'),
  changePassword: (data)            => api.patch('/auth/password', data),
};
