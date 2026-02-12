import React from 'react';
import RecipeCard from '../RecipeCard';

const FavoritesView = ({ recipes, favorites, handleToggleFavorite, setSelectedRecipe, handleViewProfile }) => {
    const favoriteRecipes = recipes.filter(r => favorites.includes(r.id));

    return (
        <div id="view-favorites" className="fadeIn">
            <div className="banner" style={{ background: '#ff7675' }}>
                <div className="banner-text">
                    <h1>Món yêu thích</h1>
                    <p>Bộ sưu tập các món ăn bạn đã lưu lại.</p>
                </div>
                <img src="https://cdn3d.iconscout.com/3d/premium/thumb/burger-5494432-4576356.png" className="banner-img" alt="fav-banner" />
            </div>
            <div className="section-header"><h2>Danh sách đã lưu ❤️</h2></div>
            <div className="product-grid">
                {favoriteRecipes.length > 0 ? favoriteRecipes.map(item => (
                    <RecipeCard 
                        key={item.id} 
                        item={item} 
                        isFavorite={true} 
                        onToggleFavorite={handleToggleFavorite} 
                        onOpenModal={setSelectedRecipe}
                        onViewProfile={handleViewProfile}
                    />
                )) : <p>Bạn chưa có món yêu thích nào.</p>}
            </div>
        </div>
    );
};

export default FavoritesView;