const { ApiError } = require('../utils/apiError');

/**
 * Ensure logged-in user has one of the allowed roles.
 * Usage: router.get('/x', requireAuth, requireRole('ADMIN'), handler)
 */
function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Unauthorized'));
    if (!allowed.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden'));
    }
    return next();
  };
}

module.exports = { requireRole };
