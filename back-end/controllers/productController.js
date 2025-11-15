const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const { successResponse, errorResponse, validationError } = require('../utils/response');

class ProductController {
  // Get all products
  static async getAllProducts(req, res) {
    try {
      const { page, limit, search } = req.query;
      const result = await Product.findAll({ page, limit, search });

      successResponse(res, 'Products retrieved successfully', result);
    } catch (error) {
      console.error('Get products error:', error);
      errorResponse(res, 'Error fetching products');
    }
  }

  // Get product by ID
  static async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);

      if (!product) {
        return errorResponse(res, 'Product not found', 404);
      }

      successResponse(res, 'Product retrieved successfully', { product });
    } catch (error) {
      console.error('Get product error:', error);
      errorResponse(res, 'Error fetching product');
    }
  }

  // Create product
  static async createProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const product = await Product.create(req.body);

      successResponse(res, 'Product created successfully', { product }, 201);
    } catch (error) {
      console.error('Create product error:', error);
      errorResponse(res, 'Error creating product');
    }
  }

  // Update product
  static async updateProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const { id } = req.params;
      const product = await Product.update(id, req.body);

      if (!product) {
        return errorResponse(res, 'Product not found', 404);
      }

      successResponse(res, 'Product updated successfully', { product });
    } catch (error) {
      console.error('Update product error:', error);
      errorResponse(res, 'Error updating product');
    }
  }

  // Delete product
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.delete(id);

      if (!product) {
        return errorResponse(res, 'Product not found', 404);
      }

      successResponse(res, 'Product deleted successfully');
    } catch (error) {
      console.error('Delete product error:', error);
      errorResponse(res, 'Error deleting product');
    }
  }
}

module.exports = ProductController;