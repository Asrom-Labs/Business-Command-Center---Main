'use strict';

const { pool, withTransaction } = require('../db/pool');
const auditService = require('../services/audit.service');
const stockService = require('../services/stock.service');

const list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { status } = req.query;

    const vals = [req.user.org_id];
    let w = 'WHERE t.organization_id = $1'; let idx = 2;
    if (status) { w += ` AND t.status = $${idx++}`; vals.push(status); }

    const countRes = await pool.query(`SELECT COUNT(*) FROM transfers t ${w}`, vals);
    const total = parseInt(countRes.rows[0].count);

    vals.push(limit, offset);
    const dataRes = await pool.query(
      `SELECT t.*,
              fl.name AS from_location_name, tl.name AS to_location_name,
              u.name AS created_by_name
       FROM transfers t
       JOIN locations fl ON fl.id = t.from_location_id
       JOIN locations tl ON tl.id = t.to_location_id
       LEFT JOIN users u ON u.id = t.created_by
       ${w}
       ORDER BY t.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
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
    const { from_location_id, to_location_id, note, items } = req.body;
    const orgId = req.user.org_id;

    if (from_location_id === to_location_id) {
      return res.status(422).json({ success: false, error: 'BUSINESS_RULE', message: 'Source and destination location must be different' });
    }

    const result = await withTransaction(async (client) => {
      // Verify both locations belong to the org
      const locRes = await client.query(
        `SELECT l.id FROM locations l JOIN branches b ON b.id = l.branch_id WHERE l.id = ANY($1::uuid[]) AND b.organization_id = $2`,
        [[from_location_id, to_location_id], orgId]
      );
      if (locRes.rows.length < 2) {
        const err = new Error('One or more locations not found in your organization');
        err.isAppError = true; err.statusCode = 422; err.errorCode = 'VALIDATION_ERROR'; throw err;
      }

      const transfer = await client.query(
        `INSERT INTO transfers (organization_id, from_location_id, to_location_id, status, note, created_by)
         VALUES ($1, $2, $3, 'pending', $4, $5) RETURNING *`,
        [orgId, from_location_id, to_location_id, note || null, req.user.id]
      );
      const transferId = transfer.rows[0].id;

      for (const item of items) {
        const { product_id, variant_id = null, quantity } = item;

        const prodChk = await client.query(
          `SELECT id FROM products WHERE id = $1 AND organization_id = $2 AND active = TRUE`, [product_id, orgId]
        );
        if (!prodChk.rows.length) {
          const err = new Error('Product not found or is not active');
          err.isAppError = true; err.statusCode = 422; err.errorCode = 'VALIDATION_ERROR'; throw err;
        }

        await client.query(
          `INSERT INTO transfer_items (transfer_id, product_id, variant_id, quantity) VALUES ($1, $2, $3, $4)`,
          [transferId, product_id, variant_id, quantity]
        );
      }

      await auditService.log({ client, orgId, userId: req.user.id, action: 'create', entity: 'transfers', entityId: transferId });
      return transfer.rows[0];
    });

    return res.status(201).json({ success: true, data: result, message: 'Transfer created' });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const transferRes = await pool.query(
      `SELECT t.*,
              fl.name AS from_location_name, tl.name AS to_location_name,
              u.name AS created_by_name
       FROM transfers t
       JOIN locations fl ON fl.id = t.from_location_id
       JOIN locations tl ON tl.id = t.to_location_id
       LEFT JOIN users u ON u.id = t.created_by
       WHERE t.id = $1 AND t.organization_id = $2`,
      [id, orgId]
    );
    if (!transferRes.rows.length) {
      return res.status(404).json({ success: false, data: null, error: 'NOT_FOUND', message: 'Transfer not found' });
    }

    const itemsRes = await pool.query(
      `SELECT ti.*, p.name AS product_name, pv.name AS variant_name
       FROM transfer_items ti
       JOIN products p ON p.id = ti.product_id
       LEFT JOIN product_variants pv ON pv.id = ti.variant_id
       WHERE ti.transfer_id = $1`,
      [id]
    );

    const transfer = transferRes.rows[0];
    transfer.items = itemsRes.rows;
    return res.json({ success: true, data: transfer, message: 'Success' });
  } catch (err) { next(err); }
};

const confirm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const result = await withTransaction(async (client) => {
      const transferRes = await client.query(
        `SELECT * FROM transfers WHERE id = $1 AND organization_id = $2 FOR UPDATE`, [id, orgId]
      );
      if (!transferRes.rows.length) {
        const err = new Error('Transfer not found'); err.isAppError = true; err.statusCode = 404; err.errorCode = 'NOT_FOUND'; throw err;
      }
      const transfer = transferRes.rows[0];
      if (transfer.status !== 'pending') {
        const err = new Error(`Cannot confirm a transfer with status '${transfer.status}'`);
        err.isAppError = true; err.statusCode = 422; err.errorCode = 'BUSINESS_RULE'; throw err;
      }

      const itemsRes = await client.query(
        `SELECT * FROM transfer_items WHERE transfer_id = $1`, [id]
      );

      for (const item of itemsRes.rows) {
        // Write transfer_out from source
        await stockService.insertLedgerEntry(client, {
          productId: item.product_id,
          variantId: item.variant_id,
          locationId: transfer.from_location_id,
          changeQty: -item.quantity,
          movementType: 'transfer_out',
          referenceId: id,
          note: `Transfer to ${transfer.to_location_id}`,
          createdBy: req.user.id,
        });

        // Write transfer_in to destination
        await stockService.insertLedgerEntry(client, {
          productId: item.product_id,
          variantId: item.variant_id,
          locationId: transfer.to_location_id,
          changeQty: item.quantity,
          movementType: 'transfer_in',
          referenceId: id,
          note: `Transfer from ${transfer.from_location_id}`,
          createdBy: req.user.id,
        });
      }

      const updated = await client.query(
        `UPDATE transfers SET status = 'completed', updated_at = NOW() WHERE id = $1 RETURNING *`, [id]
      );
      await auditService.log({ client, orgId, userId: req.user.id, action: 'confirm', entity: 'transfers', entityId: id });
      return updated.rows[0];
    });

    return res.json({ success: true, data: result, message: 'Transfer confirmed and stock updated' });
  } catch (err) { next(err); }
};

const cancel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const result = await withTransaction(async (client) => {
      const transferRes = await client.query(
        `SELECT * FROM transfers WHERE id = $1 AND organization_id = $2 FOR UPDATE`, [id, orgId]
      );
      if (!transferRes.rows.length) {
        const err = new Error('Transfer not found'); err.isAppError = true; err.statusCode = 404; err.errorCode = 'NOT_FOUND'; throw err;
      }
      if (transferRes.rows[0].status !== 'pending') {
        const err = new Error(`Cannot cancel a transfer with status '${transferRes.rows[0].status}'`);
        err.isAppError = true; err.statusCode = 422; err.errorCode = 'BUSINESS_RULE'; throw err;
      }

      const updated = await client.query(
        `UPDATE transfers SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`, [id]
      );
      await auditService.log({ client, orgId, userId: req.user.id, action: 'cancel', entity: 'transfers', entityId: id });
      return updated.rows[0];
    });

    return res.json({ success: true, data: result, message: 'Transfer cancelled' });
  } catch (err) { next(err); }
};

module.exports = { list, create, getOne, confirm, cancel };
