const ErrorResponse = require('../utils/ErrorResponse');

/**
 * Middleware to restrict access to admin users only
 * Must be used after authMiddleware.protect
 */
const adminMiddleware = (req, res, next) => {
  // Check if user exists and has admin role
  if (!req.user || req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        'Administrator privileges required to access this route',
        403
      )
    );
  }
  next();
};

/**
 * Middleware to restrict access to specific roles
 * @param {...String} roles - Allowed roles
 * @example restrictTo('admin', 'manager')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `You need one of these roles: ${roles.join(', ')} to access this route`,
          403
        )
      );
    }
    next();
  };
};

/**
 * Middleware to check ownership or admin status
 * @param {String} modelName - Name of model to check ownership
 * @param {String} idParam - Route parameter name containing the ID
 */
const ownerOrAdmin = (modelName, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      // Admins can always access
      if (req.user.role === 'admin') return next();

      // Get the resource
      const Model = require(`../models/${modelName}`);
      const resource = await Model.findById(req.params[idParam]);

      if (!resource) {
        return next(new ErrorResponse('Resource not found', 404));
      }

      // Check ownership (assuming resources have a 'user' field)
      if (resource.user && resource.user.toString() !== req.user.id) {
        return next(
          new ErrorResponse('Not authorized to access this resource', 403)
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

// ✅ Export all
module.exports = {
  adminMiddleware,
  restrictTo,
  ownerOrAdmin
};
