const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/ErrorResponse');

// Middleware to protect routes - requires valid JWT
exports.protect = async (req, res, next) => {
  let token;

  // 1. Get token from different sources
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    // Get token from cookie
    token = req.cookies.jwt;
  }

  // 2. Check if token exists
  if (!token) {
    return next(
      new ErrorResponse('Not authorized to access this route. No token provided.', 401)
    );
  }

  try {
    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new ErrorResponse('The user belonging to this token no longer exists.', 401)
      );
    }

    // 5. Check if user changed password after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new ErrorResponse('User recently changed password. Please log in again.', 401)
      );
    }

    // 6. Grant access to protected route
    req.user = currentUser;
    res.locals.user = currentUser; // For views if needed
    next();
  } catch (err) {
    return next(
      new ErrorResponse('Not authorized to access this route. Invalid token.', 401)
    );
  }
};

// Middleware to restrict routes to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          'You do not have permission to perform this action',
          403
        )
      );
    }
    next();
  };
};

// Middleware for optional authentication (sets user if logged in)
exports.optionalAuth = async (req, res, next) => {
  if (req.cookies?.jwt) {
    try {
      const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);
      
      if (currentUser && !currentUser.changedPasswordAfter(decoded.iat)) {
        req.user = currentUser;
        res.locals.user = currentUser;
      }
    } catch (err) {
      // Don't throw error if token is invalid
    }
  }
  next();
};