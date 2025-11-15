const { query, getClient } = require('../config/db');

class Order {
  // Create new order with items and payments
  static async create(orderData, userId) {
    const { client_id, items, payments, status = 'pending' } = orderData;
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Calculate total amount from items
      let totalAmount = 0;
      for (const item of items) {
        const productResult = await client.query(
          'SELECT price, stock FROM products WHERE id = $1',
          [item.product_id]
        );

        if (productResult.rows.length === 0) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }

        if (productResult.rows[0].stock < item.quantity) {
          throw new Error(`Insufficient stock for product ID ${item.product_id}`);
        }

        totalAmount += productResult.rows[0].price * item.quantity;
      }

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (client_id, created_by, total_amount, status) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [client_id, userId, totalAmount, status]
      );

      const order = orderResult.rows[0];

      // Create order items and update stock
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price) 
           VALUES ($1, $2, $3, (SELECT price FROM products WHERE id = $2))`,
          [order.id, item.product_id, item.quantity]
        );

        // Update product stock
        await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      // Create order payments
      let totalPaid = 0;
      for (const payment of payments) {
        await client.query(
          'INSERT INTO order_payments (order_id, method, amount) VALUES ($1, $2, $3)',
          [order.id, payment.method, payment.amount]
        );
        totalPaid += payment.amount;
      }

      // Verify payment total matches order total
      if (Math.abs(totalPaid - totalAmount) > 0.01) {
        throw new Error('Total payments must equal order total amount');
      }

      await client.query('COMMIT');

      // Return complete order data
      return await this.findById(order.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Find order by ID with details
  static async findById(id) {
    const orderResult = await query(
      `SELECT o.*, c.name as client_name, u.username as created_by_name
       FROM orders o 
       LEFT JOIN clients c ON o.client_id = c.id 
       LEFT JOIN users u ON o.created_by = u.id 
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) return null;

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await query(
      `SELECT oi.*, p.name as product_name 
       FROM order_items oi 
       LEFT JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = $1`,
      [id]
    );
    order.items = itemsResult.rows;

    // Get order payments
    const paymentsResult = await query(
      'SELECT * FROM order_payments WHERE order_id = $1',
      [id]
    );
    order.payments = paymentsResult.rows;

    return order;
  }

  // Get all orders with pagination and filters
  static async findAll({ page = 1, limit = 10, client_id, status }) {
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [limit, offset];
    let paramCount = 2;

    if (client_id) {
      paramCount++;
      whereClause += ` ${whereClause ? 'AND' : 'WHERE'} o.client_id = $${paramCount}`;
      queryParams.push(client_id);
    }

    if (status) {
      paramCount++;
      whereClause += ` ${whereClause ? 'AND' : 'WHERE'} o.status = $${paramCount}`;
      queryParams.push(status);
    }

    const result = await query(
      `SELECT o.*, c.name as client_name, u.username as created_by_name
       FROM orders o 
       LEFT JOIN clients c ON o.client_id = c.id 
       LEFT JOIN users u ON o.created_by = u.id 
       ${whereClause}
       ORDER BY o.created_at DESC 
       LIMIT $1 OFFSET $2`,
      queryParams
    );

    // Get order items and payments for each order
    for (let order of result.rows) {
      const itemsResult = await query(
        `SELECT oi.*, p.name as product_name 
         FROM order_items oi 
         LEFT JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = $1`,
        [order.id]
      );
      order.items = itemsResult.rows;

      const paymentsResult = await query(
        'SELECT * FROM order_payments WHERE order_id = $1',
        [order.id]
      );
      order.payments = paymentsResult.rows;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM orders o ${whereClause}`,
      queryParams.slice(2)
    );

    const total = parseInt(countResult.rows[0].count);

    return {
      orders: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Update order status
  static async updateStatus(id, status) {
    const result = await query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    return result.rows[0];
  }
}

module.exports = Order;