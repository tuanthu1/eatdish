const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { verifyToken, checkAdmin } = require('../middleware/auth');
const uploadCloud = require('../middleware/upload');
router.get('/maintenance', settingController.getMaintenanceStatus);
router.get('/recipe-classifications', settingController.getRecipeClassifications);
router.get('/category-images', settingController.getCategoryImages);

router.post('/maintenance/toggle', settingController.toggleMaintenanceStatus);
router.put('/notifications', verifyToken, settingController.updateNotificationSettings);
router.get('/recipe-banners', settingController.getRecipeBanner);
router.put('/recipe-banners', verifyToken, settingController.updateRecipeBanner);
router.post('/upload-banners', uploadCloud.single('image'), settingController.uploadBannerImage);
router.put('/recipe-classifications', verifyToken, checkAdmin, settingController.updateRecipeClassifications);
module.exports = router;