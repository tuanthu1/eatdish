
const Feedback = require('../models/Feedback'); 
// hàm tạo feedback gửi về cho admin
exports.createFeedback = async (req, res) => { 
    const { userId, type, content } = req.body;

    try {
        await Feedback.create({
            user: userId,
            type,
            content
        });
        await ActivityLog.create({
            admin: req.user ? req.user.id : null,
            action: "Tài khoản " + userId + " đã gửi một góp ý mới với nội dung: " + content.substring(0, 30) + "..."
        });
        return res.status(200).json({ 
            status: 'success', 
            message: "Gửi góp ý thành công!" 
        });
        
    } catch (err) {
        console.error("Lỗi SQL:", err);
        return res.status(500).json({ message: "Lỗi lưu vào Database" });
    }
};