'use strict';

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, requireMinRole } = require('../middleware/auth');
const ctrl = require('../controllers/locations.controller');

router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', requireMinRole('admin'), [
  body('branch_id').isUUID().withMessage('Valid branch_id required'),
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }),
  body('type').isIn(['warehouse', 'store']).withMessage('Type must be warehouse or store'),
], validate, ctrl.create);
router.get('/:id', [param('id').isUUID()], validate, ctrl.getOne);
router.patch('/:id', requireMinRole('admin'), [
  param('id').isUUID(),
  body('name').optional().trim().notEmpty().isLength({ max: 255 }),
  body('type').optional().isIn(['warehouse', 'store']),
], validate, ctrl.update);
router.delete('/:id', requireMinRole('owner'), [param('id').isUUID()], validate, ctrl.remove);

module.exports = router;
