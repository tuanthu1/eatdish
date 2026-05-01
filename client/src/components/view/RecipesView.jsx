import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RecipeCard from '../RecipeCard';
import axiosClient from '../../api/axiosClient';
import '../../index.css';

const getRecipeImage = (recipe) => recipe?.img || recipe?.image || recipe?.image_url || recipe?.thumbnail || '';

const RecipesView = ({ recipes, favorites, handleToggleFavorite, setSelectedRecipe, handleViewProfile, categoryOptions = [], onCategorySelect, onClearCategory, currentCategory = 'all', currentKeyword }) => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [bannerList, setBannerList] = useState([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [showAllCategoryView, setShowAllCategoryView] = useState(false);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await axiosClient.get('/settings/recipe-classifications');
                if (res?.data?.categories?.length > 0) {
                    setCategories(res.data.categories);
                }
            } catch (error) {
                console.log('Lỗi tải danh mục từ DB:', error);
            }
        };
        loadCategories();
    }, []);

    useEffect(() => {
        const loadBanner = async () => {
            try {
                const res = await axiosClient.get('/settings/recipe-banners');
                if (res?.data?.banners?.length > 0) setBannerList(res.data.banners);
            } catch (error) { console.log('Lỗi tải banner:', error); }
        };
        loadBanner();
    }, []);

    useEffect(() => {
        if (bannerList.length <= 1) return;
        const timer = setInterval(() => {
            setActiveIdx(prev => (prev === bannerList.length - 1 ? 0 : prev + 1));
        }, 10000);
        return () => clearInterval(timer);
    }, [bannerList]);

    const currentImg = bannerList.length > 0 ? bannerList[activeIdx]?.imageUrl : '';

    const handleBannerClick = () => {
        const activeBanner = bannerList[activeIdx];
        if (!activeBanner) return;
        if (activeBanner.targetLink?.trim()) {
            activeBanner.targetLink.startsWith('http') ? window.open(activeBanner.targetLink, '_blank') : navigate(activeBanner.targetLink);
            return;
        }
        if (activeBanner.recipeId?.trim()) {
            const targetRecipe = recipes.find(r => String(r._id || r.id) === String(activeBanner.recipeId));
            if (targetRecipe) setSelectedRecipe(targetRecipe);
        }
    };

    const handleRecipeClick = (recipe) => {
        const recipeId = recipe?._id || recipe?.id;
        if (!recipeId) return;

        if (currentKeyword?.trim()) {
            axiosClient.post('/recipes/track-search', {
                keyword: currentKeyword,
                recipeId
            }).catch(err => console.log("Lỗi tracking:", err));
        }
        if (recipe.category && recipe.category !== 'Khac') {
            let viewHistory = JSON.parse(localStorage.getItem('eatdish_prefs') || '[]');
            viewHistory.unshift(recipe.category); // Đẩy thể loại vừa xem lên đầu mảng
            viewHistory = [...new Set(viewHistory)].slice(0, 3); // Lọc trùng, chỉ nhớ 3 thể loại gần nhất
            localStorage.setItem('eatdish_prefs', JSON.stringify(viewHistory));
        }
        navigate(`/recipe/${recipeId}`);
    };
    // --- NẾU ĐANG TÌM KIẾM: HIỂN THỊ TRANG KẾT QUẢ RIÊNG BIỆT ---
    if (currentKeyword && currentKeyword.trim() !== '') {
        // Tách 3 thằng đầu tiên làm Top Hot, phần còn lại đẩy xuống dưới
        const topRecipes = recipes.slice(0, 3);
        const restRecipes = recipes.slice(3);

        return (
            <div id="view-recipes" className="fadeIn search-result-wrapper">
                <div className="search-result-header">
                    <h2 className="search-result-title">
                        <span className="search-result-label">Từ khóa:</span> <span className="search-result-keyword">"{currentKeyword}"</span>
                    </h2>
                    <span className="search-result-count">Tìm thấy {recipes.length} công thức</span>
                </div>

                {topRecipes.length > 0 && (
                    <div className="top-search-section">
                        <h3 className="top-search-title">
                            👑 Công thức '{currentKeyword}' được yêu thích nhất
                        </h3>
                        {/* Tái sử dụng class product-grid có sẵn của mày cho gọn */}
                        <div className="product-grid">
                            {topRecipes.map((item, index) => {
                                // Tự động gắn class rank 1, 2, 3
                                const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : 'rank-3';
                                return (
                                    <div key={item.id || item._id} className="top-search-item">
                                        <div className={`top-search-badge ${rankClass}`}>
                                            {index + 1}
                                        </div>
                                        <RecipeCard
                                            item={item}
                                            isFavorite={favorites.includes(String(item._id || item.id))}
                                            onToggleFavorite={handleToggleFavorite}
                                            onOpenModal={handleRecipeClick}
                                            onViewProfile={handleViewProfile}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {restRecipes.length > 0 && (
                    <>
                        <h3 className="rest-search-title">Tất cả kết quả khác</h3>
                        <div className="product-grid">
                            {restRecipes.map(item => (
                                <RecipeCard
                                    key={item.id || item._id}
                                    item={item}
                                    isFavorite={favorites.includes(String(item._id || item.id))}
                                    onToggleFavorite={handleToggleFavorite}
                                    onOpenModal={handleRecipeClick}
                                    onViewProfile={handleViewProfile}
                                />
                            ))}
                        </div>
                    </>
                )}

                {recipes.length === 0 && (
                    <div className="empty-state search-empty-state">
                        <img src="https://cdn-icons-png.flaticon.com/512/7465/7465679.png" alt="Not found" className="search-empty-img" />
                        <h3>Ôi không! Không tìm thấy công thức nào.</h3>
                        <p className="search-empty-text">Thử tìm kiếm với một từ khóa khác xem sao nhé.</p>
                    </div>
                )}
            </div>
        );
    }

    // --- NẾU KHÔNG TÌM KIẾM: TRẢ VỀ GIAO DIỆN TRANG CHỦ BÌNH THƯỜNG ---
    const normalizedCategories = categories
        .filter(item => item && item.value && item.value !== 'all');

    const featuredCategoryCards = normalizedCategories
        .slice(0, 4)
        .map((category) => {
            const matchedRecipe = recipes.find(recipe => String(recipe.category || 'Khac') === String(category.value));
            // Ưu tiên: ảnh từ DB > ảnh từ recipe trùng khớp
            const image = category.imageUrl || getRecipeImage(matchedRecipe) || '';
            return { ...category, image };
        });

    const allCategoryCards = normalizedCategories
        .map((category) => {
            const matchedRecipe = recipes.find(recipe => String(recipe.category || 'Khac') === String(category.value));
            // Ưu tiên: ảnh từ DB > ảnh từ recipe trùng khớp
            const image = category.imageUrl || getRecipeImage(matchedRecipe) || '';
            return { ...category, image };
        });

    return (
        <div id="view-recipes" className="fadeIn">
            {/* Banner & Categories */}
            <div className="home-hero-wrap">
                <div className="main-carousel-container" onClick={handleBannerClick} style={{ cursor: bannerList.length > 0 ? 'pointer' : 'default' }}>
                    {currentImg ? (
                        <div className="carousel-image-wrapper">
                            <img src={currentImg} alt="Banner" className="carousel-active-img" />
                        </div>
                    ) : (
                        <div className="carousel-empty-state">
                            <div><p className="carousel-empty-kicker">EatDish</p><h1>Khám phá món ngon</h1></div>
                        </div>
                    )}
                </div>

                <div className="home-category-section">
                    <div className="section-header home-section-header">
                        <div><h2>{showAllCategoryView ? 'Tất cả danh mục' : 'Danh mục nổi bật'}</h2></div>
                        <div className="home-category-actions">
                            {currentCategory && currentCategory !== 'all' && (
                                <button
                                    type="button"
                                    className="home-category-clear-btn"
                                    onClick={() => onClearCategory?.()}
                                >
                                    Xóa lọc danh mục đã chọn
                                </button>
                            )}
                            <button
                                type="button"
                                className="home-category-view-all"
                                onClick={() => setShowAllCategoryView(prev => !prev)}
                            >
                                {showAllCategoryView ? 'Thu gọn danh mục' : 'Xem tất cả danh mục'}
                            </button>
                        </div>
                    </div>

                    {!showAllCategoryView && featuredCategoryCards.length > 0 && (
                        <div className="home-category-grid">
                            {featuredCategoryCards.map((category) => (
                                <button
                                    key={category.value}
                                    className={`home-category-card ${currentCategory === category.value ? 'active' : ''}`}
                                    onClick={() => onCategorySelect?.(category.value)}
                                >
                                    <img src={category.image || null} alt={category.label} className="home-category-image" />
                                    <div className="home-category-overlay" />
                                    <span className="home-category-label">{category.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {showAllCategoryView && allCategoryCards.length > 0 && (
                        <div className="home-category-grid home-category-grid-all">
                            {allCategoryCards.map((category) => (
                                <button
                                    key={category.value}
                                    className={`home-category-card ${currentCategory === category.value ? 'active' : ''}`}
                                    onClick={() => {
                                        onCategorySelect?.(category.value);
                                        setShowAllCategoryView(false);
                                    }}
                                >
                                    <img src={category.image || null} alt={category.label} className="home-category-image" />
                                    <div className="home-category-overlay" />
                                    <span className="home-category-label">{category.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="section-header"><h2>Công thức đề xuất</h2></div>
            <div className="product-grid">
                {recipes.map(item => (
                    <RecipeCard
                        key={item.id || item._id}
                        item={item}
                        isFavorite={favorites.includes(String(item._id || item.id))}
                        onToggleFavorite={handleToggleFavorite}
                        onOpenModal={handleRecipeClick}
                        onViewProfile={handleViewProfile}

                    />
                ))}
            </div>
        </div>
    );
};

export default RecipesView;