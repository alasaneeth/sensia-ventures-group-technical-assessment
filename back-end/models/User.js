const { query, getClient } = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  // Create new user
  static async create(userData) {
    try {
      const { username, email, password, phoneNo, address } = userData;
      
      // Validate required fields
      if (!username || !email || !password) {
        throw new Error('Missing required fields');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert user
      const result = await query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, is_active, created_at',
        [username, email, hashedPassword]
      );

      const user_id = result.rows[0].id;

      await query(
        'INSERT INTO clients (user_id, name, email, phone, address) VALUES ($1, $2, $3, $4, $5) RETURNING id, user_id, name, email, phone, address',
        [user_id, username, email, phoneNo, address]
      );

      return userData;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Error registering user');
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query(
      `SELECT u.*, array_agg(r.name) as roles, array_agg(r.id) as role_ids
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
      `SELECT u.*, array_agg(r.name) as roles, array_agg(r.id) as role_ids
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );

    if (userResult.rows.length === 0) return null;

    // Get permissions based on role_ids
    const user = userResult.rows[0];
    let permissions = [];

    if (user.role_ids && user.role_ids[0]) {
      const permissionsResult = await query(
        `SELECT feature, can_view, can_create, can_update, can_delete 
         FROM user_permissions 
         WHERE role_id = ANY($1)`,
        [user.role_ids]
      );
      permissions = permissionsResult.rows;
    }

    return {
      ...user,
      permissions: permissions
    };
  }

  // Get all users
  static async findAll() {
    const result = await query(
      `SELECT u.*, array_agg(r.name) as roles, array_agg(r.id) as role_ids
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

  // Update role permissions (now at role level instead of user level)
  static async updateRolePermissions(roleId, permissions) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Remove existing permissions for this role
      await client.query('DELETE FROM user_permissions WHERE role_id = $1', [roleId]);

      // Add new permissions
      for (const perm of permissions) {
        await client.query(
          `INSERT INTO user_permissions (role_id, feature, can_view, can_create, can_update, can_delete) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [roleId, perm.feature, perm.can_view, perm.can_create, perm.can_update, perm.can_delete]
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

  // Get permissions by role
  static async getPermissionsByRole(roleId) {
    const result = await query(
      'SELECT feature, can_view, can_create, can_update, can_delete FROM user_permissions WHERE role_id = $1',
      [roleId]
    );
    
    return result.rows;
  }

  // Check password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;