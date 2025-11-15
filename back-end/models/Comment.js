const { query } = require('../config/db');

class Comment {
  // Create new comment
  static async create(commentData, userId) {
    const { content } = commentData;
    
    const result = await query(
      'INSERT INTO comments (user_id, content) VALUES ($1, $2) RETURNING *',
      [userId, content]
    );
    
    return this.findById(result.rows[0].id);
  }

  // Find comment by ID with user info
  static async findById(id) {
    const result = await query(
      `SELECT c.*, u.username as user_name
       FROM comments c 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.id = $1`,
      [id]
    );
    
    return result.rows[0];
  }

  // Get all comments with pagination
  static async findAll({ page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT c.*, u.username as user_name
       FROM comments c 
       LEFT JOIN users u ON c.user_id = u.id 
       ORDER BY c.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) FROM comments');
    const total = parseInt(countResult.rows[0].count);

    return {
      comments: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Update comment
  static async update(id, content, userId) {
    const result = await query(
      'UPDATE comments SET content = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [content, id, userId]
    );
    
    return result.rows[0];
  }

  // Delete comment
  static async delete(id, userId, isAdmin = false) {
    let queryText = 'DELETE FROM comments WHERE id = $1';
    let queryParams = [id];

    if (!isAdmin) {
      queryText += ' AND user_id = $2';
      queryParams.push(userId);
    }

    queryText += ' RETURNING *';

    const result = await query(queryText, queryParams);
    return result.rows[0];
  }

  // Check if comment belongs to user
  static async belongsToUser(id, userId) {
    const result = await query(
      'SELECT id FROM comments WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    return result.rows.length > 0;
  }
}

module.exports = Comment;