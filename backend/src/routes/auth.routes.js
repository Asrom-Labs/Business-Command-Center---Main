'use strict';

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');

// POST /api/auth/register
router.post(
  '/register',
  [
    body('org_name').trim().notEmpty().withMessage('Organization name is required').isLength({ max: 255 }),
    body('country').optional().trim().isLength({ max: 100 }),
    body('currency').trim().notEmpty().withMessage('Currency is required').isLength({ max: 10 }),
    body('name').trim().notEmpty().withMessage('User name is required').isLength({ max: 255 }),
    body('email').trim().normalizeEmail().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').trim().normalizeEmail().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.login
);

// GET /api/auth/me
router.get('/me', authenticate, authController.me);

// PATCH /api/auth/password
router.patch(
  '/password',
  authenticate,
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  validate,
  authController.changePassword
);

module.exports = router;
