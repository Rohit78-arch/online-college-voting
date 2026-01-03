const crypto = require('crypto');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { User } = require('../models/User');
const { sendEmailOtp } = require('../services/emailService');

// FORGOT PASSWORD
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'User not found');

  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 15 * 60 * 1000; // 15 min

  user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  user.resetPasswordExpires = expires;
  await user.save();

  const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;

  await sendEmailOtp({
    to: user.email,
    otp: `Reset your password using this link:\n${resetLink}\n(Link valid for 15 minutes)`
  });

  res.json({ success: true, message: 'Password reset link sent to email' });
});

// RESET PASSWORD
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashed = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() }
  }).select('+passwordHash');

  if (!user) throw new ApiError(400, 'Invalid or expired token');

  await user.setPassword(password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successful' });
});

module.exports = { forgotPassword, resetPassword };
