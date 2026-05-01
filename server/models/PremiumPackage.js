const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration_days: { type: Number, required: true },
    description: { type: String },
    benefits: [{ type: String }], // Array thay vì JSON
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('PremiumPackage', packageSchema);
