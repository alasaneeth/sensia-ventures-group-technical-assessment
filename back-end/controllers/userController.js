const { validationResult } = require('express-validator');
const User = require('../models/User');
const { successResponse, errorResponse, validationError } = require('../utils/response');

class UserController {
  // Get all users
  static async getAllUsers(req, res) {
    try {
      const users = await User.findAll();
      successResponse(res, 'Users retrieved successfully', { users });
    } catch (error) {
      console.error('Get users error:', error);
      errorResponse(res, 'Error fetching users');
    }
  }

  // Get user by ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      successResponse(res, 'User retrieved successfully', { user });
    } catch (error) {
      console.error('Get user error:', error);
      errorResponse(res, 'Error fetching user');
    }
  }

  // Update user roles
  static async updateUserRoles(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const { id } = req.params;
      const { roles } = req.body;

      await User.updateRoles(id, roles);

      successResponse(res, 'User roles updated successfully');
    } catch (error) {
      console.error('Update user roles error:', error);
      errorResponse(res, 'Error updating user roles');
    }
  }

  // Update user permissions
  static async updateUserPermissions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const { id } = req.params;
      const { permissions } = req.body;

      await User.updatePermissions(id, permissions);

      successResponse(res, 'User permissions updated successfully');
    } catch (error) {
      console.error('Update permissions error:', error);
      errorResponse(res, 'Error updating permissions');
    }
  }

  // Update user status
  static async updateUserStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const { id } = req.params;
      const { is_active } = req.body;

      const user = await User.updateStatus(id, is_active);

      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }

      successResponse(res, `User ${is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Update user status error:', error);
      errorResponse(res, 'Error updating user status');
    }
  }
}

module.exports = UserController;