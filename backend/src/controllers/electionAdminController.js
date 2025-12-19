const mongoose = require('mongoose');

const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { validateBody } = require('../utils/validate');

const { Election } = require('../models');
const { ELECTION_STATUS } = require('../utils/constants');
const {
  createElectionSchema,
  updateElectionSchema,
  addPositionSchema,
  updatePositionSchema
} = require('../validators/adminValidators');
const { logAdminAction } = require('../services/adminLogService');

const listElections = asyncHandler(async (req, res) => {
  const elections = await Election.find().sort({ createdAt: -1 });
  res.json({ success: true, data: elections });
});

const getElection = asyncHandler(async (req, res) => {
  const election = await Election.findById(req.params.electionId);
  if (!election) throw new ApiError(404, 'Election not found');
  res.json({ success: true, data: election });
});

const createElection = asyncHandler(async (req, res) => {
  const body = validateBody(createElectionSchema, req.body);

  const election = await Election.create({
    name: body.name,
    description: body.description,
    status: ELECTION_STATUS.DRAFT,
    autoCloseEnabled: body.autoCloseEnabled || false,
    endsAt: body.endsAt ? new Date(body.endsAt) : undefined
  });

  await logAdminAction({
    adminUserId: req.user._id,
    action: 'CREATE_ELECTION',
    entityType: 'Election',
    entityId: election._id,
    meta: { name: election.name },
    req
  });

  res.status(201).json({ success: true, message: 'Election created (DRAFT)', data: election });
});

const updateElection = asyncHandler(async (req, res) => {
  const body = validateBody(updateElectionSchema, req.body);

  const election = await Election.findById(req.params.electionId);
  if (!election) throw new ApiError(404, 'Election not found');

  if (body.name !== undefined) election.name = body.name;
  if (body.description !== undefined) election.description = body.description;
  if (body.autoCloseEnabled !== undefined) election.autoCloseEnabled = body.autoCloseEnabled;

  // Results must NOT be visible automatically.
  // Allow publish/unpublish only after election ENDED.
  if (body.resultsPublished !== undefined) {
    if (election.status !== ELECTION_STATUS.ENDED) {
      throw new ApiError(400, 'You can change resultsPublished only after the election ends.');
    }
    election.resultsPublished = body.resultsPublished;
  }

  if (body.startsAt !== undefined) election.startsAt = new Date(body.startsAt);
  if (body.endsAt !== undefined) election.endsAt = new Date(body.endsAt);

  // Optional: allow admin to set SCHEDULED while still not voting until RUNNING.
  if (body.status !== undefined) {
    // Protect against switching to RUNNING/ENDED without explicit endpoints.
    if ([ELECTION_STATUS.RUNNING, ELECTION_STATUS.ENDED].includes(body.status)) {
      throw new ApiError(400, 'Use /start or /stop endpoints to change RUNNING/ENDED');
    }
    election.status = body.status;
  }

  // sanity: endsAt must be after startsAt if both present
  if (election.startsAt && election.endsAt && election.endsAt.getTime() <= election.startsAt.getTime()) {
    throw new ApiError(400, 'endsAt must be after startsAt');
  }

  await election.save();

  await logAdminAction({
    adminUserId: req.user._id,
    action: 'UPDATE_ELECTION',
    entityType: 'Election',
    entityId: election._id,
    meta: body,
    req
  });

  res.json({ success: true, message: 'Election updated', data: election });
});

const addPosition = asyncHandler(async (req, res) => {
  const body = validateBody(addPositionSchema, req.body);

  const election = await Election.findById(req.params.electionId);
  if (!election) throw new ApiError(404, 'Election not found');

  if (![ELECTION_STATUS.DRAFT, ELECTION_STATUS.SCHEDULED].includes(election.status)) {
    throw new ApiError(400, 'Cannot modify positions once election is RUNNING/ENDED');
  }

  election.positions.push({
    title: body.title,
    maxWinners: body.maxWinners ?? 1,
    order: body.order ?? 0
  });

  await election.save();

  const added = election.positions[election.positions.length - 1];

  await logAdminAction({
    adminUserId: req.user._id,
    action: 'ADD_POSITION',
    entityType: 'Election',
    entityId: election._id,
    meta: { positionId: added._id, title: added.title },
    req
  });

  res.status(201).json({ success: true, message: 'Position added', data: added });
});

const updatePosition = asyncHandler(async (req, res) => {
  const body = validateBody(updatePositionSchema, req.body);

  const election = await Election.findById(req.params.electionId);
  if (!election) throw new ApiError(404, 'Election not found');

  if (![ELECTION_STATUS.DRAFT, ELECTION_STATUS.SCHEDULED].includes(election.status)) {
    throw new ApiError(400, 'Cannot modify positions once election is RUNNING/ENDED');
  }

  const position = election.positions.id(req.params.positionId);
  if (!position) throw new ApiError(404, 'Position not found');

  if (body.title !== undefined) position.title = body.title;
  if (body.maxWinners !== undefined) position.maxWinners = body.maxWinners;
  if (body.order !== undefined) position.order = body.order;

  await election.save();

  await logAdminAction({
    adminUserId: req.user._id,
    action: 'UPDATE_POSITION',
    entityType: 'Election',
    entityId: election._id,
    meta: { positionId: position._id, ...body },
    req
  });

  res.json({ success: true, message: 'Position updated', data: position });
});

const deletePosition = asyncHandler(async (req, res) => {
  const election = await Election.findById(req.params.electionId);
  if (!election) throw new ApiError(404, 'Election not found');

  if (![ELECTION_STATUS.DRAFT, ELECTION_STATUS.SCHEDULED].includes(election.status)) {
    throw new ApiError(400, 'Cannot modify positions once election is RUNNING/ENDED');
  }

  const position = election.positions.id(req.params.positionId);
  if (!position) throw new ApiError(404, 'Position not found');

  position.deleteOne();
  await election.save();

  await logAdminAction({
    adminUserId: req.user._id,
    action: 'DELETE_POSITION',
    entityType: 'Election',
    entityId: election._id,
    meta: { positionId: req.params.positionId },
    req
  });

  res.json({ success: true, message: 'Position deleted' });
});

/**
 * Start election:
 * - status -> RUNNING
 * - startedAt -> now
 * - startsAt default now
 * - endsAt MUST exist (timer)
 */
const startElection = asyncHandler(async (req, res) => {
  const election = await Election.findById(req.params.electionId);
  if (!election) throw new ApiError(404, 'Election not found');

  if (election.status === ELECTION_STATUS.RUNNING) {
    throw new ApiError(400, 'Election already running');
  }
  if (election.status === ELECTION_STATUS.ENDED) {
    throw new ApiError(400, 'Election already ended');
  }

  if (!election.positions || election.positions.length === 0) {
    throw new ApiError(400, 'Add at least 1 position before starting election');
  }

  if (!election.endsAt) {
    throw new ApiError(400, 'Set endsAt (timer) before starting election');
  }

  const now = new Date();

  // startsAt is informational; voting is controlled by status RUNNING.
  if (!election.startsAt) election.startsAt = now;

  if (new Date(election.endsAt).getTime() <= now.getTime()) {
    throw new ApiError(400, 'endsAt must be in the future when starting election');
  }

  election.status = ELECTION_STATUS.RUNNING;
  election.startedAt = now;
  await election.save();

  await logAdminAction({
    adminUserId: req.user._id,
    action: 'START_ELECTION',
    entityType: 'Election',
    entityId: election._id,
    meta: { startedAt: now.toISOString(), endsAt: election.endsAt?.toISOString?.() },
    req
  });

  res.json({ success: true, message: 'Election started', data: election });
});

const stopElection = asyncHandler(async (req, res) => {
  const election = await Election.findById(req.params.electionId);
  if (!election) throw new ApiError(404, 'Election not found');

  if (election.status !== ELECTION_STATUS.RUNNING) {
    throw new ApiError(400, 'Only RUNNING elections can be stopped');
  }

  const now = new Date();

  election.status = ELECTION_STATUS.ENDED;
  election.endedAt = now;
  await election.save();

  await logAdminAction({
    adminUserId: req.user._id,
    action: 'STOP_ELECTION',
    entityType: 'Election',
    entityId: election._id,
    meta: { endedAt: now.toISOString() },
    req
  });

  res.json({ success: true, message: 'Election ended', data: election });
});

module.exports = {
  listElections,
  getElection,
  createElection,
  updateElection,
  addPosition,
  updatePosition,
  deletePosition,
  startElection,
  stopElection
};
