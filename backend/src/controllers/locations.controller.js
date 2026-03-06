'use strict';

const { pool } = require('../db/pool');
const auditService = require('../services/audit.service');

const list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;
    const branchId = req.query.branch_id || null;

    let where = 'WHERE b.organization_id = $1 AND l.active = TRUE AND b.active = TRUE';
    const values = [req.user.org_id];
    let idx = 2;

    if (search) { where += ` AND l.name ILIKE $${idx++}`; values.push(search); }
    if (branchId) { where += ` AND l.branch_id = $${idx++}`; values.push(branchId); }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM locations l JOIN branches b ON b.id = l.branch_id ${where}`, values
    );
    const total = parseInt(countRes.rows[0].count);

    values.push(limit, offset);
    const dataRes = await pool.query(
      `SELECT l.*, b.name AS branch_name FROM locations l JOIN branches b ON b.id = l.branch_id ${where} ORDER BY l.name ASC LIMIT $${idx} OFFSET $${idx + 1}`,
      values
    );

    return res.json({
      success: true, data: dataRes.rows, message: 'Success',
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { branch_id, name, type } = req.body;
    const branchCheck = await pool.query(`SELECT id FROM branches WHERE id = $1 AND organization_id = $2 AND active = TRUE`, [branch_id, req.user.org_id]);
    if (!branchCheck.rows.length) return res.status(404).json({ success: false, data: null, error: 'NOT_FOUND', message: 'Branch not found in your organization' });

    const result = await pool.query(
      `INSERT INTO locations (branch_id, name, type) VALUES ($1, $2, $3) RETURNING *`,
      [branch_id, name.trim(), type]
    );
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'create', entity: 'locations', entityId: result.rows[0].id });
    return res.status(201).json({ success: true, data: result.rows[0], message: 'Location created' });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT l.*, b.name AS branch_name FROM locations l JOIN branches b ON b.id = l.branch_id WHERE l.id = $1 AND b.organization_id = $2 AND l.active = TRUE`,
      [req.params.id, req.user.org_id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, data: null, error: 'NOT_FOUND', message: 'Location not found' });
    return res.json({ success: true, data: result.rows[0], message: 'Success' });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const check = await pool.query(
      `SELECT l.id FROM locations l JOIN branches b ON b.id = l.branch_id WHERE l.id = $1 AND b.organization_id = $2 AND l.active = TRUE`,
      [req.params.id, req.user.org_id]
    );
    if (!check.rows.length) return res.status(404).json({ success: false, data: null, error: 'NOT_FOUND', message: 'Location not found' });

    const { name, type } = req.body;
    const updates = []; const values = []; let idx = 1;
    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name.trim()); }
    if (type !== undefined) { updates.push(`type = $${idx++}`); values.push(type); }
    if (!updates.length) return res.status(400).json({ success: false, error: 'NO_CHANGES', message: 'No valid fields provided for update' });
    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);

    const result = await pool.query(`UPDATE locations SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'update', entity: 'locations', entityId: req.params.id });
    return res.json({ success: true, data: result.rows[0], message: 'Location updated' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const check = await pool.query(
      `SELECT l.id FROM locations l JOIN branches b ON b.id = l.branch_id WHERE l.id = $1 AND b.organization_id = $2 AND l.active = TRUE`,
      [req.params.id, req.user.org_id]
    );
    if (!check.rows.length) return res.status(404).json({ success: false, data: null, error: 'NOT_FOUND', message: 'Location not found' });
    await pool.query(`UPDATE locations SET active = FALSE, updated_at = NOW() WHERE id = $1`, [req.params.id]);
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'delete', entity: 'locations', entityId: req.params.id });
    return res.json({ success: true, data: null, message: 'Location deactivated' });
  } catch (err) { next(err); }
};

module.exports = { list, create, getOne, update, remove };
