const mongoose = require('mongoose');

const selectionSchema = new mongoose.Schema(
  {
    positionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    candidateUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { _id: false }
);

const voteSchema = new mongoose.Schema(
  {
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true, index: true },
    voterUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    enrollmentId: { type: String, required: true, index: true }, // one vote per enrollmentId per election

    selections: { type: [selectionSchema], required: true },

    ip: { type: String },
    userAgent: { type: String }
  },
  { timestamps: true }
);

// Integrity: one ballot per voter per election
voteSchema.index({ electionId: 1, voterUserId: 1 }, { unique: true });
// Backstop: one ballot per enrollmentId per election
voteSchema.index({ electionId: 1, enrollmentId: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema);

module.exports = { Vote };
