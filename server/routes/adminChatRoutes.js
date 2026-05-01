const express = require('express');
const router = express.Router();
const adminChatController = require('../controllers/adminChatController');

const { verifyToken, checkAdmin } = require('../middleware/auth');

// Nếu có bảo mật: router.post('/bot', verifyToken, checkAdmin, adminChatController.processAdminCommand);
router.post('/bot', verifyToken, checkAdmin, adminChatController.processAdminCommand);

module.exports = router;