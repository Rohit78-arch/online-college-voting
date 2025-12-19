const express = require('express');

const { requireAuth } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');
const { requireSuperAdmin } = require('../middlewares/requireSuperAdmin');

const { createAdmin, listAdmins, listAdminLogs } = require('../controllers/superAdminController');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'), requireSuperAdmin);

router.post('/admins', createAdmin);
router.get('/admins', listAdmins);
router.get('/logs', listAdminLogs);

module.exports = { router };
