const mongoose = require('mongoose');

const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { validateBody } = require('../utils/validate');

const { Election, Vote, CandidateProfile, User } = require('../models');
const { ELECTION_STATUS, ROLES, APPROVAL_STATUS } = require('../utils/constants');
const { castVoteSchema } = require('../validators/voteValidators');

/**
 * Helper: ensure selections are exactly one per position.
 * Prevents partial voting + duplicate position selection.
 */
function assertCompleteBallot({ election, selections }) {
  const positionIds = election.positions.map((p) => String(p._id));

  const selectedPositionIds = selections.map((s) => String(s.positionId));

  // Must contain all positions
  const missing = positionIds.filter((id) => !selectedPositionIds.includes(id));
  if (missing.length) {
    throw new ApiError(400, 'Incomplete ballot: please vote for all positions.', { missingPositionIds: missing });
  }

  // Must not contain unknown positions
  const extra = selectedPositionIds.filter((id) => !positionIds.includes(id));
  if (extra.length) {
    throw new ApiError(400, 'Invalid ballot: contains unknown positionId.', { extraPositionIds: extra });
  }

  // Must not vote twice for same position
  const uniq = new Set(selectedPositionIds);
  if (uniq.size !== selectedPositionIds.length) {
    throw new ApiError(400, 'Invalid ballot: duplicate positionId found.');
  }
}

/**
 * POST /api/v1/votes/:electionId/cast
 * Single ballot system:
 * - 1 API call
 * - 1 Vote document
 * - Must include selections for ALL positions
 * - Allowed only when election.status === RUNNING
 */
const castVote = asyncHandler(async (req, res) => {
  const { electionId } = req.params;
  const body = validateBody(castVoteSchema, req.body);

  // Only approved+verified voters reach here via middlewares
  const voter = req.user;

  if (!voter.enrollmentId) {
    throw new ApiError(400, 'Enrollment ID missing on voter profile');
  }

  const election = await Election.findById(electionId);
  if (!election) throw new ApiError(404, 'Election not found');

  // Voting only allowed when RUNNING.
  if (election.status !== ELECTION_STATUS.RUNNING) {
    throw new ApiError(403, 'Voting is not allowed. Election is not running.');
  }

  // Extra safety: if endsAt already passed but cron hasn't run yet, lock immediately.
  if (election.endsAt && election.endsAt.getTime() <= Date.now()) {
    election.status = ELECTION_STATUS.ENDED;
    election.endedAt = new Date();
    await election.save();
    throw new ApiError(403, 'Voting is closed. Election has ended.');
  }

  if (!election.positions || election.positions.length === 0) {
    throw new ApiError(400, 'Election has no positions configured');
  }

  assertCompleteBallot({ election, selections: body.selections });

  // Validate every selection candidate:
  // - candidate user exists, is approved candidate, active
  // - candidateProfile exists for this election + position
  const selectionPairs = body.selections.map((s) => ({
    positionId: String(s.positionId),
    candidateUserId: String(s.candidateUserId)
  }));

  const candidateUserIds = [...new Set(selectionPairs.map((x) => x.candidateUserId))].map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  const candidates = await User.find({
    _id: { $in: candidateUserIds },
    role: ROLES.CANDIDATE,
    approvalStatus: APPROVAL_STATUS.APPROVED,
    isActive: true
  }).select('_id');

  const approvedCandidateSet = new Set(candidates.map((c) => String(c._id)));

  for (const { candidateUserId } of selectionPairs) {
    if (!approvedCandidateSet.has(candidateUserId)) {
      throw new ApiError(400, 'Invalid candidate selection (candidate not approved / not found)');
    }
  }

  // CandidateProfile check (must match election + position)
  const profiles = await CandidateProfile.find({ electionId }).select('userId positionId').lean();
  const allowedMap = new Set(profiles.map((p) => `${String(p.userId)}::${String(p.positionId)}`));

  for (const { candidateUserId, positionId } of selectionPairs) {
    const key = `${candidateUserId}::${positionId}`;
    if (!allowedMap.has(key)) {
      throw new ApiError(400, 'Invalid selection: candidate is not contesting for the chosen position in this election.');
    }
  }

  try {
    const vote = await Vote.create({
      electionId: election._id,
      voterUserId: voter._id,
      enrollmentId: voter.enrollmentId,
      selections: body.selections.map((s) => ({
        positionId: new mongoose.Types.ObjectId(s.positionId),
        candidateUserId: new mongoose.Types.ObjectId(s.candidateUserId)
      })),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(201).json({
      success: true,
      message: 'Vote cast successfully',
      data: {
        voteId: vote._id,
        electionId: vote.electionId
      }
    });
  } catch (err) {
    // Duplicate vote protection (unique indexes):
    // - (electionId, voterUserId)
    // - (electionId, enrollmentId)
    if (err?.code === 11000) {
      throw new ApiError(409, 'You have already voted in this election.');
    }
    throw err;
  }
});

/**
 * GET /api/v1/votes/:electionId/my-status
 * Used by frontend to disable the voting page if already voted.
 */
const myVoteStatus = asyncHandler(async (req, res) => {
  const { electionId } = req.params;

  const voter = req.user;
  if (!voter.enrollmentId) throw new ApiError(400, 'Enrollment ID missing on voter profile');

  const existing = await Vote.findOne({ electionId, enrollmentId: voter.enrollmentId }).select('_id createdAt');

  res.json({
    success: true,
    data: {
      hasVoted: Boolean(existing),
      votedAt: existing?.createdAt || null
    }
  });
});

module.exports = {
  castVote,
  myVoteStatus
};
