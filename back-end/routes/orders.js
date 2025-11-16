const express = require('express');
const { body } = require('express-validator');
const OrderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

const router = express.Router();

router.get('/', authenticateToken, OrderController.getAllOrders);
router.get('/:id', authenticateToken, OrderController.getOrderById);
router.post('/', authenticateToken, [
  body('client_id').isInt({ min: 1 }).withMessage('Valid client ID required'),
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('payments').isArray().withMessage('Payments must be an array')
], OrderController.createOrder);
router.patch('/:id/status', authenticateToken, [
  body('status').isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
], OrderController.updateOrderStatus);
router.delete('/:id', authenticateToken, OrderController.deleteOrder);

module.exports = router;