const { ApiError } = require('../utils/apiError');
const { APPROVAL_STATUS, ROLES } = require('../utils/constants');

function requireVerified(req, res, next) {
  if (!req.user) return next(new ApiError(401, 'Unauthorized'));

  if (!req.user.isEmailVerified || !req.user.isMobileVerified) {
    return next(new ApiError(403, 'Please verify email and mobile via OTP first.'));
  }

  return next();
}

function requireApprovedIfStudent(req, res, next) {
  if (!req.user) return next(new ApiError(401, 'Unauthorized'));

  if ([ROLES.VOTER, ROLES.CANDIDATE].includes(req.user.role)) {
    if (req.user.approvalStatus !== APPROVAL_STATUS.APPROVED) {
      return next(new ApiError(403, 'Your account is pending admin approval.'));
    }
  }

  return next();
}

module.exports = {
  requireVerified,
  requireApprovedIfStudent
};
