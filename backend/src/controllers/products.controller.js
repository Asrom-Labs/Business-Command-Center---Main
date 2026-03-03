'use strict';

const { pool } = require('../db/pool');
const auditService = require('../services/audit.service');

const list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;
    const { category_id } = req.query;
    const activeFilter = req.query.active;

    const vals = [req.user.org_id];
    let where = 'WHERE p.organization_id = $1';
    let idx = 2;

    if (search) {
      where += ` AND (p.name ILIKE $${idx} OR p.sku ILIKE $${idx} OR p.barcode ILIKE $${idx})`;
      vals.push(search); idx++;
    }
    if (category_id) { where += ` AND p.category_id = $${idx++}`; vals.push(category_id); }
    if (activeFilter !== undefined) { where += ` AND p.active = $${idx++}`; vals.push(activeFilter === 'true' || activeFilter === true); }

    const countRes = await pool.query(`SELECT COUNT(*) FROM products p ${where}`, vals);
    const total = parseInt(countRes.rows[0].count);

    vals.push(limit, offset);
    const dataRes = await pool.query(
      `SELECT p.id, p.organization_id, p.name, p.sku, p.barcode, p.price, p.cost,
              p.low_stock_threshold, p.active, p.created_at, p.updated_at,
              c.id AS category_id, c.name AS category_name,
              u.id AS unit_id, u.name AS unit_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN units u ON u.id = p.unit_id
       ${where}
       ORDER BY p.name ASC LIMIT $${idx} OFFSET $${idx + 1}`,
      vals
    );

    return res.json({ success: true, data: dataRes.rows, message: 'Success', pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { name, sku = null, barcode = null, price = null, cost = null, low_stock_threshold = 0, category_id = null, unit_id = null } = req.body;

    if (category_id) {
      const catChk = await pool.query(`SELECT id FROM categories WHERE id = $1 AND organization_id = $2`, [category_id, req.user.org_id]);
      if (!catChk.rows.length) return res.status(422).json({ success: false, error: 'VALIDATION_ERROR', message: 'category_id does not belong to your organization' });
    }

    const result = await pool.query(
      `INSERT INTO products (organization_id, category_id, unit_id, name, sku, barcode, price, cost, low_stock_threshold)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.org_id, category_id, unit_id, name.trim(), sku, barcode, price, cost, low_stock_threshold]
    );

    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'create', entity: 'products', entityId: result.rows[0].id });
    return res.status(201).json({ success: true, data: result.rows[0], message: 'Product created' });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const prodRes = await pool.query(
      `SELECT p.id, p.organization_id, p.name, p.sku, p.barcode, p.price, p.cost,
              p.low_stock_threshold, p.active, p.created_at, p.updated_at,
              c.id AS category_id, c.name AS category_name,
              u.id AS unit_id, u.name AS unit_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN units u ON u.id = p.unit_id
       WHERE p.id = $1 AND p.organization_id = $2`,
      [id, orgId]
    );
    if (!prodRes.rows.length) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Product not found' });

    const product = prodRes.rows[0];

    const varRes = await pool.query(
      `SELECT pv.*, COALESCE(pv.price, $2) AS effective_price, COALESCE(pv.cost, $3) AS effective_cost
       FROM product_variants pv WHERE pv.product_id = $1 ORDER BY pv.name ASC`,
      [id, product.price, product.cost]
    );

    const stockRes = await pool.query(
      `SELECT l.id AS location_id, l.name AS location_name, b.name AS branch_name,
              COALESCE(SUM(sl.change_qty), 0)::INTEGER AS stock_on_hand
       FROM locations l
       JOIN branches b ON b.id = l.branch_id
       LEFT JOIN stock_ledger sl ON sl.location_id = l.id AND sl.product_id = $1 AND sl.variant_id IS NULL
       WHERE b.organization_id = $2
       GROUP BY l.id, l.name, b.name ORDER BY l.name ASC`,
      [id, orgId]
    );

    product.variants = varRes.rows;
    product.stock_by_location = stockRes.rows;

    return res.json({ success: true, data: product, message: 'Success' });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const orgId = req.user.org_id;

    const existing = await pool.query(`SELECT id FROM products WHERE id = $1 AND organization_id = $2`, [id, orgId]);
    if (!existing.rows.length) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Product not found' });

    if (req.body.category_id) {
      const catChk = await pool.query(`SELECT id FROM categories WHERE id = $1 AND organization_id = $2`, [req.body.category_id, orgId]);
      if (!catChk.rows.length) return res.status(422).json({ success: false, error: 'VALIDATION_ERROR', message: 'category_id does not belong to your organization' });
    }

    const allowedFields = ['name', 'sku', 'barcode', 'price', 'cost', 'low_stock_threshold', 'category_id', 'unit_id', 'active'];
    const sets = []; const vals = []; let idx = 1;

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        sets.push(`${field} = $${idx++}`);
        vals.push(typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field]);
      }
    }
    if (!sets.length) return res.status(400).json({ success: false, error: 'NO_CHANGES', message: 'No valid fields provided for update' });
    sets.push(`updated_at = NOW()`);
    vals.push(id);

    const result = await pool.query(`UPDATE products SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    await auditService.log({ client: pool, orgId, userId: req.user.id, action: 'update', entity: 'products', entityId: id });
    return res.json({ success: true, data: result.rows[0], message: 'Product updated' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await pool.query(`SELECT id, active FROM products WHERE id = $1 AND organization_id = $2`, [id, req.user.org_id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Product not found' });

    const result = await pool.query(`UPDATE products SET active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *`, [id]);
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'delete', entity: 'products', entityId: id });
    return res.json({ success: true, data: result.rows[0], message: 'Product deactivated' });
  } catch (err) { next(err); }
};

module.exports = { list, create, getOne, update, remove };
