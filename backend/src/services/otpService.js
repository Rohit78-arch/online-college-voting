const crypto = require('crypto');
const { env } = require('../config/env');
const { ApiError } = require('../utils/apiError');

function generateNumericOtp(length = env.OTP_LENGTH) {
  // Generates a numeric OTP with uniform-ish distribution.
  // Note: crypto.randomInt is preferred over Math.random.
  let otp = '';
  for (let i = 0; i < length; i += 1) {
    otp += crypto.randomInt(0, 10);
  }
  return otp;
}

function getOtpExpiryDate() {
  return new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000);
}

function assertOtpCooldown(lastSentAt) {
  if (!lastSentAt) return;
  const secondsSince = (Date.now() - new Date(lastSentAt).getTime()) / 1000;
  if (secondsSince < env.OTP_COOLDOWN_SECONDS) {
    const waitSeconds = Math.ceil(env.OTP_COOLDOWN_SECONDS - secondsSince);
    throw new ApiError(429, `Please wait ${waitSeconds}s before requesting another OTP.`);
  }
}

module.exports = {
  generateNumericOtp,
  getOtpExpiryDate,
  assertOtpCooldown
};
