const express = require('express');

const { requireAuth } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');
const { requireVerified, requireApprovedIfStudent } = require('../middlewares/requireEligibleUser');

const { uploadCandidatePhoto, uploadCandidateSymbol } = require('../middlewares/upload');
const { uploadPhoto, uploadSymbol } = require('../controllers/uploadController');

const router = express.Router();

/**
 * Candidate uploads:
 * - photo (profile)
 * - election symbol
 *
 * Client must send multipart/form-data with field name: "file"
 */
router.use(requireAuth, requireRole('CANDIDATE'), requireVerified, requireApprovedIfStudent);

router.post('/candidate/photo', uploadCandidatePhoto.single('file'), uploadPhoto);
router.post('/candidate/symbol', uploadCandidateSymbol.single('file'), uploadSymbol);

module.exports = { router };
