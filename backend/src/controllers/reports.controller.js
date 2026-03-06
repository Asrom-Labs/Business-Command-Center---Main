'use strict';

const { pool } = require('../db/pool');

const getDateRange = (req, res) => {
  const from = req.query.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const to = req.query.to || new Date().toISOString().split('T')[0];
  if (from > to) {
    res.status(400).json({ success: false, data: null, error: 'VALIDATION_ERROR', message: "'from' date must be on or before 'to' date" });
    return null;
  }
  return { from, to };
};

/**
 * GET /api/reports/dashboard
 * Key metrics for the current period (default: current month).
 */
const dashboard = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const range = getDateRange(req, res);
    if (!range) return;
    const { from, to } = range;

    const [salesRes, expenseRes, returnsRes, newCustomersRes, lowStockRes, pendingPORes] = await Promise.all([
      // Sales totals
      pool.query(
        `SELECT
           COUNT(*)::INTEGER AS order_count,
           COALESCE(SUM(total), 0) AS gross_revenue,
           COALESCE(SUM(amount_paid), 0) AS collected,
           COALESCE(SUM(total - amount_paid), 0) AS outstanding,
           COALESCE(SUM(soi.total_cost), 0) AS total_cost
         FROM sales_orders so
         LEFT JOIN (
           SELECT sales_order_id, SUM(cost * quantity)::NUMERIC AS total_cost
           FROM sales_order_items GROUP BY sales_order_id
         ) soi ON soi.sales_order_id = so.id
         WHERE so.organization_id = $1 AND so.status != 'cancelled'
           AND so.created_at::DATE BETWEEN $2 AND $3`,
        [orgId, from, to]
      ),
      // Expenses
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total_expenses
         FROM expenses WHERE organization_id = $1 AND date BETWEEN $2 AND $3`,
        [orgId, from, to]
      ),
      // Returns
      pool.query(
        `SELECT COUNT(*)::INTEGER AS return_count, COALESCE(SUM(total_refund_amount), 0) AS total_refund_amount
         FROM returns WHERE organization_id = $1 AND created_at::DATE BETWEEN $2 AND $3`,
        [orgId, from, to]
      ),
      // New customers
      pool.query(
        `SELECT COUNT(*)::INTEGER AS new_customers FROM customers WHERE organization_id = $1 AND created_at::DATE BETWEEN $2 AND $3`,
        [orgId, from, to]
      ),
      // Low stock products (products where current stock <= threshold)
      pool.query(
        `SELECT COUNT(DISTINCT p.id)::INTEGER AS low_stock_count
         FROM products p
         LEFT JOIN (
           SELECT product_id, SUM(quantity_change)::INTEGER AS stock_on_hand
           FROM stock_ledger GROUP BY product_id
         ) s ON s.product_id = p.id
         WHERE p.organization_id = $1
           AND p.active = TRUE
           AND COALESCE(s.stock_on_hand, 0) <= p.low_stock_threshold
           AND p.low_stock_threshold > 0`,
        [orgId]
      ),
      // Pending purchase orders
      pool.query(
        `SELECT COUNT(*)::INTEGER AS pending_po_count
         FROM purchase_orders WHERE organization_id = $1 AND status IN ('draft', 'submitted', 'partially_received')`,
        [orgId]
      ),
    ]);

    const sales = salesRes.rows[0];
    const grossRevenue = parseFloat(sales.gross_revenue);
    const totalCost = parseFloat(sales.total_cost);
    const totalExpenses = parseFloat(expenseRes.rows[0].total_expenses);
    const totalRefund = parseFloat(returnsRes.rows[0].total_refund_amount);
    const grossProfit = grossRevenue - totalCost;
    const netProfit = grossProfit - totalExpenses - totalRefund;

    return res.json({
      success: true,
      data: {
        period: { from, to },
        sales: {
          order_count: sales.order_count,
          gross_revenue: grossRevenue,
          collected: parseFloat(sales.collected),
          outstanding: parseFloat(sales.outstanding),
        },
        profitability: {
          gross_revenue: grossRevenue,
          total_cost: totalCost,
          gross_profit: grossProfit,
          total_expenses: totalExpenses,
          total_refund_amount: totalRefund,
          net_profit: netProfit,
          gross_margin_pct: grossRevenue > 0 ? Math.round((grossProfit / grossRevenue) * 10000) / 100 : 0,
        },
        returns: returnsRes.rows[0],
        customers: newCustomersRes.rows[0],
        inventory: {
          low_stock_count: lowStockRes.rows[0].low_stock_count,
          pending_po_count: pendingPORes.rows[0].pending_po_count,
        },
      },
      message: 'Success',
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/reports/sales-by-day
 * Daily sales breakdown for charting.
 */
const salesByDay = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const range = getDateRange(req, res);
    if (!range) return;
    const { from, to } = range;

    const result = await pool.query(
      `SELECT so.created_at::DATE AS day,
              COUNT(*)::INTEGER AS order_count,
              COALESCE(SUM(so.total), 0) AS revenue
       FROM sales_orders so
       WHERE so.organization_id = $1 AND so.status != 'cancelled'
         AND so.created_at::DATE BETWEEN $2 AND $3
       GROUP BY day ORDER BY day ASC`,
      [orgId, from, to]
    );
    return res.json({ success: true, data: result.rows, message: 'Success' });
  } catch (err) { next(err); }
};

/**
 * GET /api/reports/top-products
 * Top selling products by quantity and revenue.
 */
const topProducts = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const range = getDateRange(req, res);
    if (!range) return;
    const { from, to } = range;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    const result = await pool.query(
      `SELECT soi.product_id, p.name AS product_name, p.sku,
              SUM(soi.quantity)::INTEGER AS total_quantity_sold,
              COALESCE(SUM(soi.price * soi.quantity - soi.discount), 0) AS total_revenue,
              COALESCE(SUM(soi.cost * soi.quantity), 0) AS total_cost
       FROM sales_order_items soi
       JOIN products p ON p.id = soi.product_id
       JOIN sales_orders so ON so.id = soi.sales_order_id
       WHERE so.organization_id = $1 AND so.status != 'cancelled'
         AND so.created_at::DATE BETWEEN $2 AND $3
       GROUP BY soi.product_id, p.name, p.sku
       ORDER BY total_quantity_sold DESC LIMIT $4`,
      [orgId, from, to, limit]
    );
    return res.json({ success: true, data: result.rows, message: 'Success' });
  } catch (err) { next(err); }
};

/**
 * GET /api/reports/sales-by-channel
 * Sales breakdown by channel (in_store, whatsapp, etc.)
 */
const salesByChannel = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const range = getDateRange(req, res);
    if (!range) return;
    const { from, to } = range;

    const result = await pool.query(
      `SELECT channel,
              COUNT(*)::INTEGER AS order_count,
              COALESCE(SUM(total), 0) AS revenue
       FROM sales_orders
       WHERE organization_id = $1 AND status != 'cancelled'
         AND created_at::DATE BETWEEN $2 AND $3
       GROUP BY channel ORDER BY revenue DESC`,
      [orgId, from, to]
    );
    return res.json({ success: true, data: result.rows, message: 'Success' });
  } catch (err) { next(err); }
};

/**
 * GET /api/reports/expenses-by-category
 */
const expensesByCategory = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;
    const range = getDateRange(req, res);
    if (!range) return;
    const { from, to } = range;

    const result = await pool.query(
      `SELECT ec.name AS category, COALESCE(SUM(e.amount), 0) AS total
       FROM expense_categories ec
       LEFT JOIN expenses e ON e.category_id = ec.id AND e.date BETWEEN $2 AND $3
       WHERE ec.organization_id = $1
       GROUP BY ec.id, ec.name ORDER BY total DESC`,
      [orgId, from, to]
    );
    return res.json({ success: true, data: result.rows, message: 'Success' });
  } catch (err) { next(err); }
};

/**
 * GET /api/reports/low-stock
 * Products at or below their low_stock_threshold.
 */
const lowStock = async (req, res, next) => {
  try {
    const orgId = req.user.org_id;

    const result = await pool.query(
      `SELECT p.id, p.name, p.sku, p.low_stock_threshold,
              c.name AS category_name,
              sl.location_id,
              l.name AS location_name,
              COALESCE(SUM(sl.quantity_change), 0)::INTEGER AS stock_on_hand
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN stock_ledger sl ON sl.product_id = p.id AND sl.variant_id IS NULL
       LEFT JOIN locations l ON l.id = sl.location_id
       WHERE p.organization_id = $1 AND p.active = TRUE AND p.low_stock_threshold > 0
       GROUP BY p.id, p.name, p.sku, p.low_stock_threshold, c.name, sl.location_id, l.name
       HAVING COALESCE(SUM(sl.quantity_change), 0) <= p.low_stock_threshold
       ORDER BY stock_on_hand ASC, p.name ASC`,
      [orgId]
    );
    return res.json({ success: true, data: result.rows, message: 'Success' });
  } catch (err) { next(err); }
};

module.exports = { dashboard, salesByDay, topProducts, salesByChannel, expensesByCategory, lowStock };
