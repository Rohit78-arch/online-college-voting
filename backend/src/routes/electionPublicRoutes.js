const express = require('express');

const {
  listPublicElections,
  getPublicElection,
  listApprovedCandidates
} = require('../controllers/electionPublicController');

const router = express.Router();

router.get('/', listPublicElections);
router.get('/:electionId', getPublicElection);
router.get('/:electionId/candidates', listApprovedCandidates);

module.exports = { router };
