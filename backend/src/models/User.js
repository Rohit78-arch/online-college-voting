const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { ROLES, ADMIN_TYPES, APPROVAL_STATUS } = require('../utils/constants');

/**
 * OTP subdocument.
 * We store OTP as a HASH (not plaintext) for security.
 */
const otpSchema = new mongoose.Schema(
  {
    codeHash: { type: String },
    expiresAt: { type: Date },
    lastSentAt: { type: Date },
    verifiedAt: { type: Date },
    attempts: { type: Number, default: 0 }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // Common
    fullName: { type: String, required: true, trim: true },

    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    mobile: { type: String, required: true, trim: true, unique: true },

    // Credential
    passwordHash: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      index: true
    },

    // Approval workflow (Voter/Candidate must be approved)
    approvalStatus: {
      type: String,
      enum: Object.values(APPROVAL_STATUS),
      default: APPROVAL_STATUS.PENDING,
      index: true
    },
    approvalNote: { type: String },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin userId

    // Student fields (for VOTER & CANDIDATE)
    enrollmentId: {
      type: String,
      trim: true,
      // unique *only* when present. Admins don't have enrollmentId.
      unique: true,
      sparse: true,
      index: true
    },
    scholarOrRollNumber: { type: String, trim: true },
    department: { type: String, trim: true },
    semesterOrYear: { type: String, trim: true },

    // Admin fields
    adminId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true
    },
    adminType: {
      type: String,
      enum: Object.values(ADMIN_TYPES),
      default: undefined
    },

    // OTP verification state
    emailOtp: { type: otpSchema, default: () => ({}) },
    mobileOtp: { type: otpSchema, default: () => ({}) },

    isEmailVerified: { type: Boolean, default: false, index: true },
    isMobileVerified: { type: Boolean, default: false, index: true },

    isActive: { type: Boolean, default: true, index: true },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

/**
 * Password helpers
 */
userSchema.methods.setPassword = async function setPassword(plainPassword) {
  const saltRounds = 10;
  this.passwordHash = await bcrypt.hash(plainPassword, saltRounds);
};

userSchema.methods.comparePassword = async function comparePassword(plainPassword) {
  // passwordHash might be excluded unless explicitly selected
  return bcrypt.compare(plainPassword, this.passwordHash);
};

/**
 * OTP helpers
 */
userSchema.methods.setEmailOtp = async function setEmailOtp(otpCode, expiresAt) {
  this.emailOtp.codeHash = await bcrypt.hash(String(otpCode), 10);
  this.emailOtp.expiresAt = expiresAt;
  this.emailOtp.lastSentAt = new Date();
  this.emailOtp.attempts = 0;
};

userSchema.methods.setMobileOtp = async function setMobileOtp(otpCode, expiresAt) {
  this.mobileOtp.codeHash = await bcrypt.hash(String(otpCode), 10);
  this.mobileOtp.expiresAt = expiresAt;
  this.mobileOtp.lastSentAt = new Date();
  this.mobileOtp.attempts = 0;
};

userSchema.methods.verifyEmailOtp = async function verifyEmailOtp(otpCode) {
  if (!this.emailOtp?.codeHash || !this.emailOtp?.expiresAt) return false;
  if (this.emailOtp.expiresAt.getTime() < Date.now()) return false;

  const ok = await bcrypt.compare(String(otpCode), this.emailOtp.codeHash);
  this.emailOtp.attempts = (this.emailOtp.attempts || 0) + 1;

  if (ok) {
    this.isEmailVerified = true;
    this.emailOtp.verifiedAt = new Date();
    // clear hash so it cannot be reused
    this.emailOtp.codeHash = undefined;
  }
  return ok;
};

userSchema.methods.verifyMobileOtp = async function verifyMobileOtp(otpCode) {
  if (!this.mobileOtp?.codeHash || !this.mobileOtp?.expiresAt) return false;
  if (this.mobileOtp.expiresAt.getTime() < Date.now()) return false;

  const ok = await bcrypt.compare(String(otpCode), this.mobileOtp.codeHash);
  this.mobileOtp.attempts = (this.mobileOtp.attempts || 0) + 1;

  if (ok) {
    this.isMobileVerified = true;
    this.mobileOtp.verifiedAt = new Date();
    this.mobileOtp.codeHash = undefined;
  }
  return ok;
};

/**
 * Data integrity: normalize roles.
 */
userSchema.pre('validate', function preValidate() {
  if (this.role === ROLES.ADMIN) {
    // Admins should not have enrollmentId (optional but clean)
    // NOTE: We don't hard-delete enrollmentId to avoid accidental data loss.
    // Keep it as-is if already set.
  }
});

const User = mongoose.model('User', userSchema);

module.exports = { User };
