const { query } = require('../config/db');

class Product {
  // Create new product
  static async create(productData) {
    const { name, description, price, stock } = productData;
    
    const result = await query(
      'INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, price, stock]
    );
    
    return result.rows[0];
  }

  // Find product by ID
  static async findById(id) {
    const result = await query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Get all products with pagination and search
  static async findAll({ page = 1, limit = 10, search = '' }) {
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [limit, offset];

    if (search) {
      whereClause = 'WHERE name ILIKE $3 OR description ILIKE $3';
      queryParams.push(`%${search}%`);
    }

    const result = await query(
      `SELECT * FROM products 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      queryParams
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM products ${whereClause}`,
      search ? [`%${search}%`] : []
    );

    const total = parseInt(countResult.rows[0].count);

    return {
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Update product
  static async update(id, productData) {
    const { name, description, price, stock } = productData;
    
    const result = await query(
      'UPDATE products SET name = $1, description = $2, price = $3, stock = $4 WHERE id = $5 RETURNING *',
      [name, description, price, stock, id]
    );
    
    return result.rows[0];
  }

  // Delete product
  static async delete(id) {
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // Update product stock
  static async updateStock(id, quantity) {
    const result = await query(
      'UPDATE products SET stock = stock - $1 WHERE id = $2 RETURNING *',
      [quantity, id]
    );
    
    return result.rows[0];
  }
}

module.exports = Product;