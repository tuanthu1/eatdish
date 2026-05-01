const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const {verifyToken} = require('../middleware/auth');
router.post('/', verifyToken, chatController.processChat);
router.post('/admin', verifyToken, chatController.processAdminChat);

module.exports = router;