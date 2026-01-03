const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { User, CandidateProfile, Election } = require('../models');
const { ROLES, APPROVAL_STATUS } = require('../utils/constants');

/**
 * ENV required:
 * SEED_CANDIDATE_NAME
 * SEED_CANDIDATE_EMAIL
 * SEED_CANDIDATE_MOBILE
 * SEED_CANDIDATE_ENROLLMENT
 * SEED_CANDIDATE_PASSWORD
 * SEED_ELECTION_ID
 * SEED_POSITION_ID
 */

async function seedCandidate() {
  const {
    SEED_CANDIDATE_NAME,
    SEED_CANDIDATE_EMAIL,
    SEED_CANDIDATE_MOBILE,
    SEED_CANDIDATE_ENROLLMENT,
    SEED_CANDIDATE_PASSWORD,
    SEED_ELECTION_ID,
    SEED_POSITION_ID
  } = process.env;

  if (
    !SEED_CANDIDATE_NAME ||
    !SEED_CANDIDATE_EMAIL ||
    !SEED_CANDIDATE_MOBILE ||
    !SEED_CANDIDATE_ENROLLMENT ||
    !SEED_CANDIDATE_PASSWORD ||
    !SEED_ELECTION_ID ||
    !SEED_POSITION_ID
  ) {
    throw new Error('Missing seed candidate env vars');
  }

  await connectDB();

  const exists = await User.findOne({
    $or: [{ email: SEED_CANDIDATE_EMAIL }, { enrollmentId: SEED_CANDIDATE_ENROLLMENT }]
  });

  if (exists) {
    console.log('[seed] Candidate already exists:', exists.email);
    return;
  }

  const user = new User({
    fullName: SEED_CANDIDATE_NAME,
    email: SEED_CANDIDATE_EMAIL,
    mobile: SEED_CANDIDATE_MOBILE,
    role: ROLES.CANDIDATE,
    enrollmentId: SEED_CANDIDATE_ENROLLMENT,
    approvalStatus: APPROVAL_STATUS.APPROVED,
    isEmailVerified: true,
    isMobileVerified: true,
    isActive: true
  });

  await user.setPassword(SEED_CANDIDATE_PASSWORD);
  await user.save();

  await CandidateProfile.create({
    userId: user._id,
    electionId: SEED_ELECTION_ID,
    positionId: SEED_POSITION_ID
  });

  console.log('[seed] Candidate created:', user.email);
}

if (require.main === module) {
  seedCandidate()
    .catch((err) => {
      console.error('[seed] Failed', err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.connection.close().catch(() => {});
    });
}

module.exports = { seedCandidate };
