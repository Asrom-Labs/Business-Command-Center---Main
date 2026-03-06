'use strict';

const { pool, withTransaction } = require('../db/pool');
const auditService = require('../services/audit.service');
const stockService = require('../services/stock.service');

const list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { status, supplier_id } = req.query;

    const vals = [req.user.org_id];
    let w = 'WHERE po.organization_id = $1'; let idx = 2;
    if (status) { w += ` AND po.status = $${idx++}`; vals.push(status); }
    if (supplier_id) { w += ` AND po.supplier_id = $${idx++}`; vals.push(supplier_id); }

    const countRes = await pool.query(`SELECT COUNT(*) FROM purchase_orders po ${w}`, vals);
    const total = parseInt(countRes.rows[0].count);

    vals.push(limit, offset);
    const dataRes = await pool.query(
      `SELECT po.*, s.name AS supplier_name, l.name AS location_name, u.name AS created_by_name
       FROM purchase_orders po
       JOIN suppliers s ON s.id = po.supplier_id
       JOIN locations l ON l.id = po.location_id
       LEFT JOIN users u ON u.id = po.created_by
       ${w}
       ORDER BY po.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
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
    const { supplier_id, location_id, expected_date = null, note = null, items } = req.body;
    const orgId = req.user.org_id;

    const result = await withTransaction(async (client) => {
      // Validate supplier belongs to org
      const supChk = await client.query(`SELECT id FROM suppliers WHERE id = $1 AND organization_id = $2`, [supplier_id, orgId]);
      if (!supChk.rows.length) {
        const err = new Error('Supplier not found in your organization'); err.isAppError = true; err.statusCode = 422; err.errorCode = 'VALIDATION_ERROR'; throw err;
      }

      // Validate location belongs to org
      const locChk = await client.query(
        `SELECT l.id FROM locations l JOIN branches b ON b.id = l.branch_id WHERE l.id = $1 AND b.organization_id = $2`,
        [location_id, orgId]
      );
      if (!locChk.rows.length) {
        const err = new Error('Location not found in your organization'); err.isAppError = true; err.statusCode = 422; err.errorCode = 'VALIDATION_ERROR'; throw err;
      }

      const poRes = await client.query(
        `INSERT INTO purchase_orders (organization_id, supplier_id, location_id, status, expected_date, note, created_by)
         VALUES ($1, $2, $3, 'draft', $4, $5, $6) RETURNING *`,
        [orgId, supplier_id, location_id, expected_date, note, req.user.id]
      );
      const poId = poRes.rows[0].id;

      for (const item of items) {
        const { product_id, variant_id = null, quantity, unit_cost } = item;
        const prodChk = await client.query(
          `SELECT id FROM products WHERE id = $1 AND organization_id = $2 AND active = TRUE`, [product_id, orgId]
        );
        if (!prodChk.rows.length) {
          const err = new Error('Product not found or is not active');
          err.isAppError = true; err.statusCode = 422; err.errorCode = 'VALIDATION_ERROR'; throw err;
        }
        await client.query(
          `INSERT INTO purchase_order_items (purchase_order_id, product_id, variant_id, quantity, cost) VALUES ($1, $2, $3, $4, $5)`,
          [poId, product_id, variant_id, quantity, unit_cost]
        );
      }

      await auditService.log({ client, orgId, userId: req.user.id, action: 'create', entity: 'purchase_orders', entityId: poId });
      return poRes.rows[0];
    });

    return res.status(201).json({ success: true, data: result, message: 'Purchase order created' });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const poRes = await pool.query(
      `SELECT po.*, s.name AS supplier_name, l.name AS location_name, u.name AS created_by_name
       FROM purchase_orders po
       JOIN suppliers s ON s.id = po.supplier_id
       JOIN locations l ON l.id = po.location_id
       LEFT JOIN users u ON u.id = po.created_by
       WHERE po.id = $1 AND po.organization_id = $2`,
      [id, orgId]
    );
    if (!poRes.rows.length) {
      return res.status(404).json({ success: false, data: null, error: 'NOT_FOUND', message: 'Purchase order not found' });
    }

    const itemsRes = await pool.query(
      `SELECT poi.*, p.name AS product_name, pv.name AS variant_name
       FROM purchase_order_items poi
       JOIN products p ON p.id = poi.product_id
       LEFT JOIN product_variants pv ON pv.id = poi.variant_id
       WHERE poi.purchase_order_id = $1`,
      [id]
    );

    const receiptsRes = await pool.query(
      `SELECT gr.id, gr.received_at, gr.note, u.name AS created_by_name
       FROM goods_receipts gr
       LEFT JOIN users u ON u.id = gr.created_by
       WHERE gr.purchase_order_id = $1 ORDER BY gr.received_at DESC`,
      [id]
    );

    const po = poRes.rows[0];
    po.items = itemsRes.rows;
    po.receipts = receiptsRes.rows;
    return res.json({ success: true, data: po, message: 'Success' });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const orgId = req.user.org_id;

    const result = await withTransaction(async (client) => {
      const chk = await client.query(
        `SELECT status FROM purchase_orders WHERE id = $1 AND organization_id = $2 FOR UPDATE`, [id, orgId]
      );
      if (!chk.rows.length) {
        const err = new Error('Purchase order not found'); err.isAppError = true; err.statusCode = 404; err.errorCode = 'NOT_FOUND'; throw err;
      }

      const current = chk.rows[0].status;
      const validTransitions = {
        draft: ['submitted', 'cancelled'],
        submitted: ['partially_received', 'received', 'cancelled'],
        partially_received: ['received', 'cancelled'],
      };
      if (!validTransitions[current] || !validTransitions[current].includes(status)) {
        const err = new Error(`Cannot transition from '${current}' to '${status}'`);
        err.isAppError = true; err.statusCode = 422; err.errorCode = 'BUSINESS_RULE'; throw err;
      }

      const updated = await client.query(
        `UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [status, id]
      );
      await auditService.log({ client, orgId, userId: req.user.id, action: 'status_change', entity: 'purchase_orders', entityId: id, changes: { from: current, to: status } });
      return updated.rows[0];
    });

    return res.json({ success: true, data: result, message: `Status updated to ${status}` });
  } catch (err) { next(err); }
};

/**
 * POST /purchase-orders/:id/receive
 * Creates a goods receipt, writes purchase stock ledger entries, and updates PO status.
 */
const receive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note = null, items } = req.body;
    const orgId = req.user.org_id;

    const result = await withTransaction(async (client) => {
      const poRes = await client.query(
        `SELECT po.*, l.id AS loc_id FROM purchase_orders po JOIN locations l ON l.id = po.location_id WHERE po.id = $1 AND po.organization_id = $2 FOR UPDATE`,
        [id, orgId]
      );
      if (!poRes.rows.length) {
        const err = new Error('Purchase order not found'); err.isAppError = true; err.statusCode = 404; err.errorCode = 'NOT_FOUND'; throw err;
      }
      const po = poRes.rows[0];

      if (!['submitted', 'partially_received'].includes(po.status)) {
        const err = new Error(`Cannot receive goods for a PO with status '${po.status}'`);
        err.isAppError = true; err.statusCode = 422; err.errorCode = 'BUSINESS_RULE'; throw err;
      }

      const grRes = await client.query(
        `INSERT INTO goods_receipts (organization_id, purchase_order_id, note, created_by) VALUES ($1, $2, $3, $4) RETURNING *`,
        [orgId, id, note, req.user.id]
      );
      const grId = grRes.rows[0].id;

      for (const item of items) {
        const { purchase_order_item_id, product_id: itemProductId, quantity_received } = item;

        let poiRes;
        if (purchase_order_item_id) {
          poiRes = await client.query(
            `SELECT * FROM purchase_order_items WHERE id = $1 AND purchase_order_id = $2`,
            [purchase_order_item_id, id]
          );
          if (!poiRes.rows.length) {
            const err = new Error('Purchase order item not found on this order');
            err.isAppError = true; err.statusCode = 422; err.errorCode = 'VALIDATION_ERROR'; throw err;
          }
        } else {
          // Caller supplied product_id — find the matching PO item automatically
          poiRes = await client.query(
            `SELECT * FROM purchase_order_items WHERE product_id = $1 AND purchase_order_id = $2`,
            [itemProductId, id]
          );
          if (!poiRes.rows.length) {
            const err = new Error('No matching item found for this product on the purchase order');
            err.isAppError = true; err.statusCode = 422; err.errorCode = 'VALIDATION_ERROR'; throw err;
          }
        }
        const poi = poiRes.rows[0];

        await client.query(
          `INSERT INTO goods_receipt_items (goods_receipt_id, purchase_order_item_id, product_id, variant_id, quantity_received)
           VALUES ($1, $2, $3, $4, $5)`,
          [grId, poi.id, poi.product_id, poi.variant_id, quantity_received]
        );

        // Write stock ledger entry
        await stockService.insertLedgerEntry(client, {
          productId: poi.product_id,
          variantId: poi.variant_id,
          locationId: po.location_id,
          changeQty: quantity_received,
          movementType: 'purchase',
          referenceId: grId,
          note: `Goods receipt for PO`,
          createdBy: req.user.id,
        });
      }

      // Determine new PO status: check if all items are fully received
      const itemsRes = await client.query(
        `SELECT poi.quantity,
                COALESCE(SUM(gri.quantity_received), 0) AS received
         FROM purchase_order_items poi
         LEFT JOIN goods_receipt_items gri ON gri.purchase_order_item_id = poi.id
         WHERE poi.purchase_order_id = $1
         GROUP BY poi.id, poi.quantity`,
        [id]
      );
      const allReceived = itemsRes.rows.every((r) => parseInt(r.received) >= parseInt(r.quantity));
      const newStatus = allReceived ? 'received' : 'partially_received';

      await client.query(
        `UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2`, [newStatus, id]
      );

      await auditService.log({ client, orgId, userId: req.user.id, action: 'receive', entity: 'goods_receipts', entityId: grId });
      return grRes.rows[0];
    });

    return res.status(201).json({ success: true, data: result, message: 'Goods received and stock updated' });
  } catch (err) { next(err); }
};

module.exports = { list, create, getOne, updateStatus, receive };
