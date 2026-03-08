import api from '@/lib/api';

export const productsApi = {
  list:       (params)                    => api.get('/products', { params }),
  getOne:     (id)                        => api.get(`/products/${id}`),
  create:     (data)                      => api.post('/products', data),
  update:     (id, data)                  => api.patch(`/products/${id}`, data),
  deactivate: (id)                        => api.delete(`/products/${id}`),
  // Variants
  listVariants:      (productId, params)          => api.get(`/products/${productId}/variants`, { params }),
  getVariant:        (productId, variantId)        => api.get(`/products/${productId}/variants/${variantId}`),
  createVariant:     (productId, data)             => api.post(`/products/${productId}/variants`, data),
  updateVariant:     (productId, variantId, data)  => api.patch(`/products/${productId}/variants/${variantId}`, data),
  deactivateVariant: (productId, variantId)        => api.delete(`/products/${productId}/variants/${variantId}`),
};
