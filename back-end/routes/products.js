const express = require('express');
const { body } = require('express-validator');
const ProductController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

const router = express.Router();

router.get('/', authenticateToken, checkPermission('products', 'view'), ProductController.getAllProducts);
router.get('/:id', authenticateToken, checkPermission('products', 'view'), ProductController.getProductById);
router.post('/', authenticateToken, checkPermission('products', 'create'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], ProductController.createProduct);
router.put('/:id', authenticateToken, checkPermission('products', 'update'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], ProductController.updateProduct);
router.delete('/:id', authenticateToken, checkPermission('products', 'delete'), ProductController.deleteProduct);

module.exports = router;