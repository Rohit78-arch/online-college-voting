const { ApiError } = require('../utils/apiError');
const { ADMIN_TYPES } = require('../utils/constants');

function requireSuperAdmin(req, res, next) {
  if (!req.user) return next(new ApiError(401, 'Unauthorized'));
  if (req.user.role !== 'ADMIN') return next(new ApiError(403, 'Forbidden'));
  if (req.user.adminType !== ADMIN_TYPES.SUPER_ADMIN) return next(new ApiError(403, 'Forbidden'));
  return next();
}

module.exports = { requireSuperAdmin };
