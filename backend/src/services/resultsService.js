const mongoose = require('mongoose');

const { Election } = require('../models/Election');
const { Vote } = require('../models/Vote');
const { CandidateProfile } = require('../models/CandidateProfile');
const { User } = require('../models/User');
const { ApiError } = require('../utils/apiError');
const { ROLES, APPROVAL_STATUS, ELECTION_STATUS } = require('../utils/constants');

/**
 * Returns:
 * - summary metrics (votes, turnout)
 * - per-position results (candidate counts + percentages + winners)
 */
async function buildElectionResults(electionId) {
  const election = await Election.findById(electionId).lean();
  if (!election) throw new ApiError(404, 'Election not found');

  if (election.status !== ELECTION_STATUS.ENDED) {
    throw new ApiError(400, 'Election results are available only after the election ends.');
  }

  const electionObjectId = new mongoose.Types.ObjectId(electionId);

  // Total votes cast (ballots)
  const totalVotesCast = await Vote.countDocuments({ electionId: electionObjectId });

  // Eligible voters: approved + verified + active
  const totalEligibleVoters = await User.countDocuments({
    role: ROLES.VOTER,
    approvalStatus: APPROVAL_STATUS.APPROVED,
    isActive: true,
    isEmailVerified: true,
    isMobileVerified: true
  });

  const turnoutPct = totalEligibleVoters === 0 ? 0 : Number(((totalVotesCast / totalEligibleVoters) * 100).toFixed(2));

  // Aggregate counts per (positionId, candidateUserId)
  const agg = await Vote.aggregate([
    { $match: { electionId: electionObjectId } },
    { $unwind: '$selections' },
    {
      $group: {
        _id: {
          positionId: '$selections.positionId',
          candidateUserId: '$selections.candidateUserId'
        },
        votes: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.positionId',
        candidates: {
          $push: {
            candidateUserId: '$_id.candidateUserId',
            votes: '$votes'
          }
        },
        positionVotes: { $sum: '$votes' }
      }
    }
  ]);

  // Fetch candidate details for this election
  const profiles = await CandidateProfile.find({ electionId: electionObjectId }).lean();
  const profileMap = new Map(profiles.map((p) => [`${String(p.userId)}::${String(p.positionId)}`, p]));

  const candidateUserIds = [...new Set(profiles.map((p) => String(p.userId)))].map((id) => new mongoose.Types.ObjectId(id));

  const candidateUsers = await User.find({
    _id: { $in: candidateUserIds },
    role: ROLES.CANDIDATE,
    approvalStatus: APPROVAL_STATUS.APPROVED,
    isActive: true
  })
    .select('fullName enrollmentId department semesterOrYear')
    .lean();

  const userMap = new Map(candidateUsers.map((u) => [String(u._id), u]));

  // Build per-position result array in election.positions order
  const positionsOrdered = [...(election.positions || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  const aggByPositionId = new Map(agg.map((row) => [String(row._id), row]));

  const perPosition = positionsOrdered.map((pos) => {
    const row = aggByPositionId.get(String(pos._id));
    const positionVotes = row?.positionVotes || 0;

    const candidates = (row?.candidates || [])
      .map((c) => {
        const user = userMap.get(String(c.candidateUserId));
        const profile = profileMap.get(`${String(c.candidateUserId)}::${String(pos._id)}`);
        const pct = positionVotes === 0 ? 0 : Number(((c.votes / positionVotes) * 100).toFixed(2));

        return {
          candidateUserId: String(c.candidateUserId),
          votes: c.votes,
          percentage: pct,
          user: user
            ? {
                fullName: user.fullName,
                enrollmentId: user.enrollmentId,
                department: user.department,
                semesterOrYear: user.semesterOrYear
              }
            : null,
          profile: profile
            ? {
                photoUrl: profile.photoUrl,
                electionSymbolUrl: profile.electionSymbolUrl,
                manifesto: profile.manifesto
              }
            : null
        };
      })
      .filter((x) => Boolean(x.user))
      .sort((a, b) => b.votes - a.votes);

    const winners = candidates.slice(0, pos.maxWinners || 1);

    return {
      positionId: String(pos._id),
      title: pos.title,
      maxWinners: pos.maxWinners || 1,
      totalVotes: positionVotes,
      candidates,
      winners
    };
  });

  return {
    election: {
      id: String(election._id),
      name: election.name,
      status: election.status,
      startedAt: election.startedAt,
      endedAt: election.endedAt,
      endsAt: election.endsAt,
      resultsPublished: Boolean(election.resultsPublished)
    },
    summary: {
      totalEligibleVoters,
      totalVotesCast,
      turnoutPct
    },
    positions: perPosition
  };
}

module.exports = {
  buildElectionResults
};
