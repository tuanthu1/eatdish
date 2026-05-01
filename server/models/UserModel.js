const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullname: { type: String },
    avatar: { type: String, default: 'https://ui-avatars.com/api/?name=User' },
    cover_img: { type: String, default: '' },
    bio: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    
    // Trạng thái & Premium
    is_verified: { type: Boolean, default: false },
    email_verify_token: { type: String, default: null },
    is_premium: { type: Boolean, default: false },
    premium_since: { type: Date },
    premium_until: { type: Date },
    
    // AI Chatbot
    daily_chat_count: { type: Number, default: 0 },
    last_chat_date: { type: Date },
    
    // Mối quan hệ (Thay thế cho bảng user_follows, user_blocks, favorites)
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    blocked_users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    
    // Lịch sử nấu (Thay cho bảng cooked_history)
    cooked_history: [{
        recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
        cooked_at: { type: Date, default: Date.now },
        cooksnap_image: { type: String, default: '' },
        cooksnap_note: { type: String, default: '' }
    }],

    refresh_token: { type: String },
    reset_token: { type: String },
    reset_expires: { type: Date },
    email_newsletter: { type: Boolean, default: true }
}, { timestamps: true }); // Tự động tạo created_at và updated_at

module.exports = mongoose.model('User', userSchema);