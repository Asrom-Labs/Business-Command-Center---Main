'use strict';

const { pool, withTransaction } = require('../db/pool');
const auditService = require('../services/audit.service');
const stockService = require('../services/stock.service');

const list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const vals = [req.user.org_id];
    const countRes = await pool.query(`SELECT COUNT(*) FROM returns WHERE organization_id = $1`, vals);
    const total = parseInt(countRes.rows[0].count);

    vals.push(limit, offset);
    const dataRes = await pool.query(
      `SELECT r.*, rr.reason AS reason_name, u.name AS created_by_name
       FROM returns r
       LEFT JOIN return_reasons rr ON rr.id = r.reason_id
       LEFT JOIN users u ON u.id = r.created_by
       WHERE r.organization_id = $1
       ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
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
    const { sales_order_id, reason_id = null, note = null, items } = req.body;
    const orgId = req.user.org_id;

    const result = await withTransaction(async (client) => {
      const soRes = await client.query(
        `SELECT so.*, l.id AS location_id FROM sales_orders so JOIN locations l ON l.id = so.location_id WHERE so.id = $1 AND so.organization_id = $2 FOR UPDATE`,
        [sales_order_id, orgId]
      );
      if (!soRes.rows.length) {
        const err = new Error('Sales order not found'); err.isAppError = true; err.statusCode = 404; err.errorCode = 'NOT_FOUND'; throw err;
      }
      const so = soRes.rows[0];

      if (so.status === 'cancelled') {
        const err = new Error('Cannot return items from a cancelled order');
        err.isAppError = true; err.statusCode = 422; err.errorCode = 'BUSINESS_RULE'; throw err;
      }

      let totalRefund = 0;
      const resolvedItems = [];

      for (const item of items) {
        const { sales_order_item_id, quantity_returned, refund_amount = 0 } = item;

        const soiRes = await client.query(
          `SELECT * FROM sales_order_items WHERE id = $1 AND sales_order_id = $2`, [sales_order_item_id, sales_order_id]
        );
        if (!soiRes.rows.length) {
          const err = new Error('Sales order item not found on this order');
          err.isAppError = true; err.statusCode = 422; err.errorCode = 'VALIDATION_ERROR'; throw err;
        }
        const soi = soiRes.rows[0];

        const prevRes = await client.query(
          `SELECT COALESCE(SUM(ri.quantity_returned), 0)::INTEGER AS already_returned
           FROM return_items ri
           JOIN returns r ON r.id = ri.return_id
           WHERE ri.sales_order_item_id = $1 AND r.organization_id = $2`,
          [sales_order_item_id, orgId]
        );
        const alreadyReturned = prevRes.rows[0].already_returned;
        const remainingReturnable = soi.quantity - alreadyReturned;

        if (quantity_returned > remainingReturnable) {
          const err = new Error(`Return quantity (${quantity_returned}) exceeds remaining returnable quantity (${remainingReturnable})`);
          err.isAppError = true; err.statusCode = 422; err.errorCode = 'BUSINESS_RULE'; throw err;
        }

        const maxRefund = parseFloat(soi.price) * quantity_returned;
        if (parseFloat(refund_amount) > maxRefund + 0.01) {
          const err = new Error(`Refund amount (${refund_amount}) exceeds item value (${maxRefund.toFixed(2)})`);
          err.isAppError = true; err.statusCode = 422; err.errorCode = 'BUSINESS_RULE'; throw err;
        }

        totalRefund += parseFloat(refund_amount);
        resolvedItems.push({ soi, quantity_returned, refund_amount });
      }

      const returnRes = await client.query(
        `INSERT INTO returns (organization_id, sales_order_id, reason_id, total_refund_amount, note, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [orgId, sales_order_id, reason_id, totalRefund, note, req.user.id]
      );
      const returnId = returnRes.rows[0].id;

      for (const item of resolvedItems) {
        await client.query(
          `INSERT INTO return_items (return_id, sales_order_item_id, product_id, variant_id, quantity_returned, refund_amount)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [returnId, item.soi.id, item.soi.product_id, item.soi.variant_id, item.quantity_returned, item.refund_amount]
        );

        // Return stock to the original location
        await stockService.insertLedgerEntry(client, {
          productId: item.soi.product_id,
          variantId: item.soi.variant_id,
          locationId: so.location_id,
          changeQty: item.quantity_returned,
          movementType: 'return',
          referenceId: returnId,
          note: `Return for order ${sales_order_id}`,
          createdBy: req.user.id,
        });
      }

      // Update customer credit balance if this order has a customer.
      // Lock the customer row first to prevent concurrent returns from double-crediting (B06).
      if (so.customer_id && totalRefund > 0) {
        await client.query('SELECT id FROM customers WHERE id = $1 FOR UPDATE', [so.customer_id]);
        await client.query(
          `UPDATE customers SET credit_balance = credit_balance + $1, updated_at = NOW() WHERE id = $2`,
          [totalRefund, so.customer_id]
        );
      }

      await auditService.log({ client, orgId, userId: req.user.id, action: 'create', entity: 'returns', entityId: returnId });
      return returnRes.rows[0];
    });

    return res.status(201).json({ success: true, data: result, message: 'Return processed and stock restored' });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const returnRes = await pool.query(
      `SELECT r.*, rr.reason AS reason_name, u.name AS created_by_name
       FROM returns r
       LEFT JOIN return_reasons rr ON rr.id = r.reason_id
       LEFT JOIN users u ON u.id = r.created_by
       WHERE r.id = $1 AND r.organization_id = $2`,
      [id, orgId]
    );
    if (!returnRes.rows.length) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Return not found' });
    }

    const itemsRes = await pool.query(
      `SELECT ri.*, p.name AS product_name, pv.name AS variant_name
       FROM return_items ri
       JOIN products p ON p.id = ri.product_id
       LEFT JOIN product_variants pv ON pv.id = ri.variant_id
       WHERE ri.return_id = $1`,
      [id]
    );

    const ret = returnRes.rows[0];
    ret.items = itemsRes.rows;
    return res.json({ success: true, data: ret, message: 'Success' });
  } catch (err) { next(err); }
};

const listReasons = async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM return_reasons ORDER BY reason ASC`);
    return res.json({ success: true, data: result.rows, message: 'Success' });
  } catch (err) { next(err); }
};

module.exports = { list, create, getOne, listReasons };
