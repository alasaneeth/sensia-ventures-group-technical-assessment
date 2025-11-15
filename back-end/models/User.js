const { query, getClient } = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  // Create new user
  static async create(userData) {
    const { username, email, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, is_active, created_at',
      [username, email, hashedPassword]
    );
    
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query(
      `SELECT u.*, array_agg(r.name) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.email = $1
       GROUP BY u.id`,
      [email]
    );
    
    return result.rows[0];
  }

  // Find user by ID with roles and permissions
  static async findById(id) {
    const userResult = await query(
      `SELECT u.*, array_agg(r.name) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );

    if (userResult.rows.length === 0) return null;

    const permissionsResult = await query(
      'SELECT feature, can_view, can_create, can_update, can_delete FROM user_permissions WHERE user_id = $1',
      [id]
    );

    return {
      ...userResult.rows[0],
      permissions: permissionsResult.rows
    };
  }

  // Get all users
  static async findAll() {
    const result = await query(
      `SELECT u.*, array_agg(r.name) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    
    return result.rows;
  }

  // Update user status
  static async updateStatus(id, isActive) {
    const result = await query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, username, email, is_active',
      [isActive, id]
    );
    
    return result.rows[0];
  }

  // Update user roles
  static async updateRoles(userId, roles) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Remove existing roles
      await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);

      // Add new roles
      for (const roleName of roles) {
        const roleResult = await client.query(
          'SELECT id FROM roles WHERE name = $1',
          [roleName]
        );
        if (roleResult.rows.length > 0) {
          await client.query(
            'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
            [userId, roleResult.rows[0].id]
          );
        }
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Update user permissions
  static async updatePermissions(userId, permissions) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Remove existing permissions
      await client.query('DELETE FROM user_permissions WHERE user_id = $1', [userId]);

      // Add new permissions
      for (const perm of permissions) {
        await client.query(
          `INSERT INTO user_permissions (user_id, feature, can_view, can_create, can_update, can_delete) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, perm.feature, perm.can_view, perm.can_create, perm.can_update, perm.can_delete]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Check password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;