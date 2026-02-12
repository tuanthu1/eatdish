const express = require('express');
const router = express.Router();
const premiumController = require('../controllers/premiumController');
router.get('/packages', premiumController.getAllPackages);
module.exports = router;