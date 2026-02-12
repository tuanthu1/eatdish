const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require("../middleware/auth");

router.post("/create", auth, paymentController.createPaymentLink);
router.post("/webhook", paymentController.handleWebhook);
router.post('/check-coupon', paymentController.checkCoupon);
module.exports = router;