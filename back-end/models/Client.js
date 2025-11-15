const { query } = require('../config/db');

class Client {
  // Create new client
  static async create(clientData) {
    const { name, email, phone, address } = clientData;
    
    const result = await query(
      'INSERT INTO clients (name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, phone, address]
    );
    
    return result.rows[0];
  }

  // Find client by ID
  static async findById(id) {
    const result = await query('SELECT * FROM clients WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Get all clients with pagination and search
  static async findAll({ page = 1, limit = 10, search = '' }) {
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [limit, offset];

    if (search) {
      whereClause = 'WHERE name ILIKE $3 OR email ILIKE $3';
      queryParams.push(`%${search}%`);
    }

    const result = await query(
      `SELECT * FROM clients 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      queryParams
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM clients ${whereClause}`,
      search ? [`%${search}%`] : []
    );

    const total = parseInt(countResult.rows[0].count);

    return {
      clients: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Update client
  static async update(id, clientData) {
    const { name, email, phone, address } = clientData;
    
    const result = await query(
      'UPDATE clients SET name = $1, email = $2, phone = $3, address = $4 WHERE id = $5 RETURNING *',
      [name, email, phone, address, id]
    );
    
    return result.rows[0];
  }

  // Delete client
  static async delete(id) {
    const result = await query('DELETE FROM clients WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Client;