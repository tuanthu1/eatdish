const mongoose = require('mongoose');

const siteSettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    recipe_banners: [{
        imageUrl: { 
            type: String, 
            required: true 
        },
        targetLink: { 
            type: String, 
            default: ''
        }
    }],
}, { timestamps: true });

module.exports = mongoose.model('SiteSetting', siteSettingSchema);
