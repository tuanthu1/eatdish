const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

//  Các Route
router.get('/search', recipeController.searchRecipes);
router.get('/trending', recipeController.getTrendingRecipes);
router.post('/track-search', recipeController.trackSearchClick);
router.post('/report', verifyToken, recipeController.reportRecipe);

router.post('/upload', upload.single('img'), recipeController.createRecipe);
router.get('/filter', recipeController.filterRecipes);
router.get('/:id', recipeController.getRecipeById);
router.post('/reviews', recipeController.addReview);
router.post('/calculate-calories', recipeController.calculateCaloriesAI);
router.get('/:recipeId/reviews', recipeController.getRecipeReviews);
router.get('/favorites/:userId', recipeController.getUserFavorites);
router.post('/favorites/toggle', recipeController.toggleFavorite);
router.get('/cooked-history/:userId', recipeController.getCookedHistory);
router.post('/cooked', upload.single('image'), recipeController.markAsCooked);
router.put('/premium/:id', recipeController.toggleVip);
router.put('/:id', verifyToken, upload.single('image'), recipeController.updateRecipe);
router.post('/:id', verifyToken, upload.single('image'), recipeController.updateRecipe);
router.delete('/:id', verifyToken, recipeController.deleteMyRecipe);
router.get('/', recipeController.getAllRecipes);

module.exports = router;