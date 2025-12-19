const express = require('express');

const { requireAuth } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');
const { requireVerified, requireApprovedIfStudent } = require('../middlewares/requireEligibleUser');

const { castVote, myVoteStatus } = require('../controllers/voteController');

const router = express.Router();

/**
 * VOTER-only voting routes.
 * Must be verified + approved.
 */
router.use(requireAuth, requireRole('VOTER'), requireVerified, requireApprovedIfStudent);

router.get('/:electionId/my-status', myVoteStatus);
router.post('/:electionId/cast', castVote);

module.exports = { router };
