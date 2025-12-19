const { ApiError } = require('../utils/apiError');
const { ADMIN_TYPES } = require('../utils/constants');

function requireAdminType(...allowedAdminTypes) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Unauthorized'));
    if (req.user.role !== 'ADMIN') return next(new ApiError(403, 'Forbidden'));

    // SUPER_ADMIN can do everything.
    if (req.user.adminType === ADMIN_TYPES.SUPER_ADMIN) return next();

    if (!allowedAdminTypes.includes(req.user.adminType)) {
      return next(new ApiError(403, 'Forbidden'));
    }

    return next();
  };
}

module.exports = { requireAdminType };
