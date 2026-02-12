const express = require('express');
const router = express.Router();
const multer = require('multer');

//  IMPORT AUTH MIDDLEWARE 
const verifyToken = require('../middleware/auth'); 

// Cấu hình lưu trữ ảnh
const upload = multer({ dest: 'uploads/' });

// Import Controller
const userController = require('../controllers/userController');

// CÁC ROUTE CHO USER

// API Lấy Top Chef
router.get('/top-chefs', userController.getTopChefs);
router.get('/blocked', userController.getBlockedUsers);
router.post('/block', userController.blockUser);
router.post('/unblock', userController.unblockUser);

// 3. Cập nhật hồ sơ 
router.put('/update', 
    verifyToken,
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'cover_img', maxCount: 1 }
    ]), 
    userController.updateProfile
);

// Lấy thông tin hồ sơ 
router.get('/:id', userController.getUserProfile);


// Xóa tài khoản
router.delete('/:id', userController.deleteUser);

// Theo dõi / Hủy theo dõi
router.post('/follow', userController.toggleFollow);
// đổi mật khẩu
router.put('/change-password', userController.changePassword);

module.exports = router;