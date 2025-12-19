const { ApiError } = require('../utils/apiError');
const { asyncHandler } = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../services/tokenService');
const { User } = require('../models/User');

/**
 * Reads Bearer token, verifies it, and loads user.
 * Attaches req.user for downstream middlewares/controllers.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Unauthorized');
  }

  const payload = verifyAccessToken(token);

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Unauthorized');
  }

  req.user = user;
  req.auth = payload;
  next();
});

module.exports = {
  requireAuth
};
