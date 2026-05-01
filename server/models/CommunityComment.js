const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parent_comment: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityComment', default: null }, // Để làm tính năng Reply
    content: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('CommunityComment', commentSchema);