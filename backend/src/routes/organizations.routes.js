'use strict';

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireMinRole } = require('../middleware/auth');
const ctrl = require('../controllers/organizations.controller');

router.use(authenticate);

// GET /api/organizations/me
router.get('/me', ctrl.getMyOrg);

// PATCH /api/organizations/me
router.patch(
  '/me',
  requireMinRole('admin'),
  [
    body('name').optional().trim().notEmpty().withMessage('Name must not be empty').isLength({ max: 255 }),
    body('country').optional().trim().isLength({ max: 100 }),
    body('currency').optional().trim().isLength({ max: 10 }),
  ],
  validate,
  ctrl.updateMyOrg
);

module.exports = router;
