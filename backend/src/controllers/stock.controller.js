'use strict';

const { pool, withTransaction } = require('../db/pool');
const auditService = require('../services/audit.service');
const stockService = require('../services/stock.service');

/**
 * GET /api/stock
 * Current stock on hand for all products across all locations in the org.
 * Optional filters: location_id, product_id, low_stock
 */
const getStock = async (req, res, next) => {
  try {
    const { location_id, product_id } = req.query;
    const lowStock = req.query.low_stock === 'true';
    const orgId = req.user.org_id;

    const vals = [orgId];
    let w = 'WHERE p.organization_id = $1'; let idx = 2;
    if (location_id) { w += ` AND sl.location_id = $${idx++}`; vals.push(location_id); }
    if (product_id) { w += ` AND sl.product_id = $${idx++}`; vals.push(product_id); }

    let havingClause = lowStock ? 'HAVING SUM(sl.quantity_change) <= p.low_stock_threshold' : '';

    const result = await pool.query(
      `SELECT sl.product_id, sl.variant_id, sl.location_id,
              p.name AS product_name, p.sku, p.low_stock_threshold,
              pv.name AS variant_name,
              l.name AS location_name,
              b.name AS branch_name,
              SUM(sl.quantity_change)::INTEGER AS stock_on_hand
       FROM stock_ledger sl
       JOIN products p ON p.id = sl.product_id
       LEFT JOIN product_variants pv ON pv.id = sl.variant_id
       JOIN locations l ON l.id = sl.location_id
       JOIN branches b ON b.id = l.branch_id
       ${w}
       GROUP BY sl.product_id, sl.variant_id, sl.location_id,
                p.name, p.sku, p.low_stock_threshold,
                pv.name, l.name, b.name
       ${havingClause}
       ORDER BY p.name ASC, l.name ASC`,
      vals
    );
    return res.json({ success: true, data: result.rows, message: 'Success' });
  } catch (err) { next(err); }
};

/**
 * GET /api/stock/ledger
 * Paginated raw stock ledger entries for the org.
 */
const getLedger = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const { product_id, location_id, movement_type } = req.query;
    const orgId = req.user.org_id;

    const vals = [orgId];
    let w = 'WHERE p.organization_id = $1'; let idx = 2;
    if (product_id) { w += ` AND sl.product_id = $${idx++}`; vals.push(product_id); }
    if (location_id) { w += ` AND sl.location_id = $${idx++}`; vals.push(location_id); }
    if (movement_type) { w += ` AND sl.movement_type = $${idx++}`; vals.push(movement_type); }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM stock_ledger sl JOIN products p ON p.id = sl.product_id ${w}`, vals
    );
    const total = parseInt(countRes.rows[0].count);

    vals.push(limit, offset);
    const dataRes = await pool.query(
      `SELECT sl.*, p.name AS product_name, pv.name AS variant_name,
              l.name AS location_name, u.name AS created_by_name
       FROM stock_ledger sl
       JOIN products p ON p.id = sl.product_id
       LEFT JOIN product_variants pv ON pv.id = sl.variant_id
       JOIN locations l ON l.id = sl.location_id
       LEFT JOIN users u ON u.id = sl.created_by
       ${w}
       ORDER BY sl.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      vals
    );
    return res.json({
      success: true, data: dataRes.rows, message: 'Success',
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/stock/adjust
 * Manual stock adjustment — writes an 'adjustment' ledger entry.
 */
const adjust = async (req, res, next) => {
  try {
    const { product_id, variant_id = null, location_id, quantity_change, note = null } = req.body;
    const orgId = req.user.org_id;

    // Validate product belongs to org
    const prodChk = await pool.query(
      `SELECT id FROM products WHERE id = $1 AND organization_id = $2`, [product_id, orgId]
    );
    if (!prodChk.rows.length) {
      return res.status(422).json({ success: false, error: 'VALIDATION_ERROR', message: 'Product not found' });
    }

    // Validate location belongs to org
    const locChk = await pool.query(
      `SELECT l.id FROM locations l JOIN branches b ON b.id = l.branch_id WHERE l.id = $1 AND b.organization_id = $2`,
      [location_id, orgId]
    );
    if (!locChk.rows.length) {
      return res.status(422).json({ success: false, error: 'VALIDATION_ERROR', message: 'Location not found' });
    }

    const newStock = await withTransaction(async (client) => {
      await stockService.insertLedgerEntry(client, {
        productId: product_id,
        variantId: variant_id,
        locationId: location_id,
        changeQty: quantity_change,
        movementType: 'adjustment',
        referenceId: null,
        note,
        createdBy: req.user.id,
      });

      await auditService.log({
        client, orgId, userId: req.user.id,
        action: 'adjustment', entity: 'stock_ledger', entityId: product_id,
        changes: { product_id, location_id, quantity_change },
      });

      return stockService.getStockOnHand(client, product_id, variant_id, location_id);
    });

    return res.status(201).json({ success: true, data: { product_id, location_id, stock_on_hand: newStock }, message: 'Stock adjusted' });
  } catch (err) { next(err); }
};

module.exports = { getStock, getLedger, adjust };
