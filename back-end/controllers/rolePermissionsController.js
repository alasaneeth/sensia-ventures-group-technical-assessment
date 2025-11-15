const { validationResult } = require('express-validator');
const User = require('../models/User');
const { successResponse, errorResponse, validationError } = require('../utils/response');

class RolePermissionsController {
  // Update role permissions
  static async updateRolePermissions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const { roleId } = req.params;
      const { permissions } = req.body;

      await User.updateRolePermissions(roleId, permissions);

      successResponse(res, 'Role permissions updated successfully');
    } catch (error) {
      console.error('Update role permissions error:', error);
      errorResponse(res, 'Error updating role permissions');
    }
  }

  // Get role permissions
  static async getRolePermissions(req, res) {
    try {
      const { roleId } = req.params;

      const permissions = await User.getPermissionsByRole(roleId);

      successResponse(res, 'Role permissions retrieved successfully', { permissions });
    } catch (error) {
      console.error('Get role permissions error:', error);
      errorResponse(res, 'Error fetching role permissions');
    }
  }
}

module.exports = RolePermissionsController;