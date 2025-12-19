const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

/**
 * Keep JWT payload minimal.
 * We include role/adminType for fast authorization checks.
 */
function signAccessToken(user) {
  const payload = {
    sub: String(user._id),
    role: user.role,
    adminType: user.adminType
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = {
  signAccessToken,
  verifyAccessToken
};
