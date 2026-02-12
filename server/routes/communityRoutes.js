const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/', communityController.getAllPosts);
router.post('/', upload.single('image'), communityController.createPost);
router.post('/like', communityController.toggleLike);
router.post('/comment', communityController.addComment);
router.get('/comments/:postId', communityController.getComments);
router.delete('/:id', communityController.deletePost);
router.put('/:id', upload.single('image'), communityController.updatePost);

module.exports = router;