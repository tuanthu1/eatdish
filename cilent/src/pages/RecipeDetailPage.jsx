import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import RecipeReviews from '../components/RecipeReviews';
import PremiumModal from '../components/modals/PremiumModal';

const RecipeDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState(null);
    const [isFavorited, setIsFavorited] = useState(false);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

    // Lấy thông tin user
    const userStr = localStorage.getItem('user') || localStorage.getItem('eatdish_user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const myId = localStorage.getItem('eatdish_user_id');
    
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const reviewsRef = useRef(null);

    //  KIỂM TRA KHÓA 
    const isAdmin = currentUser?.role === 'admin' || localStorage.getItem('eatdish_user_role') === 'admin';
    const isRecipeVip = (recipe?.is_premium == 1 || recipe?.is_vip == 1);
    const isLocked = isRecipeVip && (!currentUser || currentUser.is_premium != 1) && !isAdmin;

    useEffect(() => {
        setError('');
        setSuccessMsg('');
        setIsLoading(true);

        const fetchRecipe = async () => {
            try {
                const res = await axiosClient.get(`/recipes/${id}`); 
                setRecipe(res.data);

                if(myId) {
                    const resFavorite = await axiosClient.get(`/recipes/favorites/${myId}`);
                    const listFavorite = resFavorite.data.map(f => f.id);
                    if(listFavorite.includes(parseInt(id))) setIsFavorited(true);
                }
            } catch (err) {
                console.log("Lỗi tải trang chi tiết:", err);
                setError("Không thể tải thông tin món ăn.");
            } finally {
                setIsLoading(false);
            }
        };
        if (!myId) {
            setError("Bạn cần đăng nhập để xem công thức này!");
            setIsLoading(false);
            navigate('/login');
            return;
        }
        fetchRecipe();
    }, [id, myId]);

    const handleToggleFavorite = async () => {
        if(!myId) return setError("Bạn cần đăng nhập để thực hiện chức năng này!");
        try {
            await axiosClient.post('/recipes/favorites/toggle', { userId: myId, recipeId: id });
            setIsFavorited(!isFavorited);
            setSuccessMsg(isFavorited ? "Đã bỏ lưu món ăn" : "Đã lưu vào yêu thích");
        } catch(e) { setError("Lỗi kết nối."); }
    };

    const handleCookDone = async () => {
        if (!myId) return setError("Bạn cần đăng nhập để lưu lịch sử!");
        try {
            await axiosClient.post('/recipes/cooked', { userId: myId, recipeId: id });            
            let countdown = 4;
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
                    setSuccessMsg(`Chúc mừng bạn đã hoàn thành món ăn! ❤️`);
                } else {
                    clearInterval(countdownInterval);
                    navigate('/');
                }
            }, 1000);
        } catch (err) { setError("Không thể lưu lịch sử nấu nướng."); }
    };

    const safeParse = (data) => {
        try {
            if (Array.isArray(data)) return data;
            if (typeof data === 'string') return JSON.parse(data);
            return [];
        } catch (e) { return []; }
    };

    if (isLoading) return <div style={{padding:'50px', textAlign:'center'}}>Đang tìm công thức ngon... 🍜</div>;
    if (!recipe) return <div style={{padding:'50px', textAlign:'center'}}>Không tìm thấy món ăn này 😔</div>;

    return (
        <div style={{ background:'#fdfdfd', minHeight: '100vh', paddingBottom: '50px' }}>
            {/* Thông báo  */}
            {(error || successMsg) && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 10000,
                    padding: '15px 25px', borderRadius: '12px',
                    background: error ? '#ff4757' : '#2ed573', color: '#fff',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.2)', fontWeight: '600'
                }}>
                    <span>{error ? '⚠️' : '✅'}</span> {error || successMsg}
                </div>
            )}

            {/* Header  */}
            <div style={{ padding: '15px 30px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background:'white', position: 'sticky', top: '0', zIndex: 100 }}>
                <button onClick={() => navigate(-1)} style={{ border:'none', background:'none', fontSize:'16px', cursor:'pointer', fontWeight:'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    ← Quay lại
                </button>
                <h2 style={{ margin: 0, color:'#ff9f1c', fontSize: '18px' }}>{recipe.title || recipe.name}</h2>
                <div style={{ width: '80px' }}></div> 
            </div>

            <div style={{ maxWidth: '1000px', margin: '20px auto', display: 'flex', gap: '30px', flexWrap: 'wrap', padding: '0 20px' }}>
                
                {/*CỘT TRÁI */}
                <div style={{ flex: '1 1 400px' }}>
                    <div style={{ 
                        position: 'relative', 
                        borderRadius: '20px', 
                        overflow: 'hidden', 
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)', 
                        height: '400px', 
                        background: '#000' 
                    }}>
                        
                        {isLocked ? (
                            <>
                                <img 
                                    src={recipe.img || recipe.image || recipe.image_url} 
                                    alt={recipe.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(15px)', opacity: 0.8 }}
                                />
                                <div style={{ 
                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                                    color: 'white', textAlign: 'center', zIndex: 2 
                                }}>
                                    <div style={{ fontSize: '60px' }}>🔒</div>
                                    <h3 style={{ margin: '10px 0' }}>Video Premium</h3>
                                    <p style={{ fontSize: '14px', opacity: 0.9 }}>Nâng cấp VIP để xem hướng dẫn</p>
                                </div>
                            </>
                        ) : (
                            (recipe.video_url || recipe.youtube_link) ? (
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    src={(() => {
                                        const url = recipe.video_url || recipe.youtube_link;
                                        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                                        const match = url.match(regExp);
                                        return (match && match[2].length === 11) 
                                            ? `https://www.youtube.com/embed/${match[2]}?autoplay=0` 
                                            : url;
                                    })()}
                                    title="Recipe Video" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                    style={{ display: 'block' }}
                                ></iframe>
                            ) : (
                                <img 
                                    src={recipe.img || recipe.image || recipe.image_url} 
                                    alt={recipe.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            )
                        )}
                        {isRecipeVip && (
                            <div style={{ 
                                position: 'absolute', top: '20px', right: '20px', 
                                background: 'linear-gradient(45deg, #FFD700, #FFA500)', 
                                color: 'white', padding: '8px 15px', borderRadius: '20px', 
                                fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', zIndex: 10 
                            }}>
                                👑 PREMIUM
                            </div>
                        )}
                    </div>
                </div>

                {/* CỘT PHẢI */}
                <div style={{ flex: '1 1 500px', background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                    
                    {/* LỚP PHỦ KHÓA */}
                    {isLocked && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(255, 255, 255, 0.85)', 
                            backdropFilter: 'blur(8px)',
                            zIndex: 10,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            textAlign: 'center', padding: '20px'
                        }}>
                            <div style={{ fontSize: '60px', marginBottom:'10px' }}>🔒</div>
                            <h2 style={{ color: '#2d3436', margin:'0 0 10px 0' }}>Công thức dành cho VIP</h2>
                            <p style={{ color: '#636e72', marginBottom:'20px' }}>Nâng cấp tài khoản để xem chi tiết nguyên liệu và cách làm.</p>
                            
                            <button onClick={() => setIsPremiumModalOpen(true)} style={{ background: 'linear-gradient(45deg, #FFD700, #FFA500)', border: 'none', padding: '12px 30px', color: '#fff', fontWeight: 'bold', borderRadius: '30px', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 15px rgba(255, 165, 0, 0.4)' }}>
                                👑 Mở khóa ngay
                            </button>
                        </div>
                    )}

                    {/* NỘI DUNG CHÍNH */}
                    <div style={{ filter: isLocked ? 'blur(8px)' : 'none', userSelect: isLocked ? 'none' : 'text' }}>
                        
                        {/* Tác giả */}
                        <div onClick={(e) => {
                            e.stopPropagation();
                            navigate('/', { state: { viewProfileId: recipe.author_id || recipe.user_id } }); 
                        }}
                         style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', cursor: 'pointer', transition: 'background 0.2s', borderRadius: '10px', padding: '10px'}}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f9f9f9'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                            <img src={recipe.author_avatar || `https://ui-avatars.com/api/?name=${recipe.author_name || 'User'}`} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                            <div>
                                <span style={{ fontSize: '12px', color: '#888', display: 'block' }}>Công thức bởi</span>
                                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{recipe.author_name || recipe.fullname}</span>
                            </div>
                        </div>

                        {/*  Nguyên liệu  */}
                        <div style={{ marginBottom: '25px' }}>
                            <h3 style={{ color: '#ff9f1c', borderLeft: '4px solid #ff9f1c', paddingLeft: '10px', margin: '0 0 15px 0' }}>🛒 Nguyên liệu</h3>
                            {!isLocked ? (
                                <ul style={{ background: '#fffcf5', padding: '20px 20px 20px 40px', borderRadius: '15px', border: '1px solid #ffeaa7', lineHeight: '1.8' }}>
                                    {safeParse(recipe.ingredients).map((ing, i) => <li key={i}>{ing}</li>)}
                                </ul>
                            ) : <p style={{ color: '#999', fontStyle: 'italic', padding: '10px' }}>🔒 Nội dung đã bị ẩn.</p>}
                        </div>

                        {/*  Cách làm  */}
                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ color: '#2d3436', borderLeft: '4px solid #2d3436', paddingLeft: '10px', margin: '0 0 15px 0' }}>👨‍🍳 Cách làm</h3>
                            {!isLocked ? (
                                <div>
                                    {safeParse(recipe.steps || recipe.instructions).map((step, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                            <div style={{ flexShrink: 0, width: '28px', height: '28px', background: '#2d3436', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize:'14px' }}>{i + 1}</div>
                                            <div style={{ lineHeight: '1.6', fontSize: '15px', color: '#444' }}>{step}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p style={{ color: '#999', fontStyle: 'italic', padding: '10px' }}>🔒 Nội dung đã bị ẩn.</p>}
                        </div>

                         <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={handleCookDone} disabled={isLocked} style={{ flex: 1, padding:'15px', background: isLocked ? '#ccc' : '#ff9f1c', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', cursor: isLocked ? 'not-allowed' : 'pointer', fontSize: '16px', transition: '0.3s' }}>
                                ✅ Đã nấu xong!
                            </button>
                            <button onClick={handleToggleFavorite} style={{ width: '60px', borderRadius: '12px', border: '2px solid #ff9f1c', background: isFavorited ? '#ff9f1c' : '#fff', color: isFavorited ? '#fff' : '#ff9f1c', cursor: 'pointer', fontSize: '20px' }}>
                                {isFavorited ? '❤️' : '🤍'}         
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal mua Premium */}
            <PremiumModal 
                isOpen={isPremiumModalOpen} 
                onClose={() => setIsPremiumModalOpen(false)}
                user={currentUser || {}} 
                onUpgradeSuccess={() => window.location.reload()} 
            />

            {/* Bình luận */}
            <div ref={reviewsRef} style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
                <RecipeReviews recipeId={id} />
            </div>
        </div>
    );
};

export default RecipeDetailPage;