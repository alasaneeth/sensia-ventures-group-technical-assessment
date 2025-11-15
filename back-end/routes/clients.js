const express = require('express');
const { body } = require('express-validator');
const ClientController = require('../controllers/clientController');
const { authenticateToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');

const router = express.Router();

router.get('/', authenticateToken, checkPermission('clients', 'view'), ClientController.getAllClients);
router.get('/:id', authenticateToken, checkPermission('clients', 'view'), ClientController.getClientById);
router.post('/', authenticateToken, checkPermission('clients', 'create'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Valid email required')
], ClientController.createClient);
router.put('/:id', authenticateToken, checkPermission('clients', 'update'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Valid email required')
], ClientController.updateClient);
router.delete('/:id', authenticateToken, checkPermission('clients', 'delete'), ClientController.deleteClient);

module.exports = router;