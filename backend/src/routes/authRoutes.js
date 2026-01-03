const express = require('express');

const {
  registerVoter,
  registerCandidate,
  login,
  sendEmailOtpAgain,
  verifyEmailOtp,
  sendMobileOtpAgain,
  verifyMobileOtp,
  me
} = require('../controllers/authController');

const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

const { forgotPassword, resetPassword } = require('../controllers/passwordController');

router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Registration
router.post('/register/voter', registerVoter);
router.post('/register/candidate', registerCandidate);

// Auth
router.post('/login', login);
router.get('/me', requireAuth, me);

// OTP - resend + verify
router.post('/otp/email/send', sendEmailOtpAgain);
router.post('/otp/email/verify', verifyEmailOtp);
router.post('/otp/mobile/send', sendMobileOtpAgain);
router.post('/otp/mobile/verify', verifyMobileOtp);

module.exports = { router };
