const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
router.get('/search', recipeController.searchRecipes);
router.get('/trending', recipeController.getTrendingRecipes);
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

//  Các Route
router.get('/', recipeController.getAllRecipes);
router.post('/upload', upload.single('img'), recipeController.createRecipe);
router.get('/filter', recipeController.filterRecipes);
router.get('/:id', recipeController.getRecipeById);
router.post('/reviews', recipeController.addReview);
router.get('/:recipeId/reviews', recipeController.getRecipeReviews);
router.get('/favorites/:userId', recipeController.getUserFavorites);
router.post('/favorites/toggle', recipeController.toggleFavorite);
router.get('/cooked-history/:userId', recipeController.getCookedHistory);
router.post('/cooked', recipeController.markAsCooked);
router.put('/premium/:id', recipeController.toggleVip);
router.delete('/:id', auth, recipeController.deleteMyRecipe);

module.exports = router;