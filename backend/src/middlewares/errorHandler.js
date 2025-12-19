const { ApiError } = require('../utils/apiError');

function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error('[ERROR]', err);

  // Handle Mongoose validation errors
  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: err.errors
    });
  }

  // Handle duplicate key errors
  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate key error',
      details: err.keyValue
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details
    });
  }

  // Generic fallback
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
}

module.exports = { errorHandler };
