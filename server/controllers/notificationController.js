const db = require('../config/db');

// 1. Lấy danh sách thông báo của User
exports.getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const sql = `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`;
        const [rows] = await db.query(sql, [userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Đánh dấu tất cả là "Đã đọc" khi ấn vào cái chuông
exports.markAsRead = async (req, res) => {
    try {
        const { userId } = req.body;
        await db.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
