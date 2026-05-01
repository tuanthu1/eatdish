const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, default: 'Khac' },
    meal_type: { type: String, default: 'Khong_xac_dinh' },
    calories: { type: Number },
    time: { type: String },
    img: { type: String },
    video_url: { type: String },
    
    // Chuyển JSON thành mảng String
    ingredients: [{ type: String }], 
    steps: [{ type: String }],
    
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    is_premium: { type: Boolean, default: false },
    
    // Trỏ tới các bài đánh giá để đếm số sao trung bình dễ hơn
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }]
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);