const mongoose = require('mongoose');

const SearchAnalyticsSchema = new mongoose.Schema({
    keyword: { type: String, required: true, index: true }, // Từ khóa tìm kiếm
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true }, // Món ăn được click
    clicks: { type: Number, default: 1 } // Số lượt click
});

module.exports = mongoose.model('SearchAnalytics', SearchAnalyticsSchema);