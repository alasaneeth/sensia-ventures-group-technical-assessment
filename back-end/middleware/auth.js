const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database with roles
    const userResult = await query(`
      SELECT u.*, array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND u.is_active = true
      GROUP BY u.id
    `, [decoded.userId]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }

    // Get user permissions
    const permissionsResult = await query(`
      SELECT feature, can_view, can_create, can_update, can_delete
      FROM user_permissions 
      WHERE user_id = $1
    `, [decoded.userId]);

    req.user = {
      ...userResult.rows[0],
      permissions: permissionsResult.rows
    };

    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

module.exports = { authenticateToken };