const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const { successResponse, errorResponse, validationError } = require('../utils/response');

class OrderController {
  // Get all orders (with client filtering for non-admin users)
  static async getAllOrders(req, res) {
    try {
      const { page, limit, client_id, status } = req.query;
      
      // If user is not admin, they can only see their own orders
      let clientFilter = client_id;
      if (req.user.role !== 'admin' && req.user.client_id) {
        clientFilter = req.user.client_id;
      }

      const result = await Order.findAll({ 
        page, 
        limit, 
        client_id: clientFilter, 
        status,
        userRole: req.user.role,
        userId: req.user.id
      });

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

      // Check if user has permission to view this order
      if (req.user.role !== 'admin' && order.client_id !== req.user.client_id) {
        return errorResponse(res, 'Access denied', 403);
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

      // If user is client, they can only create orders for themselves
      if (req.user.role === 'client' && req.body.client_id !== req.user.client_id) {
        return errorResponse(res, 'You can only create orders for yourself', 403);
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

      // First get the order to check permissions
      const existingOrder = await Order.findById(id);
      if (!existingOrder) {
        return errorResponse(res, 'Order not found', 404);
      }

      // Check if user has permission to update this order
      if (req.user.role !== 'admin' && existingOrder.client_id !== req.user.client_id) {
        return errorResponse(res, 'Access denied', 403);
      }

      const order = await Order.updateStatus(id, status);

      successResponse(res, 'Order status updated successfully', { order });
    } catch (error) {
      console.error('Update order status error:', error);
      errorResponse(res, 'Error updating order status');
    }
  }

  // Delete order
  static async deleteOrder(req, res) {
    try {
      const { id } = req.params;

      // First get the order to check permissions
      const existingOrder = await Order.findById(id);
      if (!existingOrder) {
        return errorResponse(res, 'Order not found', 404);
      }

      // Check if user has permission to delete this order
      if (req.user.role !== 'admin' && existingOrder.client_id !== req.user.client_id) {
        return errorResponse(res, 'Access denied', 403);
      }

      await Order.delete(id);
      successResponse(res, 'Order deleted successfully');
    } catch (error) {
      console.error('Delete order error:', error);
      errorResponse(res, 'Error deleting order');
    }
  }
}

module.exports = OrderController;