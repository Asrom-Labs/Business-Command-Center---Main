'use strict';

const { pool } = require('../db/pool');
const auditService = require('../services/audit.service');

const list = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const orgId = req.user.org_id;

    const prodChk = await pool.query(
      `SELECT id FROM products WHERE id = $1 AND organization_id = $2`, [productId, orgId]
    );
    if (!prodChk.rows.length) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Product not found' });
    }

    const result = await pool.query(
      `SELECT * FROM product_variants WHERE product_id = $1 ORDER BY name ASC`, [productId]
    );
    return res.json({ success: true, data: result.rows, message: 'Success' });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const orgId = req.user.org_id;
    const { name, sku = null, barcode = null, price = null, cost = null } = req.body;

    const prodChk = await pool.query(
      `SELECT id FROM products WHERE id = $1 AND organization_id = $2`, [productId, orgId]
    );
    if (!prodChk.rows.length) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Product not found' });
    }

    const result = await pool.query(
      `INSERT INTO product_variants (product_id, name, sku, barcode, price, cost)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [productId, name.trim(), sku, barcode, price, cost]
    );
    await auditService.log({ client: pool, orgId, userId: req.user.id, action: 'create', entity: 'product_variants', entityId: result.rows[0].id });
    return res.status(201).json({ success: true, data: result.rows[0], message: 'Variant created' });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { productId, id } = req.params;
    const orgId = req.user.org_id;

    const result = await pool.query(
      `SELECT pv.* FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE pv.id = $1 AND pv.product_id = $2 AND p.organization_id = $3`,
      [id, productId, orgId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Variant not found' });
    }
    return res.json({ success: true, data: result.rows[0], message: 'Success' });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { productId, id } = req.params;
    const orgId = req.user.org_id;

    const chk = await pool.query(
      `SELECT pv.id FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE pv.id = $1 AND pv.product_id = $2 AND p.organization_id = $3`,
      [id, productId, orgId]
    );
    if (!chk.rows.length) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Variant not found' });
    }

    const allowedFields = ['name', 'sku', 'barcode', 'price', 'cost', 'active'];
    const sets = []; const vals = []; let idx = 1;
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        sets.push(`${field} = $${idx++}`);
        vals.push(typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field]);
      }
    }
    if (!sets.length) {
      return res.status(400).json({ success: false, error: 'NO_CHANGES', message: 'No valid fields provided' });
    }
    sets.push(`updated_at = NOW()`);
    vals.push(id);

    const result = await pool.query(
      `UPDATE product_variants SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, vals
    );
    await auditService.log({ client: pool, orgId, userId: req.user.id, action: 'update', entity: 'product_variants', entityId: id });
    return res.json({ success: true, data: result.rows[0], message: 'Variant updated' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const { productId, id } = req.params;
    const orgId = req.user.org_id;

    const chk = await pool.query(
      `SELECT pv.id FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE pv.id = $1 AND pv.product_id = $2 AND p.organization_id = $3`,
      [id, productId, orgId]
    );
    if (!chk.rows.length) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Variant not found' });
    }

    await pool.query(`UPDATE product_variants SET active = FALSE, updated_at = NOW() WHERE id = $1`, [id]);
    await auditService.log({ client: pool, orgId, userId: req.user.id, action: 'delete', entity: 'product_variants', entityId: id });
    return res.json({ success: true, data: null, message: 'Variant deactivated' });
  } catch (err) { next(err); }
};

module.exports = { list, create, getOne, update, remove };
