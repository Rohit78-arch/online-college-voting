const { AdminLog } = require('../models/AdminLog');

/**
 * Lightweight audit logging.
 * Keep it non-blocking where possible; however for a college project we can await it.
 */
async function logAdminAction({
  adminUserId,
  action,
  entityType,
  entityId,
  meta,
  req
}) {
  return AdminLog.create({
    adminUserId,
    action,
    entityType,
    entityId,
    meta,
    ip: req?.ip,
    userAgent: req?.headers?.['user-agent']
  });
}

module.exports = { logAdminAction };
