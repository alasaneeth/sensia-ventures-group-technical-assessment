const express = require('express');
const { body } = require('express-validator');
const RolePermissionsController = require('../controllers/rolePermissionsController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.put('/:roleId/permissions', [
  authenticateToken,
  body('permissions').isArray().withMessage('Permissions must be an array'),
  body('permissions.*.feature').notEmpty().withMessage('Feature is required'),
  body('permissions.*.can_view').isBoolean().withMessage('can_view must be boolean'),
  body('permissions.*.can_create').isBoolean().withMessage('can_create must be boolean'),
  body('permissions.*.can_update').isBoolean().withMessage('can_update must be boolean'),
  body('permissions.*.can_delete').isBoolean().withMessage('can_delete must be boolean')
], RolePermissionsController.updateRolePermissions);

router.get('/:roleId/permissions', [
  authenticateToken
], RolePermissionsController.getRolePermissions);

module.exports = router;