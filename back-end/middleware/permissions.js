const checkPermission = (feature, action) => {
  return async (req, res, next) => {
    try {
      // Check if user has admin role
      if (req.user.roles && req.user.roles.includes('admin')) {
        return next();
      }

      // Check user permissions for the feature
      const userPermission = req.user.permissions.find(p => p.feature === feature);
      
      if (!userPermission) {
        return res.status(403).json({ 
          success: false, 
          message: `No permissions for ${feature}` 
        });
      }

      let hasPermission = false;
      switch (action) {
        case 'view':
          hasPermission = userPermission.can_view;
          break;
        case 'create':
          hasPermission = userPermission.can_create;
          break;
        case 'update':
          hasPermission = userPermission.can_update;
          break;
        case 'delete':
          hasPermission = userPermission.can_delete;
          break;
        default:
          hasPermission = false;
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