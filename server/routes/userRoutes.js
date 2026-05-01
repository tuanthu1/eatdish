const express = require('express');
const router = express.Router();

//  IMPORT AUTH MIDDLEWARE 
const { verifyToken } = require('../middleware/auth'); 

// Cấu hình lưu trữ ảnh
const upload = require('../middleware/upload');

// Import Controller
const userController = require('../controllers/userController');

// API Lấy Top Chef
router.get('/top-chefs', userController.getTopChefs);
router.get('/blocked', userController.getBlockedUsers);
router.post('/block', userController.blockUser);
router.post('/unblock', userController.unblockUser);
router.get('/:id/followers', userController.getFollowers);
router.get('/:id/following', userController.getFollowing);
router.get('/blocks', userController.getMutualBlockIds);
// Cập nhật hồ sơ 
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

// Báo cáo người dùng
router.post('/report', verifyToken, userController.reportUser);

module.exports = router;