const mongoose = require('mongoose');
const { ELECTION_STATUS } = require('../utils/constants');

const positionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0, index: true },
    maxWinners: { type: Number, default: 1, min: 1 }
  },
  { _id: true }
);

const electionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String },
    status: {
      type: String,
      enum: Object.values(ELECTION_STATUS),
      default: ELECTION_STATUS.DRAFT,
      index: true
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
    endsAt: { type: Date, index: true }, // timer-based auto-close
    autoCloseEnabled: { type: Boolean, default: false },

    positions: { type: [positionSchema], default: [] },

    resultsPublished: { type: Boolean, default: false } // controls candidate visibility of results
  },
  { timestamps: true }
);

const Election = mongoose.model('Election', electionSchema);

module.exports = { Election };
