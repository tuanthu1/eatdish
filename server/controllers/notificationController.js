const Notification = require('../models/Notification');
const User = require('../models/UserModel');

// 1. Lấy danh sách thông báo của User
exports.getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Đánh dấu tất cả là "Đã đọc" khi ấn vào cái chuông
exports.markAsRead = async (req, res) => {
    try {
        const { userId } = req.body;
        await Notification.updateMany({ user: userId }, { is_read: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
