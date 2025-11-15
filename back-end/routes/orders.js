const express = require('express');
const { body } = require('express-validator');
const OrderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

const router = express.Router();

router.get('/', authenticateToken, checkPermission('orders', 'view'), OrderController.getAllOrders);
router.get('/:id', authenticateToken, checkPermission('orders', 'view'), OrderController.getOrderById);
router.post('/', authenticateToken, checkPermission('orders', 'create'), [
  body('client_id').isInt({ min: 1 }).withMessage('Valid client ID required'),
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('payments').isArray().withMessage('Payments must be an array')
], OrderController.createOrder);
router.patch('/:id/status', authenticateToken, checkPermission('orders', 'update'), [
  body('status').isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
], OrderController.updateOrderStatus);

module.exports = router;