const { z } = require('zod');
const { ADMIN_TYPES } = require('../utils/constants');

const mobileSchema = z
  .string()
  .trim()
  .min(8)
  .max(20)
  .regex(/^\+?[0-9]{8,20}$/, 'Mobile must contain only digits and optionally start with +');

const createAdminSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  adminId: z.string().trim().min(3).max(30),
  email: z.string().email().trim().toLowerCase(),
  mobile: mobileSchema,
  password: z.string().min(8).max(64),
  adminType: z.enum([ADMIN_TYPES.ELECTION_ADMIN, ADMIN_TYPES.VERIFICATION_ADMIN])
});

module.exports = {
  createAdminSchema
};
