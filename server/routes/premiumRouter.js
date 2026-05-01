const express = require('express');
const router = express.Router();
const premiumController = require('../controllers/premiumController');
const {verifyToken} = require('../middleware/auth');
router.get('/packages', premiumController.getAllPackages);
router.get('/status', verifyToken, premiumController.getUserPremiumStatus);
module.exports = router;