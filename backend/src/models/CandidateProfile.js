const mongoose = require('mongoose');

/**
 * CandidateProfile is separated so:
 * - We keep User collection lean
 * - Candidate-only data doesn't pollute voter/admin documents
 */
const candidateProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },

    // Which election & which position the candidate is contesting for
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Election',
      required: true,
      index: true
    },

    positionId: {
      // position is stored inside Election.positions as a subdocument
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    photoUrl: { type: String },
    electionSymbolUrl: { type: String },
    manifesto: { type: String, maxlength: 4000 }
  },
  { timestamps: true }
);

// A user cannot apply for multiple positions in the same election (optional rule)
candidateProfileSchema.index({ userId: 1, electionId: 1 }, { unique: true });

const CandidateProfile = mongoose.model('CandidateProfile', candidateProfileSchema);

module.exports = { CandidateProfile };
