
const db = require('../config/db'); 
// hàm tạo feedback gửi về cho admin
exports.createFeedback = async (req, res) => { 
    const { userId, type, content } = req.body;
    
    console.log("📩 Server nhận feedback từ User:", userId);

    try {
        const sql = "INSERT INTO feedbacks (user_id, type, content) VALUES (?, ?, ?)";
        await db.query(sql, [userId, type, content]);
        return res.status(200).json({ 
            status: 'success', 
            message: "Gửi góp ý thành công!" 
        });

    } catch (err) {
        console.error("❌ Lỗi SQL:", err);
        return res.status(500).json({ message: "Lỗi lưu vào Database" });
    }
};