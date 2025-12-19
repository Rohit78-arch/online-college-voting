const { z } = require('zod');

// NOTE: For Twilio delivery, recommend storing mobile in E.164 format.
const mobileSchema = z
  .string()
  .trim()
  .min(8)
  .max(20)
  .regex(/^\+?[0-9]{8,20}$/, 'Mobile must contain only digits and optionally start with +');

const passwordSchema = z.string().min(8).max(64);

const registerVoterSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  enrollmentId: z.string().trim().min(3).max(30),
  scholarOrRollNumber: z.string().trim().min(1).max(30),
  department: z.string().trim().min(2).max(80),
  semesterOrYear: z.string().trim().min(1).max(20),
  mobile: mobileSchema,
  email: z.string().email().trim().toLowerCase(),
  password: passwordSchema
});

const registerCandidateSchema = registerVoterSchema.extend({
  electionId: z.string().min(1),
  positionId: z.string().min(1),
  photoUrl: z.string().url().optional(),
  electionSymbolUrl: z.string().url().optional(),
  manifesto: z.string().trim().max(4000).optional()
});

const loginSchema = z.object({
  identifier: z.string().trim().min(3), // email or enrollmentId or adminId
  password: passwordSchema
});

const sendEmailOtpSchema = z.object({
  email: z.string().email().trim().toLowerCase()
});

const verifyEmailOtpSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  otp: z.string().trim().min(4).max(10)
});

const sendMobileOtpSchema = z.object({
  mobile: mobileSchema
});

const verifyMobileOtpSchema = z.object({
  mobile: mobileSchema,
  otp: z.string().trim().min(4).max(10)
});

module.exports = {
  registerVoterSchema,
  registerCandidateSchema,
  loginSchema,
  sendEmailOtpSchema,
  verifyEmailOtpSchema,
  sendMobileOtpSchema,
  verifyMobileOtpSchema
};
