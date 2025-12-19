const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { User } = require('../models/User');
const { ROLES, ADMIN_TYPES, APPROVAL_STATUS } = require('../utils/constants');

/**
 * Usage:
 * 1) Add these to .env temporarily:
 *    SEED_ADMIN_NAME=Super Admin
 *    SEED_ADMIN_EMAIL=admin@college.edu
 *    SEED_ADMIN_MOBILE=9999999999
 *    SEED_ADMIN_ID=ADM001
 *    SEED_ADMIN_PASSWORD=StrongPass@123
 * 2) Run: npm run seed:admin
 */
async function seedAdmin() {
  const name = process.env.SEED_ADMIN_NAME;
  const email = process.env.SEED_ADMIN_EMAIL;
  const mobile = process.env.SEED_ADMIN_MOBILE;
  const adminId = process.env.SEED_ADMIN_ID;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!name || !email || !mobile || !adminId || !password) {
    throw new Error(
      'Missing seed env vars. Please set SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_MOBILE, SEED_ADMIN_ID, SEED_ADMIN_PASSWORD'
    );
  }

  await connectDB();

  const existing = await User.findOne({ $or: [{ email }, { adminId }] });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log('[seed] Admin already exists:', existing.email);
    return;
  }

  const admin = new User({
    fullName: name,
    email,
    mobile,
    role: ROLES.ADMIN,
    adminType: ADMIN_TYPES.SUPER_ADMIN,
    adminId,
    approvalStatus: APPROVAL_STATUS.APPROVED,
    isEmailVerified: true,
    isMobileVerified: true
  });

  await admin.setPassword(password);
  await admin.save();

  // eslint-disable-next-line no-console
  console.log('[seed] Super Admin created:', admin.email);
}

if (require.main === module) {
  seedAdmin()
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[seed] Failed', err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.connection.close().catch(() => {});
    });
}

module.exports = { seedAdmin };
