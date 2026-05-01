const mongoose = require('mongoose');
const notifSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' }, // like, follow, info...
    is_read: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('Notification', notifSchema);