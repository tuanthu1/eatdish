const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const upload = require('../middleware/upload');

router.get('/', communityController.getAllPosts);
router.post('/', upload.single('image'), communityController.createPost);
router.post('/like', communityController.toggleLike);
router.post('/comment', communityController.addComment);
router.get('/comments/:postId', communityController.getComments);
router.delete('/:id', communityController.deletePost);
router.delete('/comment/:id', communityController.deleteComment);
router.put('/:id', upload.single('image'), communityController.updatePost);

module.exports = router;