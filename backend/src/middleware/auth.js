'use strict';

const jwt = require('jsonwebtoken');

/**
 * Authenticate requests by verifying the Bearer JWT token.
 * Attaches req.user = { id, org_id, role, name } on success.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHENTICATED',
      message: 'Authentication token required',
    });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.sub,
      org_id: decoded.org,
      role: decoded.role,
      name: decoded.name,
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Token is invalid or expired',
    });
  }
};

const ROLE_HIERARCHY = { readonly: 1, staff: 2, admin: 3, owner: 4 };

/**
 * Require the user to have one of the specified roles.
 */
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'UNAUTHENTICATED', message: 'Not authenticated' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Insufficient permissions' });
  }
  next();
};

/**
 * Require the user to have at least the given minimum role level.
 */
const requireMinRole = (minRole) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'UNAUTHENTICATED', message: 'Not authenticated' });
  }
  const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
  if (userLevel < requiredLevel) {
    return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authenticate, requireRole, requireMinRole };
