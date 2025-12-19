const express = require('express');

const { requireAuth } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');
const { requireVerified, requireApprovedIfStudent } = require('../middlewares/requireEligibleUser');

const { candidateGetResults } = require('../controllers/resultsController');
const {
  getMyCandidateProfile,
  updateMyCandidateProfile
} = require('../controllers/candidateProfileController');

const router = express.Router();

router.use(requireAuth, requireRole('CANDIDATE'), requireVerified, requireApprovedIfStudent);

// Candidate profile (for UI)
router.get('/elections/:electionId/profile', getMyCandidateProfile);
router.patch('/elections/:electionId/profile', updateMyCandidateProfile);

// Results (published only)
router.get('/elections/:electionId/results', candidateGetResults);

module.exports = { router };
