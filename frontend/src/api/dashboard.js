import api from '@/lib/api';

/**
 * Fetch the core dashboard KPI metrics.
 * When from/to are both omitted, the backend defaults to the current calendar month.
 */
export function fetchDashboardMetrics(from, to) {
  const params = {};
  if (from) params.from = from;
  if (to)   params.to   = to;
  return api.get('/reports/dashboard', { params });
}

/**
 * Fetch daily revenue breakdown for the chart.
 * Always requires explicit from and to.
 */
export function fetchSalesByDay(from, to) {
  return api.get('/reports/sales-by-day', { params: { from, to } });
}

/**
 * Fetch the 5 most recent sales orders for the activity feed.
 */
export function fetchRecentOrders() {
  return api.get('/sales-orders', { params: { page: 1, limit: 5 } });
}

/**
 * Fetch all products currently at or below their low_stock_threshold.
 */
export function fetchLowStockItems() {
  return api.get('/reports/low-stock');
}
