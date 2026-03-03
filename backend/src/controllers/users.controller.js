'use strict';

const bcrypt = require('bcryptjs');
const { pool, withTransaction } = require('../db/pool');
const auditService = require('../services/audit.service');

const BCRYPT_ROUNDS = 12;

const list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;

    let where = 'WHERE u.organization_id = $1';
    const values = [req.user.org_id];
    let idx = 2;
    if (search) { where += ` AND (u.name ILIKE $${idx} OR u.email ILIKE $${idx})`; values.push(search); idx++; }

    const countRes = await pool.query(`SELECT COUNT(*) FROM users u ${where}`, values);
    const total = parseInt(countRes.rows[0].count);

    values.push(limit, offset);
    const dataRes = await pool.query(
      `SELECT u.id, u.name, u.email, u.active, u.created_at, u.updated_at, r.name AS role
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       ${where}
       ORDER BY u.name ASC LIMIT $${idx} OFFSET $${idx + 1}`,
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
    const { name, email, password, role } = req.body;

    const result = await withTransaction(async (client) => {
      if (role === 'admin' && req.user.role !== 'owner') {
        const err = new Error('Only owners can create admin users');
        err.isAppError = true; err.statusCode = 403; err.errorCode = 'FORBIDDEN'; throw err;
      }

      const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length) {
        const err = new Error('Email already in use');
        err.isAppError = true; err.statusCode = 409; err.errorCode = 'DUPLICATE_ENTRY'; throw err;
      }

      const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [role]);
      if (!roleRes.rows.length) {
        const err = new Error('Invalid role'); err.isAppError = true; err.statusCode = 400; err.errorCode = 'VALIDATION_ERROR'; throw err;
      }

      const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const userRes = await client.query(
        `INSERT INTO users (organization_id, name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.user.org_id, name.trim(), email, password_hash]
      );
      const user = userRes.rows[0];

      await client.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [user.id, roleRes.rows[0].id]);
      await auditService.log({ client, orgId: req.user.org_id, userId: req.user.id, action: 'create', entity: 'users', entityId: user.id });
      return { ...user, role };
    });

    return res.status(201).json({
      success: true,
      data: { id: result.id, name: result.name, email: result.email, role: result.role, active: result.active },
      message: 'User created',
    });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.active, u.created_at, u.updated_at, r.name AS role
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.id = $1 AND u.organization_id = $2`,
      [req.params.id, req.user.org_id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'User not found' });
    return res.json({ success: true, data: result.rows[0], message: 'Success' });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { name, role, active } = req.body;

    if (req.params.id === req.user.id && (role !== undefined || active === false)) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Cannot modify your own role or deactivate yourself' });
    }

    const result = await withTransaction(async (client) => {
      const check = await client.query(
        `SELECT u.*, r.name AS role_name FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id LEFT JOIN roles r ON r.id = ur.role_id WHERE u.id = $1 AND u.organization_id = $2`,
        [req.params.id, req.user.org_id]
      );
      if (!check.rows.length) {
        const err = new Error('User not found'); err.isAppError = true; err.statusCode = 404; err.errorCode = 'NOT_FOUND'; throw err;
      }
      const user = check.rows[0];

      if (user.role_name === 'owner' && req.user.role !== 'owner') {
        const err = new Error('Cannot modify an owner account'); err.isAppError = true; err.statusCode = 403; err.errorCode = 'FORBIDDEN'; throw err;
      }
      if (role === 'owner') {
        const err = new Error('Cannot assign owner role via this endpoint'); err.isAppError = true; err.statusCode = 403; err.errorCode = 'FORBIDDEN'; throw err;
      }

      const updates = []; const values = []; let idx = 1;
      if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name.trim()); }
      if (active !== undefined) { updates.push(`active = $${idx++}`); values.push(active); }
      if (updates.length) {
        updates.push(`updated_at = NOW()`);
        values.push(req.params.id);
        await client.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values);
      }

      if (role !== undefined && role !== user.role_name) {
        const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [role]);
        if (!roleRes.rows.length) {
          const err = new Error('Invalid role'); err.isAppError = true; err.statusCode = 400; err.errorCode = 'VALIDATION_ERROR'; throw err;
        }
        await client.query('DELETE FROM user_roles WHERE user_id = $1', [req.params.id]);
        await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [req.params.id, roleRes.rows[0].id]);
      }

      await auditService.log({ client, orgId: req.user.org_id, userId: req.user.id, action: 'update', entity: 'users', entityId: req.params.id });

      const updated = await client.query(
        `SELECT u.id, u.name, u.email, u.active, u.updated_at, r.name AS role FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id LEFT JOIN roles r ON r.id = ur.role_id WHERE u.id = $1`,
        [req.params.id]
      );
      return updated.rows[0];
    });

    return res.json({ success: true, data: result, message: 'User updated' });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await withTransaction(async (client) => {
      const check = await client.query(
        `SELECT u.*, r.name AS role_name FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id LEFT JOIN roles r ON r.id = ur.role_id WHERE u.id = $1 AND u.organization_id = $2`,
        [req.params.id, req.user.org_id]
      );
      if (!check.rows.length) {
        const err = new Error('User not found'); err.isAppError = true; err.statusCode = 404; err.errorCode = 'NOT_FOUND'; throw err;
      }
      if (req.params.id === req.user.id) {
        const err = new Error('Cannot delete your own account'); err.isAppError = true; err.statusCode = 403; err.errorCode = 'FORBIDDEN'; throw err;
      }
      if (check.rows[0].role_name === 'owner') {
        const ownerCount = await client.query(
          `SELECT COUNT(*) FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id WHERE u.organization_id = $1 AND r.name = 'owner' AND u.active = TRUE`,
          [req.user.org_id]
        );
        if (parseInt(ownerCount.rows[0].count) <= 1) {
          const err = new Error('Cannot delete the last owner of the organization'); err.isAppError = true; err.statusCode = 422; err.errorCode = 'BUSINESS_RULE'; throw err;
        }
      }
      await client.query('DELETE FROM user_roles WHERE user_id = $1', [req.params.id]);
      await client.query('DELETE FROM users WHERE id = $1', [req.params.id]);
      await auditService.log({ client, orgId: req.user.org_id, userId: req.user.id, action: 'delete', entity: 'users', entityId: req.params.id });
    });
    return res.json({ success: true, data: null, message: 'User deleted' });
  } catch (err) { next(err); }
};

module.exports = { list, create, getOne, update, remove };
