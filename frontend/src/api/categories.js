import api from '@/lib/api';

/**
 * Fetch paginated list of categories.
 * @param {{ page?: number, limit?: number }} params
 */
export function fetchCategories(params = {}) {
  return api.get('/categories', { params });
}

/**
 * Fetch a single category by ID.
 * @param {string} id
 */
export function fetchCategory(id) {
  return api.get(`/categories/${id}`);
}

/**
 * Create a new category.
 * @param {{ name: string, description?: string }} data
 */
export function createCategory(data) {
  return api.post('/categories', data);
}

/**
 * Update an existing category.
 * @param {string} id
 * @param {{ name?: string, description?: string }} data
 */
export function updateCategory(id, data) {
  return api.put(`/categories/${id}`, data);
}

/**
 * Delete a category by ID.
 * @param {string} id
 */
export function deleteCategory(id) {
  return api.delete(`/categories/${id}`);
}
