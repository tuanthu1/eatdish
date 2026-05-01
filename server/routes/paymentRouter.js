const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const {verifyToken} = require("../middleware/auth");

router.post("/create", verifyToken, paymentController.createPaymentLink);
router.post("/webhook", paymentController.handleWebhook);
router.post('/check-coupon', verifyToken, paymentController.checkCoupon);
router.post('/verify-return', verifyToken, paymentController.verifyReturn);
module.exports = router;