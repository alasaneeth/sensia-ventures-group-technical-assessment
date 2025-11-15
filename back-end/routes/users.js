const express = require('express');
const { body } = require('express-validator');
const UserController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

const router = express.Router();

router.get('/', authenticateToken, checkPermission('users', 'view'), UserController.getAllUsers);
router.get('/:id', authenticateToken, checkPermission('users', 'view'), UserController.getUserById);
router.put('/:id/roles', authenticateToken, checkPermission('users', 'update'), [
  body('roles').isArray().withMessage('Roles must be an array')
], UserController.updateUserRoles);
router.put('/:id/permissions', authenticateToken, checkPermission('users', 'update'), [
  body('permissions').isArray().withMessage('Permissions must be an array')
], UserController.updateUserPermissions);
router.patch('/:id/status', authenticateToken, checkPermission('users', 'update'), [
  body('is_active').isBoolean().withMessage('is_active must be a boolean')
], UserController.updateUserStatus);

module.exports = router;