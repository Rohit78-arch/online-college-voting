const express = require('express');

const { router: authRouter } = require('./authRoutes');
const { router: adminRouter } = require('./adminRoutes');
const { router: superAdminRouter } = require('./superAdminRoutes');
const { router: electionPublicRouter } = require('./electionPublicRoutes');
const { router: voteRouter } = require('./voteRoutes');
const { router: candidateRouter } = require('./candidateRoutes');
const { router: uploadRouter } = require('./uploadRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is healthy' });
});

// Auth + OTP
router.use('/auth', authRouter);

// Public election data for candidate apply + voter UI
router.use('/elections', electionPublicRouter);

// Voting APIs
router.use('/votes', voteRouter);

// Candidate APIs
router.use('/candidate', candidateRouter);

// Upload APIs (candidate assets)
router.use('/upload', uploadRouter);

// Admin panel APIs
router.use('/admin', adminRouter);

// Super Admin only APIs (create admins, logs)
router.use('/super-admin', superAdminRouter);

module.exports = { router };
