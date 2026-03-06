'use strict';

/**
 * Global error handler middleware. Must be registered LAST in Express.
 */
const errorHandler = (err, req, res, next) => {
  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      data: null,
      error: 'DUPLICATE_ENTRY',
      message: 'A record with this value already exists',
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(409).json({
      success: false,
      data: null,
      error: 'REFERENCE_ERROR',
      message: 'Referenced record does not exist or cannot be deleted because it is in use',
    });
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'VALIDATION_ERROR',
      message: 'Value violates a database constraint',
    });
  }

  // Custom application error
  if (err.isAppError) {
    return res.status(err.statusCode || 500).json({
      success: false,
      data: null,
      error: err.errorCode || 'APP_ERROR',
      message: err.message,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      data: null,
      error: 'INVALID_TOKEN',
      message: 'Token is invalid or expired',
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    data: null,
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'An internal server error occurred' : err.message,
  });
};

class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'APP_ERROR') {
    super(message);
    this.isAppError = true;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

module.exports = { errorHandler, AppError };
