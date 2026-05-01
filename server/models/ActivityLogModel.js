const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    admin: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: false // Có thể null nếu hành động không liên quan đến admin cụ thể nào (ví dụ: đăng nhập, đăng ký)
     },
     username: {
        type: String,
        required: false // Có thể null nếu không có thông tin người dùng (ví dụ: hành động hệ thống)
     },
    action: { 
        type: String, 
        required: true
    },
    createdAt: { 
        type: Date, 
        default: Date.now,
        expires: '30d' // Tự động xóa sau 30 ngày
    }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);