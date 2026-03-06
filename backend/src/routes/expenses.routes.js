'use strict';

const express = require('express');
const router = express.Router();
const { body, param, query: qv } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireMinRole } = require('../middleware/auth');
const ctrl = require('../controllers/expenses.controller');

router.use(authenticate);

// ── Categories ────────────────────────────────────────────────────────────────
router.get('/categories', ctrl.listCategories);

router.post('/categories', requireMinRole('admin'), [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }),
], validate, ctrl.createCategory);

router.get('/categories/:id', [param('id').isUUID()], validate, ctrl.getOneCategory);

router.patch('/categories/:id', requireMinRole('admin'), [
  param('id').isUUID(),
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }),
], validate, ctrl.updateCategory);

router.delete('/categories/:id', requireMinRole('admin'), [param('id').isUUID()], validate, ctrl.deleteCategory);

// ── Expenses ──────────────────────────────────────────────────────────────────
router.get('/', [
  qv('category_id').optional().isUUID(),
  qv('location_id').optional().isUUID(),
  qv('from').optional().isISO8601(),
  qv('to').optional().isISO8601(),
  qv('page').optional().isInt({ min: 1 }),
  qv('limit').optional().isInt({ min: 1, max: 100 }),
], validate, ctrl.list);

router.post('/', requireMinRole('staff'), [
  body('category_id').isUUID().withMessage('category_id is required'),
  body('location_id').optional({ nullable: true }).isUUID(),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('recurring').optional().isBoolean(),
  body('note').optional({ nullable: true }).trim(),
], validate, ctrl.create);

router.get('/:id', [param('id').isUUID()], validate, ctrl.getOne);

router.patch('/:id', requireMinRole('staff'), [
  param('id').isUUID(),
  body('category_id').optional().isUUID(),
  body('location_id').optional({ nullable: true }).isUUID(),
  body('amount').optional().isFloat({ min: 0.01 }),
  body('date').optional().isISO8601(),
  body('recurring').optional().isBoolean(),
  body('note').optional({ nullable: true }).trim(),
], validate, ctrl.update);

router.delete('/:id', requireMinRole('admin'), [param('id').isUUID()], validate, ctrl.remove);

module.exports = router;
