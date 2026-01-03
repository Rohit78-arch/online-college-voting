const mongoose = require('mongoose');

const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { validateBody } = require('../utils/validate');

const {
  registerVoterSchema,
  registerCandidateSchema,
  loginSchema,
  sendEmailOtpSchema,
  verifyEmailOtpSchema,
  sendMobileOtpSchema,
  verifyMobileOtpSchema
} = require('../validators/authValidators');

const { User, CandidateProfile, Election } = require('../models');
const { ROLES, APPROVAL_STATUS } = require('../utils/constants');
const { signAccessToken } = require('../services/tokenService');
const { generateNumericOtp, getOtpExpiryDate, assertOtpCooldown } = require('../services/otpService');
const { sendEmailOtp } = require('../services/emailService');
const { sendMobileOtp } = require('../services/smsService');

/**
 * Register Voter
 * Flow:
 * - Create user as VOTER with PENDING approval
 * - Send OTPs (email + mobile)
 */
const registerVoter = asyncHandler(async (req, res) => {
  const body = validateBody(registerVoterSchema, req.body);

  const exists = await User.findOne({
    $or: [{ email: body.email }, { mobile: body.mobile }, { enrollmentId: body.enrollmentId }]
  });
  if (exists) throw new ApiError(409, 'User already exists with same email/mobile/enrollmentId');

  const user = new User({
    fullName: body.fullName,
    email: body.email,
    mobile: body.mobile,
    role: ROLES.VOTER,
    approvalStatus: APPROVAL_STATUS.APPROVED,
    enrollmentId: body.enrollmentId,
    scholarOrRollNumber: body.scholarOrRollNumber,
    department: body.department,
    semesterOrYear: body.semesterOrYear
  });

  await user.setPassword(body.password);

  // Create and send OTPs
  const emailOtp = generateNumericOtp();
  const mobileOtp = generateNumericOtp();
  const expiresAt = getOtpExpiryDate();

  await user.setEmailOtp(emailOtp, expiresAt);
  await user.setMobileOtp(mobileOtp, expiresAt);

  await user.save();

  // Send after save (so cooldown timestamps are persisted)
  await Promise.all([sendEmailOtp({ to: user.email, otp: emailOtp }), sendMobileOtp({ to: user.mobile, otp: mobileOtp })]);

  res.status(201).json({
    success: true,
    message: 'Voter registered. Please verify Email & Mobile OTP. Await admin approval after verification.',
    data: {
      userId: user._id,
      next: ['SEND/VERIFY_EMAIL_OTP', 'SEND/VERIFY_MOBILE_OTP']
    }
  });
});

/**
 * Register Candidate
 * - Creates user with role CANDIDATE (PENDING)
 * - Creates CandidateProfile linking election+position
 * - Sends OTPs
 */
const registerCandidate = asyncHandler(async (req, res) => {
  const body = validateBody(registerCandidateSchema, req.body);

  const election = await Election.findById(body.electionId);
  if (!election) throw new ApiError(404, 'Election not found');

  const positionObjectId = new mongoose.Types.ObjectId(body.positionId);
  const positionExists = election.positions.some((p) => String(p._id) === String(positionObjectId));
  if (!positionExists) throw new ApiError(400, 'Invalid positionId for this election');

  const exists = await User.findOne({
    $or: [{ email: body.email }, { mobile: body.mobile }, { enrollmentId: body.enrollmentId }]
  });
  if (exists) throw new ApiError(409, 'User already exists with same email/mobile/enrollmentId');

  const session = await mongoose.startSession();

  let user;
  await session.withTransaction(async () => {
    user = new User({
      fullName: body.fullName,
      email: body.email,
      mobile: body.mobile,
      role: ROLES.CANDIDATE,
      approvalStatus: APPROVAL_STATUS.PENDING,
      enrollmentId: body.enrollmentId,
      scholarOrRollNumber: body.scholarOrRollNumber,
      department: body.department,
      semesterOrYear: body.semesterOrYear
    });

    await user.setPassword(body.password);

    const emailOtp = generateNumericOtp();
    const mobileOtp = generateNumericOtp();
    const expiresAt = getOtpExpiryDate();

    await user.setEmailOtp(emailOtp, expiresAt);
    await user.setMobileOtp(mobileOtp, expiresAt);

    await user.save({ session });

    await CandidateProfile.create(
      [
        {
          userId: user._id,
          electionId: election._id,
          positionId: positionObjectId,
          photoUrl: body.photoUrl,
          electionSymbolUrl: body.electionSymbolUrl,
          manifesto: body.manifesto
        }
      ],
      { session }
    );

    // Send OTPs AFTER both docs are created.
    // (Sending inside a transaction is okay for demo; in production you'd use an outbox job.)
    await Promise.all([sendEmailOtp({ to: user.email, otp: emailOtp }), sendMobileOtp({ to: user.mobile, otp: mobileOtp })]);
  });

  session.endSession();

  res.status(201).json({
    success: true,
    message: 'Candidate registered. Please verify Email & Mobile OTP. Await admin approval.',
    data: {
      userId: user._id
    }
  });
});

/**
 * Login
 * identifier can be: email OR enrollmentId OR adminId
 */
const login = asyncHandler(async (req, res) => {
  const body = validateBody(loginSchema, req.body);

  const user = await User.findOne({
    $or: [{ email: body.identifier.toLowerCase() }, { enrollmentId: body.identifier }, { adminId: body.identifier }]
  }).select('+passwordHash');

  if (!user) throw new ApiError(401, 'Invalid credentials');
  if (!user.isActive) throw new ApiError(403, 'Account disabled');

  const ok = await user.comparePassword(body.password);
  if (!ok) throw new ApiError(401, 'Invalid credentials');

  // Verification gate
 if (
  user.role === ROLES.CANDIDATE &&
  (!user.isEmailVerified || !user.isMobileVerified)
) {
  throw new ApiError(403, 'Please verify Email & Mobile OTP before logging in.');
}


  // Approval gate for students
  
  if (user.role === ROLES.CANDIDATE && user.approvalStatus !== APPROVAL_STATUS.APPROVED) {
  throw new ApiError(403, 'Candidate approval pending.');
}


  user.lastLoginAt = new Date();
  await user.save();

  const token = signAccessToken(user);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        adminType: user.adminType,
        email: user.email,
        mobile: user.mobile,
        enrollmentId: user.enrollmentId,
        approvalStatus: user.approvalStatus
      }
    }
  });
});

/**
 * Send Email OTP (resend)
 */
const sendEmailOtpAgain = asyncHandler(async (req, res) => {
  const body = validateBody(sendEmailOtpSchema, req.body);

  const user = await User.findOne({ email: body.email });
  if (!user) throw new ApiError(404, 'User not found');

  assertOtpCooldown(user.emailOtp?.lastSentAt);

  const otp = generateNumericOtp();
  const expiresAt = getOtpExpiryDate();
  await user.setEmailOtp(otp, expiresAt);
  await user.save();

  await sendEmailOtp({ to: user.email, otp });

  res.json({ success: true, message: 'Email OTP sent' });
});

/**
 * Verify Email OTP
 */
const verifyEmailOtp = asyncHandler(async (req, res) => {
  const body = validateBody(verifyEmailOtpSchema, req.body);

  const user = await User.findOne({ email: body.email });
  if (!user) throw new ApiError(404, 'User not found');

  const ok = await user.verifyEmailOtp(body.otp);
  await user.save();

  if (!ok) throw new ApiError(400, 'Invalid or expired OTP');

  res.json({ success: true, message: 'Email verified successfully' });
});

/**
 * Send Mobile OTP (resend)
 */
const sendMobileOtpAgain = asyncHandler(async (req, res) => {
  const body = validateBody(sendMobileOtpSchema, req.body);

  const user = await User.findOne({ mobile: body.mobile });
  if (!user) throw new ApiError(404, 'User not found');

  assertOtpCooldown(user.mobileOtp?.lastSentAt);

  const otp = generateNumericOtp();
  const expiresAt = getOtpExpiryDate();
  await user.setMobileOtp(otp, expiresAt);
  await user.save();

  await sendMobileOtp({ to: user.mobile, otp });

  res.json({ success: true, message: 'Mobile OTP sent' });
});

/**
 * Verify Mobile OTP
 */
const verifyMobileOtp = asyncHandler(async (req, res) => {
  const body = validateBody(verifyMobileOtpSchema, req.body);

  const user = await User.findOne({ mobile: body.mobile });
  if (!user) throw new ApiError(404, 'User not found');

  const ok = await user.verifyMobileOtp(body.otp);
  await user.save();

  if (!ok) throw new ApiError(400, 'Invalid or expired OTP');

  res.json({ success: true, message: 'Mobile verified successfully' });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      fullName: req.user.fullName,
      role: req.user.role,
      adminType: req.user.adminType,
      email: req.user.email,
      mobile: req.user.mobile,
      enrollmentId: req.user.enrollmentId,
      approvalStatus: req.user.approvalStatus,
      isEmailVerified: req.user.isEmailVerified,
      isMobileVerified: req.user.isMobileVerified
    }
  });
});

module.exports = {
  registerVoter,
  registerCandidate,
  login,
  sendEmailOtpAgain,
  verifyEmailOtp,
  sendMobileOtpAgain,
  verifyMobileOtp,
  me
};
