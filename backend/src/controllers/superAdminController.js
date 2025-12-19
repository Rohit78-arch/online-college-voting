const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { validateBody } = require('../utils/validate');

const { User, AdminLog } = require('../models');
const { ROLES, APPROVAL_STATUS } = require('../utils/constants');
const { createAdminSchema } = require('../validators/superAdminValidators');
const { logAdminAction } = require('../services/adminLogService');

/**
 * SUPER_ADMIN creates other admins.
 * Election Admin & Verification Admin must not create admins.
 */
const createAdmin = asyncHandler(async (req, res) => {
  const body = validateBody(createAdminSchema, req.body);

  const exists = await User.findOne({
    $or: [{ email: body.email }, { mobile: body.mobile }, { adminId: body.adminId }]
  });

  if (exists) throw new ApiError(409, 'Admin already exists with same email/mobile/adminId');

  const admin = new User({
    fullName: body.fullName,
    email: body.email,
    mobile: body.mobile,
    role: ROLES.ADMIN,
    adminType: body.adminType,
    adminId: body.adminId,

    // Admins are internal accounts; treat as approved + verified.
    approvalStatus: APPROVAL_STATUS.APPROVED,
    isEmailVerified: true,
    isMobileVerified: true,
    isActive: true
  });

  await admin.setPassword(body.password);
  await admin.save();

  await logAdminAction({
    adminUserId: req.user._id,
    action: 'CREATE_ADMIN',
    entityType: 'User',
    entityId: admin._id,
    meta: { adminType: admin.adminType, adminId: admin.adminId },
    req
  });

  res.status(201).json({
    success: true,
    message: 'Admin created',
    data: {
      id: admin._id,
      fullName: admin.fullName,
      adminId: admin.adminId,
      adminType: admin.adminType,
      email: admin.email,
      mobile: admin.mobile
    }
  });
});

const listAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: ROLES.ADMIN }).sort({ createdAt: -1 });
  res.json({ success: true, data: admins });
});

/**
 * Basic admin log listing for audit.
 */
const listAdminLogs = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const logs = await AdminLog.find().sort({ createdAt: -1 }).limit(limit).populate('adminUserId', 'fullName adminId adminType');
  res.json({ success: true, data: logs });
});

module.exports = {
  createAdmin,
  listAdmins,
  listAdminLogs
};
