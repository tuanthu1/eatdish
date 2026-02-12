const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/:userId', notificationController.getUserNotifications); // Lấy danh sách
router.put('/read-all', notificationController.markAsRead);          // Đánh dấu đã đọc

module.exports = router;