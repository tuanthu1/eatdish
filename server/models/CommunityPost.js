const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String },
    image_url: { type: String },
    
    // Thay thế cho bảng community_likes
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Danh sách comment
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
}, { timestamps: true });

module.exports = mongoose.model('CommunityPost', postSchema);