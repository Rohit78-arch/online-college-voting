const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { validateBody } = require('../utils/validate');

const { User, CandidateProfile } = require('../models');
const { APPROVAL_STATUS, ROLES } = require('../utils/constants');
const { setApprovalSchema } = require('../validators/adminValidators');
const { logAdminAction } = require('../services/adminLogService');

/**
 * List voters with approvalStatus filter.
 * Admin UI: pending approvals.
 */
const listVoters = asyncHandler(async (req, res) => {
  const status = req.query.status || APPROVAL_STATUS.PENDING;

  const users = await User.find({ role: ROLES.VOTER, approvalStatus: status }).sort({ createdAt: -1 });

  res.json({ success: true, data: users });
});

/**
 * List candidates with approvalStatus filter (optionally by electionId).
 * Candidate approval is based on User.approvalStatus.
 */
const listCandidates = asyncHandler(async (req, res) => {
  const status = req.query.status || APPROVAL_STATUS.PENDING;

  // 1. Find users with the given status
  const users = await User.find({ role: ROLES.CANDIDATE, approvalStatus: status })
    .sort({ createdAt: -1 })
    .lean();

  if (!users.length) {
    return res.json({ success: true, data: [] });
  }

  // 2. Fetch profiles for these users to get election/position info
  const userIds = users.map(u => u._id);
  const profiles = await CandidateProfile.find({ userId: { $in: userIds } })
    .populate('electionId', 'name status')
    .lean();

  // 3. Map profiles to users
  // Note: A user might have multiple profiles if allowed, but typically 1 active.
  // We'll attach the profile info to the user object or return a wrapper.
  const result = users.map(user => {
    const profile = profiles.find(p => p.userId.toString() === user._id.toString());
    
    // Find position details manually since position is a subdoc in election
    let position = null;
    if (profile && profile.electionId && profile.electionId.positions) {
       position = profile.electionId.positions.find(pos => pos._id.toString() === profile.positionId.toString());
    }

    return {
      _id: profile ? profile._id : user._id, // Use profile ID or user ID as key
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        enrollmentId: user.enrollmentId
      },
      election: profile ? profile.electionId : null,
      position: position ? { title: position.title } : null
    };
  });

  return res.json({ success: true, data: result });
});

/**
 * Approve/Reject a user.
 * - For VOTER / CANDIDATE: moves approvalStatus
 * - For ADMIN: typically already approved (seeded/created by Super Admin)
 */
const setUserApproval = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const body = validateBody(setApprovalSchema, req.body);

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (![ROLES.VOTER, ROLES.CANDIDATE].includes(user.role)) {
    throw new ApiError(400, 'Only VOTER/CANDIDATE accounts require approval');
  }

  user.approvalStatus = body.status;
  user.approvalNote = body.note;
  user.approvedAt = new Date();
  user.approvedBy = req.user._id;

  await user.save();

  await logAdminAction({
    adminUserId: req.user._id,
    action: body.status === APPROVAL_STATUS.APPROVED ? 'APPROVE_USER' : 'REJECT_USER',
    entityType: 'User',
    entityId: user._id,
    meta: { role: user.role, note: body.note },
    req
  });

  res.json({
    success: true,
    message: `User ${body.status.toLowerCase()}`,
    data: { id: user._id, approvalStatus: user.approvalStatus }
  });
});

module.exports = {
  listVoters,
  listCandidates,
  setUserApproval
};
