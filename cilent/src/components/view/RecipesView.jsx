import React from 'react';
import RecipeCard from '../RecipeCard';

const RecipesView = ({ recipes, favorites, handleToggleFavorite, setSelectedRecipe, handleViewProfile }) => {
    return (
        <div id="view-recipes" className="fadeIn">
            <div className="banner" >
                <div className="banner-text"><h1>Khám phá món mới</h1><p>Hàng ngàn công thức nấu ăn đang chờ bạn.</p></div>
                <img src="https://spicyfoodstudio.com/wp-content/uploads/2023/04/chup-anh-voi-do-an-05.jpg" className="banner-img" style={{borderRadius: '50%', border: '4px solid #fff'}} alt="recipe-banner" />
            </div>
            <div className="section-header"><h2>Món ăn đề xuất</h2></div>
            <div className="product-grid">
                {recipes.map(item => (
                    <RecipeCard 
                        key={item.id} 
                        item={item} 
                        isFavorite={favorites.includes(item.id)} 
                        onToggleFavorite={handleToggleFavorite} 
                        onOpenModal={setSelectedRecipe} 
                        onViewProfile={handleViewProfile} 
                    />
                ))}
            </div>
        </div>
    );
};

export default RecipesView;