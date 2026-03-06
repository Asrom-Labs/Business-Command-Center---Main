'use strict';

const { pool, withTransaction } = require('../db/pool');
const auditService = require('../services/audit.service');
const stockService = require('../services/stock.service');

const list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { status, channel, customer_id, location_id } = req.query;

    const vals = [req.user.org_id];
    let w = 'WHERE so.organization_id = $1'; let idx = 2;
    if (status) { w += ` AND so.status = $${idx++}`; vals.push(status); }
    if (channel) { w += ` AND so.channel = $${idx++}`; vals.push(channel); }
    if (customer_id) { w += ` AND so.customer_id = $${idx++}`; vals.push(customer_id); }
    if (location_id) { w += ` AND so.location_id = $${idx++}`; vals.push(location_id); }

    const countRes = await pool.query(`SELECT COUNT(*) FROM sales_orders so ${w}`, vals);
    const total = parseInt(countRes.rows[0].count);

    vals.push(limit, offset);
    const dataRes = await pool.query(
      `SELECT so.*, c.name AS customer_name, l.name AS location_name, u.name AS user_name
       FROM sales_orders so
       LEFT JOIN customers c ON c.id = so.customer_id
       JOIN locations l ON l.id = so.location_id
       LEFT JOIN users u ON u.id = so.user_id
       ${w}
       ORDER BY so.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      vals
    );
    return res.json({
      success: true, data: dataRes.rows, message: 'Success',
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const {
      customer_id = null, location_id, channel = 'in_store',
      discount = 0, tax = 0, note = null, items,
    } = req.body;
    const orgId = req.user.org_id;

    const result = await withTransaction(async (client) => {
      // Validate location
      const locChk = await client.query(
        `SELECT l.id FROM locations l JOIN branches b ON b.id = l.branch_id WHERE l.id = $1 AND b.organization_id = $2`,
        [location_id, orgId]
      );
      if (!locChk.rows.length) {
        const err = new Error('Location not found'); err.isAppError = true; err.statusCode = 422; err.errorCode = 'VALIDATION_ERROR'; throw err;
      }

      // Validate customer if provided
      if (customer_id) {
        const custChk = await client.query(`SELECT id FROM customers WHERE id = $1 AND organization_id = $2`, [customer_id, orgId]);
        if (!custChk.rows.length) {
          const err = new Error('Customer not found'); err.isAppError = true; err.statusCode = 422; err.errorCode = 'VALIDATION_ERROR'; throw err;
        }
      }

      let subtotal = 0;

      // Validate products and compute subtotal
      const resolvedItems = [];
      for (const item of items) {
        const { product_id, variant_id = null, quantity, price: overridePrice = null, discount: itemDiscount = 0 } = item;

        const prodRes = await client.query(
          `SELECT p.price, p.cost, pv.price AS var_price, pv.cost AS var_cost
           FROM products p
           LEFT JOIN product_variants pv ON pv.id = $2
           WHERE p.id = $1 AND p.organization_id = $3 AND p.active = TRUE`,
          [product_id, variant_id, orgId]
        );
        if (!prodRes.rows.length) {
          const err = new Error('Product not found or is not active');
          err.isAppError = true; err.statusCode = 422; err.errorCode = 'VALIDATION_ERROR'; throw err;
        }

        const prod = prodRes.rows[0];
        const effectivePrice = overridePrice !== null ? overridePrice : (prod.var_price !== null ? prod.var_price : prod.price || 0);
        const effectiveCost = prod.var_cost !== null ? prod.var_cost : prod.cost || 0;
        const lineTotal = effectivePrice * quantity - itemDiscount;
        subtotal += lineTotal;

        resolvedItems.push({ product_id, variant_id, quantity, price: effectivePrice, discount: itemDiscount, cost: effectiveCost });
      }

      const total = subtotal - discount + tax;

      const soRes = await client.query(
        `INSERT INTO sales_orders (organization_id, customer_id, location_id, user_id, channel, status, subtotal, discount, tax, total, note)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9, $10) RETURNING *`,
        [orgId, customer_id, location_id, req.user.id, channel, subtotal, discount, tax, total, note]
      );
      const soId = soRes.rows[0].id;

      for (const item of resolvedItems) {
        await client.query(
          `INSERT INTO sales_order_items (sales_order_id, product_id, variant_id, quantity, price, discount, cost)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [soId, item.product_id, item.variant_id, item.quantity, item.price, item.discount, item.cost]
        );

        // Deduct stock
        await stockService.insertLedgerEntry(client, {
          productId: item.product_id,
          variantId: item.variant_id,
          locationId: location_id,
          changeQty: -item.quantity,
          movementType: 'sale',
          referenceId: soId,
          note: `Sale order`,
          createdBy: req.user.id,
        });
      }

      await auditService.log({ client, orgId, userId: req.user.id, action: 'create', entity: 'sales_orders', entityId: soId });
      return soRes.rows[0];
    });

    return res.status(201).json({ success: true, data: result, message: 'Sales order created' });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const soRes = await pool.query(
      `SELECT so.*, c.name AS customer_name, l.name AS location_name, u.name AS user_name
       FROM sales_orders so
       LEFT JOIN customers c ON c.id = so.customer_id
       JOIN locations l ON l.id = so.location_id
       LEFT JOIN users u ON u.id = so.user_id
       WHERE so.id = $1 AND so.organization_id = $2`,
      [id, orgId]
    );
    if (!soRes.rows.length) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Sales order not found' });
    }

    const itemsRes = await pool.query(
      `SELECT soi.*, p.name AS product_name, pv.name AS variant_name
       FROM sales_order_items soi
       JOIN products p ON p.id = soi.product_id
       LEFT JOIN product_variants pv ON pv.id = soi.variant_id
       WHERE soi.sales_order_id = $1`,
      [id]
    );

    const paymentsRes = await pool.query(
      `SELECT * FROM payments WHERE sales_order_id = $1 ORDER BY paid_at DESC`, [id]
    );

    const so = soRes.rows[0];
    so.items = itemsRes.rows;
    so.payments = paymentsRes.rows;
    return res.json({ success: true, data: so, message: 'Success' });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const orgId = req.user.org_id;

    const chk = await pool.query(
      `SELECT status FROM sales_orders WHERE id = $1 AND organization_id = $2`, [id, orgId]
    );
    if (!chk.rows.length) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Sales order not found' });
    }

    const result = await pool.query(
      `UPDATE sales_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [status, id]
    );
    await auditService.log({ client: pool, orgId, userId: req.user.id, action: 'status_change', entity: 'sales_orders', entityId: id, changes: { from: chk.rows[0].status, to: status } });
    return res.json({ success: true, data: result.rows[0], message: 'Status updated' });
  } catch (err) { next(err); }
};

module.exports = { list, create, getOne, updateStatus };
