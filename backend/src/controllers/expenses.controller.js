'use strict';

const { pool } = require('../db/pool');
const auditService = require('../services/audit.service');

// ── Expense Categories ────────────────────────────────────────────────────────

const listCategories = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM expense_categories WHERE organization_id = $1 ORDER BY name ASC`, [req.user.org_id]
    );
    return res.json({ success: true, data: result.rows, message: 'Success' });
  } catch (err) { next(err); }
};

const createCategory = async (req, res, next) => {
  try {
    const result = await pool.query(
      `INSERT INTO expense_categories (organization_id, name) VALUES ($1, $2) RETURNING *`,
      [req.user.org_id, req.body.name.trim()]
    );
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'create', entity: 'expense_categories', entityId: result.rows[0].id });
    return res.status(201).json({ success: true, data: result.rows[0], message: 'Expense category created' });
  } catch (err) { next(err); }
};

const getOneCategory = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM expense_categories WHERE id = $1 AND organization_id = $2`,
      [req.params.id, req.user.org_id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, data: null, error: 'NOT_FOUND', message: 'Category not found' });
    }
    return res.json({ success: true, data: result.rows[0], message: 'Success' });
  } catch (err) { next(err); }
};

const updateCategory = async (req, res, next) => {
  try {
    const chk = await pool.query(
      `SELECT id FROM expense_categories WHERE id = $1 AND organization_id = $2`,
      [req.params.id, req.user.org_id]
    );
    if (!chk.rows.length) {
      return res.status(404).json({ success: false, data: null, error: 'NOT_FOUND', message: 'Category not found' });
    }
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, data: null, error: 'VALIDATION_ERROR', message: 'name is required' });
    }
    const result = await pool.query(
      `UPDATE expense_categories SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [name.trim(), req.params.id]
    );
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'update', entity: 'expense_categories', entityId: req.params.id });
    return res.json({ success: true, data: result.rows[0], message: 'Category updated' });
  } catch (err) { next(err); }
};

const deleteCategory = async (req, res, next) => {
  try {
    const chk = await pool.query(
      `SELECT id FROM expense_categories WHERE id = $1 AND organization_id = $2`, [req.params.id, req.user.org_id]
    );
    if (!chk.rows.length) {
      return res.status(404).json({ success: false, data: null, error: 'NOT_FOUND', message: 'Category not found' });
    }
    await pool.query(`DELETE FROM expense_categories WHERE id = $1`, [req.params.id]);
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'delete', entity: 'expense_categories', entityId: req.params.id });
    return res.json({ success: true, data: null, message: 'Category deleted' });
  } catch (err) { next(err); }
};

// ── Expenses ──────────────────────────────────────────────────────────────────

const list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { category_id, location_id, from, to } = req.query;

    if (from && to && from > to) {
      return res.status(400).json({ success: false, data: null, error: 'VALIDATION_ERROR', message: "'from' date must be on or before 'to' date" });
    }

    const vals = [req.user.org_id];
    let w = 'WHERE e.organization_id = $1'; let idx = 2;
    if (category_id) { w += ` AND e.category_id = $${idx++}`; vals.push(category_id); }
    if (location_id) { w += ` AND e.location_id = $${idx++}`; vals.push(location_id); }
    if (from) { w += ` AND e.date >= $${idx++}`; vals.push(from); }
    if (to) { w += ` AND e.date <= $${idx++}`; vals.push(to); }

    const countRes = await pool.query(`SELECT COUNT(*) FROM expenses e ${w}`, vals);
    const total = parseInt(countRes.rows[0].count);

    vals.push(limit, offset);
    const dataRes = await pool.query(
      `SELECT e.*, ec.name AS category_name, l.name AS location_name, u.name AS created_by_name
       FROM expenses e
       JOIN expense_categories ec ON ec.id = e.category_id
       LEFT JOIN locations l ON l.id = e.location_id
       LEFT JOIN users u ON u.id = e.created_by
       ${w}
       ORDER BY e.date DESC, e.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
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
    const { category_id, location_id = null, amount, date, recurring = false, note = null } = req.body;
    const orgId = req.user.org_id;

    const catChk = await pool.query(
      `SELECT id FROM expense_categories WHERE id = $1 AND organization_id = $2`, [category_id, orgId]
    );
    if (!catChk.rows.length) {
      return res.status(422).json({ success: false, data: null, error: 'VALIDATION_ERROR', message: 'Expense category not found' });
    }

    const result = await pool.query(
      `INSERT INTO expenses (organization_id, category_id, location_id, amount, date, recurring, note, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [orgId, category_id, location_id, amount, date, recurring, note, req.user.id]
    );
    await auditService.log({ client: pool, orgId, userId: req.user.id, action: 'create', entity: 'expenses', entityId: result.rows[0].id });
    return res.status(201).json({ success: true, data: result.rows[0], message: 'Expense recorded' });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT e.*, ec.name AS category_name, l.name AS location_name
       FROM expenses e
       JOIN expense_categories ec ON ec.id = e.category_id
       LEFT JOIN locations l ON l.id = e.location_id
       WHERE e.id = $1 AND e.organization_id = $2`,
      [req.params.id, req.user.org_id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, data: null, error: 'NOT_FOUND', message: 'Expense not found' });
    }
    return res.json({ success: true, data: result.rows[0], message: 'Success' });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const chk = await pool.query(
      `SELECT id FROM expenses WHERE id = $1 AND organization_id = $2`, [req.params.id, req.user.org_id]
    );
    if (!chk.rows.length) {
      return res.status(404).json({ success: false, data: null, error: 'NOT_FOUND', message: 'Expense not found' });
    }

    if (req.body.category_id) {
      const catChk = await pool.query(
        `SELECT id FROM expense_categories WHERE id = $1 AND organization_id = $2`,
        [req.body.category_id, req.user.org_id]
      );
      if (!catChk.rows.length) {
        return res.status(422).json({ success: false, data: null, error: 'VALIDATION_ERROR', message: 'Expense category not found in your organization' });
      }
    }

    const allowedFields = ['category_id', 'location_id', 'amount', 'date', 'recurring', 'note'];
    const sets = []; const vals = []; let idx = 1;
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        sets.push(`${field} = $${idx++}`);
        vals.push(req.body[field]);
      }
    }
    if (!sets.length) {
      return res.status(400).json({ success: false, data: null, error: 'NO_CHANGES', message: 'No valid fields provided for update' });
    }
    sets.push(`updated_at = NOW()`);
    vals.push(req.params.id);

    const result = await pool.query(`UPDATE expenses SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'update', entity: 'expenses', entityId: req.params.id });
    return res.json({ success: true, data: result.rows[0], message: 'Expense updated' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const chk = await pool.query(
      `SELECT id FROM expenses WHERE id = $1 AND organization_id = $2`, [req.params.id, req.user.org_id]
    );
    if (!chk.rows.length) {
      return res.status(404).json({ success: false, data: null, error: 'NOT_FOUND', message: 'Expense not found' });
    }
    await pool.query(`DELETE FROM expenses WHERE id = $1`, [req.params.id]);
    await auditService.log({ client: pool, orgId: req.user.org_id, userId: req.user.id, action: 'delete', entity: 'expenses', entityId: req.params.id });
    return res.json({ success: true, data: null, message: 'Expense deleted' });
  } catch (err) { next(err); }
};

module.exports = { listCategories, createCategory, getOneCategory, updateCategory, deleteCategory, list, create, getOne, update, remove };
