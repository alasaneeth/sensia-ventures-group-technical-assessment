const { pool } = require("../config/db");

const checkPermission = (feature, action) => {
  return async (req, res, next) => {
    try {
      // Check if user has admin role
      if (req.user.roles && req.user.roles.includes('admin')) {
        return next();
      }

      // Get user's role IDs from the request
      // Assuming req.user.roleIds contains an array of role IDs for the user
      const roleIds = req.user.roleIds || [];
      
      if (roleIds.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'No roles assigned to user' 
        });
      }

      // Query database for permissions based on role IDs and feature
      const query = `
        SELECT can_view, can_create, can_update, can_delete 
        FROM user_permissions 
        WHERE role_id = ANY($1) AND feature = $2
      `;
      
      const result = await pool.query(query, [roleIds, feature]);
      
      if (result.rows.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: `No permissions for ${feature}` 
        });
      }

      // Check if any of the user's roles has the required permission
      let hasPermission = false;
      
      for (const permission of result.rows) {
        switch (action) {
          case 'view':
            if (permission.can_view) hasPermission = true;
            break;
          case 'create':
            if (permission.can_create) hasPermission = true;
            break;
          case 'update':
            if (permission.can_update) hasPermission = true;
            break;
          case 'delete':
            if (permission.can_delete) hasPermission = true;
            break;
          default:
            hasPermission = false;
        }
        
        // If we found a role with permission, no need to check others
        if (hasPermission) break;
      }

      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: `Insufficient permissions to ${action} ${feature}` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking permissions' 
      });
    }
  };
};

module.exports = { checkPermission };