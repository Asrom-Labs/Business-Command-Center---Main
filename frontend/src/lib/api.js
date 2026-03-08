import axios from 'axios';
import { TOKEN_KEY, USER_KEY } from './constants';

/**
 * Central Axios instance for all BCC API requests.
 *
 * Features:
 * - Automatically injects the JWT Bearer token on every request
 * - Automatically handles 401 (token expired / invalid): clears auth and redirects to login
 * - Normalizes error shape so all error handlers receive { message, error, status }
 * - Unwraps response.data so callers receive { success, data, message } directly
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor — inject JWT token ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle errors and unwrap data ───────────────────
api.interceptors.response.use(
  // On success: return response.data directly so callers get { success, data, message }
  (response) => response.data,

  (error) => {
    const status = error.response?.status;
    const apiData = error.response?.data;

    // 401 Unauthorized — token expired or invalid
    // Clear everything and force the user back to the login page
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // Use window.location to force a full navigation (clears React state too)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Build a normalized error object that all parts of the app can rely on
    const normalizedError = {
      status,
      error: apiData?.error || 'UNKNOWN_ERROR',
      message: apiData?.message || error.message || 'An unexpected error occurred.',
      data: apiData?.data ?? null,
    };

    return Promise.reject(normalizedError);
  }
);

export default api;
