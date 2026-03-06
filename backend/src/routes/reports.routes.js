'use strict';

const express = require('express');
const router = express.Router();
const { query: qv } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireMinRole } = require('../middleware/auth');
const ctrl = require('../controllers/reports.controller');

router.use(authenticate);

const dateRangeValidators = [
  qv('from').optional().isISO8601().withMessage('from must be a valid date (YYYY-MM-DD)'),
  qv('to').optional().isISO8601().withMessage('to must be a valid date (YYYY-MM-DD)'),
];

router.get('/dashboard', dateRangeValidators, validate, ctrl.dashboard);

router.get('/sales-by-day', dateRangeValidators, validate, ctrl.salesByDay);

router.get('/top-products', [
  ...dateRangeValidators,
  qv('limit').optional().isInt({ min: 1, max: 50 }),
], validate, ctrl.topProducts);

router.get('/sales-by-channel', dateRangeValidators, validate, ctrl.salesByChannel);

router.get('/expenses-by-category', dateRangeValidators, validate, ctrl.expensesByCategory);

router.get('/low-stock', ctrl.lowStock);

module.exports = router;
