'use strict';

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireMinRole } = require('../middleware/auth');
const ctrl = require('../controllers/users.controller');

router.use(authenticate);

router.get('/', requireMinRole('admin'), ctrl.list);
router.post('/', requireMinRole('admin'), [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }),
  body('email').trim().normalizeEmail().isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['admin', 'staff', 'readonly']).withMessage('Role must be admin, staff, or readonly'),
], validate, ctrl.create);
router.get('/:id', requireMinRole('admin'), [param('id').isUUID()], validate, ctrl.getOne);
router.patch('/:id', requireMinRole('admin'), [
  param('id').isUUID(),
  body('name').optional().trim().notEmpty().isLength({ max: 255 }),
  body('role').optional().isIn(['admin', 'staff', 'readonly']).withMessage('Invalid role'),
  body('active').optional().isBoolean(),
], validate, ctrl.update);
router.delete('/:id', requireMinRole('owner'), [param('id').isUUID()], validate, ctrl.remove);

module.exports = router;
