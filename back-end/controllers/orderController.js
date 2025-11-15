const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const { successResponse, errorResponse, validationError } = require('../utils/response');

class OrderController {
  // Get all orders
  static async getAllOrders(req, res) {
    try {
      const { page, limit, client_id, status } = req.query;
      const result = await Order.findAll({ page, limit, client_id, status });

      successResponse(res, 'Orders retrieved successfully', result);
    } catch (error) {
      console.error('Get orders error:', error);
      errorResponse(res, 'Error fetching orders');
    }
  }

  // Get order by ID
  static async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);

      if (!order) {
        return errorResponse(res, 'Order not found', 404);
      }

      successResponse(res, 'Order retrieved successfully', { order });
    } catch (error) {
      console.error('Get order error:', error);
      errorResponse(res, 'Error fetching order');
    }
  }

  // Create order
  static async createOrder(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const order = await Order.create(req.body, req.user.id);

      successResponse(res, 'Order created successfully', { order }, 201);
    } catch (error) {
      console.error('Create order error:', error);
      errorResponse(res, error.message || 'Error creating order');
    }
  }

  // Update order status
  static async updateOrderStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const { id } = req.params;
      const { status } = req.body;

      const order = await Order.updateStatus(id, status);

      if (!order) {
        return errorResponse(res, 'Order not found', 404);
      }

      successResponse(res, 'Order status updated successfully', { order });
    } catch (error) {
      console.error('Update order status error:', error);
      errorResponse(res, 'Error updating order status');
    }
  }
}

module.exports = OrderController;