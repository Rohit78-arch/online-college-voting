const mongoose = require('mongoose');

const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { validateBody } = require('../utils/validate');

const { CandidateProfile, Election } = require('../models');
const { APPROVAL_STATUS, ELECTION_STATUS } = require('../utils/constants');
const { updateCandidateProfileSchema } = require('../validators/candidateValidators');

/**
 * GET /api/v1/candidate/elections/:electionId/profile
 * Candidate can fetch their own profile for a given election.
 */
const getMyCandidateProfile = asyncHandler(async (req, res) => {
  const electionId = req.params.electionId;

  const profile = await CandidateProfile.findOne({
    electionId: new mongoose.Types.ObjectId(electionId),
    userId: req.user._id
  });

  if (!profile) throw new ApiError(404, 'Candidate profile not found for this election');

  res.json({ success: true, data: profile });
});

/**
 * PATCH /api/v1/candidate/elections/:electionId/profile
 * Rules (as requested):
 * - Lock photo, symbol, and position after approval.
 * - Allow manifesto edit until election starts (i.e., before RUNNING).
 */
const updateMyCandidateProfile = asyncHandler(async (req, res) => {
  const electionId = req.params.electionId;
  const body = validateBody(updateCandidateProfileSchema, req.body);

  const election = await Election.findById(electionId);
  if (!election) throw new ApiError(404, 'Election not found');

  const profile = await CandidateProfile.findOne({
    electionId: new mongoose.Types.ObjectId(electionId),
    userId: req.user._id
  });

  if (!profile) throw new ApiError(404, 'Candidate profile not found for this election');

  const isApproved = req.user.approvalStatus === APPROVAL_STATUS.APPROVED;

  // Photo / Symbol / Position locked after approval
  if (isApproved) {
    if (body.photoUrl !== undefined && body.photoUrl !== profile.photoUrl) {
      throw new ApiError(403, 'Photo is locked after approval.');
    }
    if (body.electionSymbolUrl !== undefined && body.electionSymbolUrl !== profile.electionSymbolUrl) {
      throw new ApiError(403, 'Election symbol is locked after approval.');
    }
    if (body.positionId !== undefined && String(body.positionId) !== String(profile.positionId)) {
      throw new ApiError(403, 'Position is locked after approval.');
    }
  }

  // Manifesto editable only until election starts
  if (body.manifesto !== undefined) {
    if ([ELECTION_STATUS.RUNNING, ELECTION_STATUS.ENDED].includes(election.status)) {
      throw new ApiError(403, 'Manifesto cannot be edited after election starts.');
    }
    profile.manifesto = body.manifesto;
  }

  // Pre-approval updates
  if (!isApproved) {
    if (body.photoUrl !== undefined) profile.photoUrl = body.photoUrl;
    if (body.electionSymbolUrl !== undefined) profile.electionSymbolUrl = body.electionSymbolUrl;

    if (body.positionId !== undefined) {
      const positionObjectId = new mongoose.Types.ObjectId(body.positionId);
      const positionExists = election.positions.some((p) => String(p._id) === String(positionObjectId));
      if (!positionExists) throw new ApiError(400, 'Invalid positionId for this election');
      profile.positionId = positionObjectId;
    }
  }

  await profile.save();

  res.json({ success: true, message: 'Candidate profile updated', data: profile });
});

module.exports = {
  getMyCandidateProfile,
  updateMyCandidateProfile
};
