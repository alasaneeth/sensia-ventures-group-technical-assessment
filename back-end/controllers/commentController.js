const { validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const { successResponse, errorResponse, validationError } = require('../utils/response');

class CommentController {
  // Get all comments
  static async getAllComments(req, res) {
    try {
      const { page, limit } = req.query;
      const result = await Comment.findAll({ page, limit });

      successResponse(res, 'Comments retrieved successfully', result);
    } catch (error) {
      console.error('Get comments error:', error);
      errorResponse(res, 'Error fetching comments');
    }
  }

  // Create comment
  static async createComment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const comment = await Comment.create(req.body, req.user.id);

      successResponse(res, 'Comment created successfully', { comment }, 201);
    } catch (error) {
      console.error('Create comment error:', error);
      errorResponse(res, 'Error creating comment');
    }
  }

  // Update comment
  static async updateComment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const { id } = req.params;
      const { content } = req.body;

      // Check if comment belongs to user
      const belongsToUser = await Comment.belongsToUser(id, req.user.id);
      if (!belongsToUser) {
        return errorResponse(res, 'Comment not found or access denied', 404);
      }

      const comment = await Comment.update(id, content, req.user.id);

      if (!comment) {
        return errorResponse(res, 'Comment not found', 404);
      }

      successResponse(res, 'Comment updated successfully', { comment });
    } catch (error) {
      console.error('Update comment error:', error);
      errorResponse(res, 'Error updating comment');
    }
  }

  // Delete comment
  static async deleteComment(req, res) {
    try {
      const { id } = req.params;
      const isAdmin = req.user.roles && req.user.roles.includes('admin');

      const comment = await Comment.delete(id, req.user.id, isAdmin);

      if (!comment) {
        return errorResponse(res, 'Comment not found or access denied', 404);
      }

      successResponse(res, 'Comment deleted successfully');
    } catch (error) {
      console.error('Delete comment error:', error);
      errorResponse(res, 'Error deleting comment');
    }
  }
}

module.exports = CommentController;