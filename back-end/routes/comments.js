const express = require('express');
const { body } = require('express-validator');
const CommentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

const router = express.Router();

router.get('/', authenticateToken, checkPermission('comments', 'view'), CommentController.getAllComments);
router.post('/', authenticateToken, checkPermission('comments', 'create'), [
  body('content').notEmpty().withMessage('Content is required')
], CommentController.createComment);
router.put('/:id', authenticateToken, checkPermission('comments', 'update'), [
  body('content').notEmpty().withMessage('Content is required')
], CommentController.updateComment);
router.delete('/:id', authenticateToken, checkPermission('comments', 'delete'), CommentController.deleteComment);

module.exports = router;