const db = require('../config/db');

// Lấy danh sách gói (cho cả Admin và User)
exports.getAllPackages = async (req, res) => {
    try {
        const [packages] = await db.query("SELECT * FROM premium_packages WHERE is_active = 1");
        res.json(packages);
    } catch (err) { res.status(500).json({ message: "Lỗi server" }); }
};

