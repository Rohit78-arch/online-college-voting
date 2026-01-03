const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { User } = require('../models');
const { ROLES, APPROVAL_STATUS } = require('../utils/constants');

/**
 * ENV required:
 * SEED_VOTER_NAME
 * SEED_VOTER_EMAIL
 * SEED_VOTER_MOBILE
 * SEED_VOTER_ENROLLMENT
 * SEED_VOTER_PASSWORD
 */

async function seedVoter() {
  const {
    SEED_VOTER_NAME,
    SEED_VOTER_EMAIL,
    SEED_VOTER_MOBILE,
    SEED_VOTER_ENROLLMENT,
    SEED_VOTER_PASSWORD
  } = process.env;

  if (
    !SEED_VOTER_NAME ||
    !SEED_VOTER_EMAIL ||
    !SEED_VOTER_MOBILE ||
    !SEED_VOTER_ENROLLMENT ||
    !SEED_VOTER_PASSWORD
  ) {
    throw new Error('Missing seed voter env vars');
  }

  await connectDB();

  const exists = await User.findOne({
    $or: [{ email: SEED_VOTER_EMAIL }, { enrollmentId: SEED_VOTER_ENROLLMENT }]
  });

  if (exists) {
    console.log('[seed] Voter already exists:', exists.email);
    return;
  }

  const voter = new User({
    fullName: SEED_VOTER_NAME,
    email: SEED_VOTER_EMAIL,
    mobile: SEED_VOTER_MOBILE,
    role: ROLES.VOTER,
    enrollmentId: SEED_VOTER_ENROLLMENT,
    approvalStatus: APPROVAL_STATUS.APPROVED,
    isEmailVerified: true,
    isMobileVerified: true,
    isActive: true
  });

  await voter.setPassword(SEED_VOTER_PASSWORD);
  await voter.save();

  console.log('[seed] Voter created:', voter.email);
}

if (require.main === module) {
  seedVoter()
    .catch((err) => {
      console.error('[seed] Failed', err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.connection.close().catch(() => {});
    });
}

module.exports = { seedVoter };
