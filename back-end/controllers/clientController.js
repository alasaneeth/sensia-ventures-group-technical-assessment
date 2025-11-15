const { validationResult } = require('express-validator');
const Client = require('../models/Client');
const { successResponse, errorResponse, validationError } = require('../utils/response');

class ClientController {
  // Get all clients
  static async getAllClients(req, res) {
    try {
      const { page, limit, search } = req.query;
      const result = await Client.findAll({ page, limit, search });

      successResponse(res, 'Clients retrieved successfully', result);
    } catch (error) {
      console.error('Get clients error:', error);
      errorResponse(res, 'Error fetching clients');
    }
  }

  // Get client by ID
  static async getClientById(req, res) {
    try {
      const { id } = req.params;
      const client = await Client.findById(id);

      if (!client) {
        return errorResponse(res, 'Client not found', 404);
      }

      successResponse(res, 'Client retrieved successfully', { client });
    } catch (error) {
      console.error('Get client error:', error);
      errorResponse(res, 'Error fetching client');
    }
  }

  // Create client
  static async createClient(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const client = await Client.create(req.body);

      successResponse(res, 'Client created successfully', { client }, 201);
    } catch (error) {
      console.error('Create client error:', error);
      errorResponse(res, 'Error creating client');
    }
  }

  // Update client
  static async updateClient(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const { id } = req.params;
      const client = await Client.update(id, req.body);

      if (!client) {
        return errorResponse(res, 'Client not found', 404);
      }

      successResponse(res, 'Client updated successfully', { client });
    } catch (error) {
      console.error('Update client error:', error);
      errorResponse(res, 'Error updating client');
    }
  }

  // Delete client
  static async deleteClient(req, res) {
    try {
      const { id } = req.params;
      const client = await Client.delete(id);

      if (!client) {
        return errorResponse(res, 'Client not found', 404);
      }

      successResponse(res, 'Client deleted successfully');
    } catch (error) {
      console.error('Delete client error:', error);
      errorResponse(res, 'Error deleting client');
    }
  }
}

module.exports = ClientController;