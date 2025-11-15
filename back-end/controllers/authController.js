const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { successResponse, errorResponse, validationError } = require('../utils/response');

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return errorResponse(res, 'User already exists with this email or username', 400);
      }

      // Create user
      const user = await User.create({ username, email, password });

      successResponse(res, 'User registered successfully', { user }, 201);
    } catch (error) {
      console.error('Registration error:', error);
      errorResponse(res, 'Error registering user');
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return validationError(res, errors.array());
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findByEmail(email);
      if (!user || !user.is_active) {
        return errorResponse(res, 'Invalid credentials', 401);
      }

      // Check password
      const isPasswordValid = await User.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return errorResponse(res, 'Invalid credentials', 401);
      }

      // Get user permissions
      const userWithPermissions = await User.findById(user.id);

      // Generate token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      successResponse(res, 'Login successful', {
        token,
        user: userWithPermissions
      });
    } catch (error) {
      console.error('Login error:', error);
      errorResponse(res, 'Error during login');
    }
  }

  // Get current user
  static async getCurrentUser(req, res) {
    try {
      successResponse(res, 'User data retrieved successfully', { user: req.user });
    } catch (error) {
      console.error('Get user error:', error);
      errorResponse(res, 'Error fetching user data');
    }
  }
}

module.exports = AuthController;