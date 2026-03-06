'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, withTransaction } = require('../db/pool');
const auditService = require('../services/audit.service');

const BCRYPT_ROUNDS = 12;

// In-memory account lockout: 5 failed attempts within 15 minutes locks the account
const loginAttempts = new Map(); // key: email, value: { count, firstAt }
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

// Periodic cleanup: prevent unbounded Map growth under credential-stuffing attacks (B05).
// Entries are evicted lazily on next access, but this interval catches unique-email floods.
setInterval(() => {
  const cutoff = Date.now() - LOCKOUT_MS;
  for (const [email, data] of loginAttempts)
    if (data.firstAt < cutoff) loginAttempts.delete(email);
}, 5 * 60 * 1000).unref();

function checkLockout(email) {
  const entry = loginAttempts.get(email);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > LOCKOUT_MS) {
    loginAttempts.delete(email);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(email) {
  const entry = loginAttempts.get(email);
  if (!entry || Date.now() - entry.firstAt > LOCKOUT_MS) {
    loginAttempts.set(email, { count: 1, firstAt: Date.now() });
  } else {
    entry.count += 1;
  }
}

function clearAttempts(email) {
  loginAttempts.delete(email);
}

const issueToken = (user, roleName) =>
  jwt.sign(
    { sub: user.id, org: user.organization_id, role: roleName, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

/**
 * POST /api/auth/register
 * Creates Organization + default Branch + default Location + owner User in one transaction.
 */
const register = async (req, res, next) => {
  try {
    const { org_name, country, currency, name, email, password } = req.body;

    const result = await withTransaction(async (client) => {
      // Check email uniqueness
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        const err = new Error('An account with this email already exists');
        err.isAppError = true; err.statusCode = 409; err.errorCode = 'DUPLICATE_ENTRY';
        throw err;
      }

      // Create organization
      const orgRes = await client.query(
        `INSERT INTO organizations (name, country, currency) VALUES ($1, $2, $3) RETURNING *`,
        [org_name.trim(), country || null, currency.trim()]
      );
      const org = orgRes.rows[0];

      // Create default branch
      const branchRes = await client.query(
        `INSERT INTO branches (organization_id, name) VALUES ($1, 'Main Branch') RETURNING *`,
        [org.id]
      );
      const branch = branchRes.rows[0];

      // Create default location (Main Warehouse)
      await client.query(
        `INSERT INTO locations (branch_id, name, type) VALUES ($1, 'Main Warehouse', 'warehouse') RETURNING *`,
        [branch.id]
      );

      // Get owner role id
      const roleRes = await client.query(`SELECT id FROM roles WHERE name = 'owner'`);
      if (!roleRes.rows.length) throw new Error('Owner role not found. Run schema.sql seed data first.');
      const ownerRole = roleRes.rows[0];

      // Hash password
      const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Create owner user
      const userRes = await client.query(
        `INSERT INTO users (organization_id, name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING *`,
        [org.id, name.trim(), email, password_hash]
      );
      const user = userRes.rows[0];

      // Assign owner role
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
        [user.id, ownerRole.id]
      );

      await auditService.log({ client, orgId: org.id, userId: user.id, action: 'create', entity: 'organizations', entityId: org.id });

      return { org, user };
    });

    const token = issueToken(result.user, 'owner');

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: 'owner',
          organization_id: result.user.organization_id,
        },
        organization: {
          id: result.org.id,
          name: result.org.name,
          currency: result.org.currency,
        },
      },
      message: 'Registration successful',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Never reveals which field (email or password) is wrong.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const genericError = { success: false, data: null, error: 'UNAUTHENTICATED', message: 'Invalid credentials' };

    if (checkLockout(email)) {
      // user has not been fetched yet at this point — use null for all user fields
      try {
        await auditService.log({ client: pool, orgId: null, userId: null, action: 'login_failed', entity: 'users', entityId: null });
      } catch (_) {}
      return res.status(429).json({ success: false, data: null, error: 'RATE_LIMITED', message: 'Too many failed login attempts. Try again later.' });
    }

    const userRes = await pool.query(
      `SELECT u.id, u.organization_id, u.name, u.email, u.password_hash, u.active, r.name AS role_name
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.email = $1
       LIMIT 1`,
      [email]
    );

    const user = userRes.rows[0];

    if (!user || !user.active) {
      recordFailedAttempt(email);
      await auditService.log({ client: pool, orgId: user ? user.organization_id : null, userId: user ? user.id : null, action: 'login_failed', entity: 'users', entityId: user ? user.id : null });
      return res.status(401).json(genericError);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      recordFailedAttempt(email);
      await auditService.log({ client: pool, orgId: user.organization_id, userId: user.id, action: 'login_failed', entity: 'users', entityId: user.id });
      return res.status(401).json(genericError);
    }

    clearAttempts(email);
    await auditService.log({ client: pool, orgId: user.organization_id, userId: user.id, action: 'login', entity: 'users', entityId: user.id });

    const token = issueToken(user, user.role_name || 'staff');

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role_name || 'staff',
          organization_id: user.organization_id,
        },
      },
      message: 'Login successful',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const me = async (req, res, next) => {
  try {
    const userRes = await pool.query(
      `SELECT u.id, u.name, u.email, u.organization_id, u.active, u.created_at, r.name AS role
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ success: false, data: null, error: 'NOT_FOUND', message: 'User not found' });
    return res.status(200).json({ success: true, data: user, message: 'Success' });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/auth/password
 */
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    await withTransaction(async (client) => {
      const userRes = await client.query(
        'SELECT id, password_hash FROM users WHERE id = $1 FOR UPDATE',
        [req.user.id]
      );
      const user = userRes.rows[0];
      if (!user) {
        const err = new Error('User not found'); err.isAppError = true; err.statusCode = 404; err.errorCode = 'NOT_FOUND'; throw err;
      }

      const valid = await bcrypt.compare(current_password, user.password_hash);
      if (!valid) {
        const err = new Error('Current password is incorrect'); err.isAppError = true; err.statusCode = 401; err.errorCode = 'UNAUTHENTICATED'; throw err;
      }

      const newHash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);
      await client.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);
      await auditService.log({ client, orgId: req.user.org_id, userId: req.user.id, action: 'update', entity: 'users', entityId: req.user.id });
    });

    return res.status(200).json({ success: true, data: null, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me, changePassword };
