const { z } = require('zod');
const { APPROVAL_STATUS, ELECTION_STATUS } = require('../utils/constants');

const objectIdSchema = z.string().min(1);

const setApprovalSchema = z.object({
  status: z.enum([APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.REJECTED]),
  note: z.string().trim().max(500).optional()
});

const createElectionSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional(),
  autoCloseEnabled: z.boolean().optional(),
  endsAt: z.string().datetime().optional()
});

const updateElectionSchema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  // allow scheduling in advance, but election stays DRAFT until admin starts
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  autoCloseEnabled: z.boolean().optional(),
  // optional: allow admin to publish results after end
  resultsPublished: z.boolean().optional(),
  status: z.enum([ELECTION_STATUS.DRAFT, ELECTION_STATUS.SCHEDULED, ELECTION_STATUS.RUNNING, ELECTION_STATUS.ENDED]).optional()
});

const addPositionSchema = z.object({
  title: z.string().trim().min(2).max(80),
  maxWinners: z.number().int().min(1).max(10).optional(),
  order: z.number().int().min(0).max(999).optional()
});

const updatePositionSchema = addPositionSchema.partial();

module.exports = {
  objectIdSchema,
  setApprovalSchema,
  createElectionSchema,
  updateElectionSchema,
  addPositionSchema,
  updatePositionSchema
};
