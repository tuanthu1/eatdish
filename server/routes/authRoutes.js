const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
router.get('/me', verifyToken, authController.getMe);
// Đăng nhập
router.post('/login', authController.login);
// Đăng ký 
router.post('/register', authController.register);
router.put('/change-password', authController.changePassword);
router.get("/verify-email", authController.verifyEmail);
router.post('/check-user', authController.checkUser);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/google', authController.googleLogin);
router.post('/logout', authController.logout);
module.exports = router;