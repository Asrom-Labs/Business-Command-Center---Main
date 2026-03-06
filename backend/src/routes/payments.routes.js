'use strict';

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireMinRole } = require('../middleware/auth');
const ctrl = require('../controllers/payments.controller');

router.use(authenticate);

// GET /api/payments/order/:orderId
router.get('/order/:orderId', requireMinRole('staff'), [param('orderId').isUUID()], validate, ctrl.listForOrder);

// POST /api/payments/order/:orderId
router.post('/order/:orderId', requireMinRole('staff'), [
  param('orderId').isUUID(),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('method').isIn(['cash', 'card', 'bank_transfer', 'credit', 'store_credit', 'other']).withMessage('Invalid payment method'),
  body('note').optional({ nullable: true }).trim(),
], validate, ctrl.create);

module.exports = router;
