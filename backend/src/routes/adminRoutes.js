const express = require('express');

const { requireAuth } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');
const { requireAdminType } = require('../middlewares/requireAdminType');

const { ADMIN_TYPES } = require('../utils/constants');

const { listVoters, listCandidates, setUserApproval } = require('../controllers/adminController');
const {
  listElections,
  getElection,
  createElection,
  updateElection,
  addPosition,
  updatePosition,
  deletePosition,
  startElection,
  stopElection
} = require('../controllers/electionAdminController');

const {
  adminGetResults,
  adminGetAnalytics,
  adminPublishResults,
  adminExportResultsPdf,
  adminExportResultsExcel
} = require('../controllers/resultsController');

const router = express.Router();

// All admin routes require auth + ADMIN role
router.use(requireAuth, requireRole('ADMIN'));

/**
 * Verification Admin responsibilities:
 * - approve/reject voters
 * - approve/reject candidates
 */
router.get('/approvals/voters', requireAdminType(ADMIN_TYPES.VERIFICATION_ADMIN), listVoters);
router.get('/approvals/candidates', requireAdminType(ADMIN_TYPES.VERIFICATION_ADMIN), listCandidates);
router.patch('/approvals/users/:userId', requireAdminType(ADMIN_TYPES.VERIFICATION_ADMIN), setUserApproval);

/**
 * Election Admin responsibilities:
 * - create elections
 * - manage positions
 * - start/stop elections
 */
router.get('/elections', requireAdminType(ADMIN_TYPES.ELECTION_ADMIN), listElections);
router.get('/elections/:electionId', requireAdminType(ADMIN_TYPES.ELECTION_ADMIN), getElection);
router.post('/elections', requireAdminType(ADMIN_TYPES.ELECTION_ADMIN), createElection);
router.patch('/elections/:electionId', requireAdminType(ADMIN_TYPES.ELECTION_ADMIN), updateElection);

router.post('/elections/:electionId/positions', requireAdminType(ADMIN_TYPES.ELECTION_ADMIN), addPosition);
router.patch('/elections/:electionId/positions/:positionId', requireAdminType(ADMIN_TYPES.ELECTION_ADMIN), updatePosition);
router.delete('/elections/:electionId/positions/:positionId', requireAdminType(ADMIN_TYPES.ELECTION_ADMIN), deletePosition);

router.post('/elections/:electionId/start', requireAdminType(ADMIN_TYPES.ELECTION_ADMIN), startElection);
router.post('/elections/:electionId/stop', requireAdminType(ADMIN_TYPES.ELECTION_ADMIN), stopElection);

// Results + analytics + exports (Election Admin)
router.get('/elections/:electionId/results', requireAdminType(ADMIN_TYPES.ELECTION_ADMIN), adminGetResults);
router.get('/elections/:electionId/analytics', requireAdminType(ADMIN_TYPES.ELECTION_ADMIN), adminGetAnalytics);
router.post('/elections/:electionId/publish-results', requireAdminType(ADMIN_TYPES.ELECTION_ADMIN), adminPublishResults);
router.get('/elections/:electionId/export/pdf', requireAdminType(ADMIN_TYPES.ELECTION_ADMIN), adminExportResultsPdf);
router.get('/elections/:electionId/export/excel', requireAdminType(ADMIN_TYPES.ELECTION_ADMIN), adminExportResultsExcel);

module.exports = { router };
