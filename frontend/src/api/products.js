import api from '@/lib/api';

/**
 * Fetch a paginated, optionally filtered list of products.
 *
 * Strips undefined / null / empty-string values before sending so they
 * are never serialised as the string "undefined" in the query string.
 *
 * @param {{ page?: number, limit?: number, category_id?: string, active?: boolean }} params
 */
export function fetchProducts(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== ''
    )
  );
  return api.get('/products', { params: cleanParams });
}

/**
 * Fetch a single product by ID.
 * @param {string} id
 */
export function fetchProduct(id) {
  return api.get(`/products/${id}`);
}

/**
 * Create a new product.
 * @param {object} data
 */
export function createProduct(data) {
  return api.post('/products', data);
}

/**
 * Update an existing product.
 * @param {string} id
 * @param {object} data — all fields optional
 */
export function updateProduct(id, data) {
  return api.put(`/products/${id}`, data);
}

/**
 * Delete a product by ID.
 * @param {string} id
 */
export function deleteProduct(id) {
  return api.delete(`/products/${id}`);
}
