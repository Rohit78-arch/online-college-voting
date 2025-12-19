const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema(
  {
    adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    action: { type: String, required: true, index: true },

    entityType: { type: String, required: true, index: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, index: true },

    meta: { type: Object },

    ip: { type: String },
    userAgent: { type: String }
  },
  { timestamps: true }
);

adminLogSchema.index({ createdAt: -1 });

const AdminLog = mongoose.model('AdminLog', adminLogSchema);

module.exports = { AdminLog };
