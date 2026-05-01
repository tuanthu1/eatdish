const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    cooksnap_image: { type: String, default: '' },
    cooked_at: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);