const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

// Verify JWT from an HttpOnly cookie or an Authorization bearer token.
const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token) {
      const authorization = req.headers.authorization;
      if (authorization?.startsWith('Bearer ')) {
        token = authorization.slice(7).trim();
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please log in.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.id);

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated.'
      });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.'
    });
  }
};

// Restrict route access to specific roles (e.g., authorize('admin'))
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};

module.exports = { protect, authorize };