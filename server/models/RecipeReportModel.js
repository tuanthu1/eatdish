const mongoose = require('mongoose');

const recipeReportSchema = new mongoose.Schema({
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedRecipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('RecipeReport', recipeReportSchema);
