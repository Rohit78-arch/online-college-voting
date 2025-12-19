const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');

const { Election, CandidateProfile, User } = require('../models');
const { APPROVAL_STATUS, ROLES } = require('../utils/constants');

/**
 * Public listing for UI (candidate application, voter dashboard).
 * Includes DRAFT so candidates can apply as you requested.
 */
const listPublicElections = asyncHandler(async (req, res) => {
  const elections = await Election.find().sort({ createdAt: -1 });
  res.json({ success: true, data: elections });
});

const getPublicElection = asyncHandler(async (req, res) => {
  const election = await Election.findById(req.params.electionId);
  if (!election) throw new ApiError(404, 'Election not found');
  res.json({ success: true, data: election });
});

/**
 * List approved candidates for a given election (optionally filtered by positionId).
 * Used by the voting UI to show candidates.
 */
const listApprovedCandidates = asyncHandler(async (req, res) => {
  const { electionId } = req.params;
  const { positionId } = req.query;

  const election = await Election.findById(electionId).select('_id');
  if (!election) throw new ApiError(404, 'Election not found');

  const profileQuery = { electionId };
  if (positionId) profileQuery.positionId = positionId;

  const profiles = await CandidateProfile.find(profileQuery).lean();

  const userIds = profiles.map((p) => p.userId);
  const users = await User.find({
    _id: { $in: userIds },
    role: ROLES.CANDIDATE,
    approvalStatus: APPROVAL_STATUS.APPROVED,
    isActive: true
  })
    .select('fullName enrollmentId department semesterOrYear')
    .lean();

  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const result = profiles
    .map((p) => ({
      candidateUserId: String(p.userId),
      user: userMap.get(String(p.userId)),
      profile: {
        id: String(p._id),
        electionId: String(p.electionId),
        positionId: String(p.positionId),
        photoUrl: p.photoUrl,
        electionSymbolUrl: p.electionSymbolUrl,
        manifesto: p.manifesto
      }
    }))
    .filter((x) => Boolean(x.user));

  res.json({ success: true, data: result });
});

module.exports = {
  listPublicElections,
  getPublicElection,
  listApprovedCandidates
};
