import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import RecipeCard from '../components/RecipeCard'; 
import EditProfileModal from '../components/modals/EditProfileModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import Toast from '../components/Toast';
const ProfilePage = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const myId = parseInt(localStorage.getItem('eatdish_user_id'));
    const [activeTab, setActiveTab] = useState('recipes');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const isOwner = parseInt(id) === myId;

    // State quản lý dữ liệu và Modal
    const [profileUser, setProfileUser] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [cookedHistory, setCookedHistory] = useState([]);

    //  Tải dữ liệu
    useEffect(() => {
    const fetchData = async () => {
        try {
        setIsLoading(true);

        const resUser = await axiosClient.get(
            `/users/${id}?viewerId=${myId}`
        );

        setProfileUser(resUser.data);
        if (isOwner && resUser.data.is_premium === 1) {
            const currentUserLocal = JSON.parse(localStorage.getItem('user'));
            if (currentUserLocal && currentUserLocal.is_premium !== 1) {
                currentUserLocal.is_premium = 1;
                localStorage.setItem('user', JSON.stringify(currentUserLocal));
                window.location.reload(); 
            }
        }

        const [resRecipes, resFav] = await Promise.all([
            axiosClient.get(`/recipes?userId=${id}`),
            axiosClient.get(`/recipes/favorites/${myId}`)
        ]);

        setRecipes(resRecipes.data);
        setFavorites(resFav.data.map(f => f.id));
        //lấy lịch sử
        const res = await axiosClient.get(`/recipes/cooked-history/${id}`);
        setCookedHistory(res.data);

        } catch (err) {
        if (err.response?.status === 403 || err.response?.status === 404) {
            navigate('/not-found', { replace: true });
            return; 
        }
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
    if (id) fetchData();
    }, [id, myId]);


    // Xử lý yêu thích
    const handleToggleFavorite = async (recipeId) => {
        try {
            const res = await axiosClient.post('/recipes/favorites/toggle', { userId: myId, recipeId });
            if (res.data.status === 'liked') setFavorites(prev => [...prev, recipeId]);
            else setFavorites(prev => prev.filter(favId => favId !== recipeId));
        } catch (err) { console.log(err); }
    };

    // Xử lý Follow
    const handleFollowUser = async () => {
        try {
            await axiosClient.post('/users/follow', { followerId: myId, followedId: id });
            setProfileUser(prev => ({
                ...prev,
                is_following: !prev.is_following,
                stats: {
                    ...prev.stats,
                    followers: prev.is_following ? prev.stats.followers - 1 : prev.stats.followers + 1
                }
            }));
        } catch (e) { console.log(e); }
    };

    // Hàm Chặn/Bỏ chặn
    const executeBlockAction = async () => {
        try {
            if (isBlocked) {
                await axiosClient.post('/users/unblock', { blockerId: myId, blockedId: id });
                setSuccessMsg("Đã bỏ chặn thành công!");
                setIsBlocked(false);
            } else {
                await axiosClient.post('/users/block', { blockerId: myId, blockedId: id });
                navigate('/not-found'); 
            }
        } catch (err) {
            setError("Lỗi thao tác: " + (err.response?.data?.message || err.message));
        }
    };

    const handleBlockToggle = () => {
        if (!myId) return setError("Bạn cần đăng nhập để thực hiện thao tác này!");
        setIsConfirmModalOpen(true); 
    };

    if (isLoading) return <div style={{textAlign:'center', marginTop:'50px'}}>Đang tải hồ sơ... ⏳</div>;
    if (!profileUser) return <div style={{textAlign:'center', marginTop:'50px'}}>Không tìm thấy người dùng này 😔</div>;
    
    const userRecipes = recipes.filter(r => r.author_id == id);

    return (
        <div className="profile-page-container fadeIn" style={{ height: '100vh', overflowY: 'auto', backgroundColor: '#f9fafc' }}>
            
            <div className="toast-container">
                {error && (
                    <Toast 
                        type="error" 
                        message={error} 
                        onClose={() => setError('')} 
                    />
                )}
                {successMsg && (
                    <Toast 
                        type="success" 
                        message={successMsg} 
                        onClose={() => setSuccessMsg('')} 
                    />
                )}
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '20px', paddingBottom: '50px' }}>
                
                {/* --- HEADER CARD --- */}
                <div className="profile-header-card" style={{ background: '#fff', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 5px 20px rgba(0,0,0,0.03)', marginBottom: '30px', position: 'relative' }}>
                    
                    {/* Ảnh bìa */}
                    <div className="cover-photo" style={{ 
                        height: '200px', 
                        backgroundImage: `url(${profileUser.cover_img || 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=1000'})`, 
                        backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' 
                    }}>
                        {/* Nút Quay lại */}
                        <button 
                            style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '20px', cursor:'pointer' }} 
                            onClick={() => navigate(-1)}
                        >
                            ← Quay lại
                        </button>

                        {/* 👇 NÚT CHẶN  */}
                        {!isOwner && (
                            <button 
                                onClick={handleBlockToggle}
                                className="btn-block-user"
                                style={{
                                    position: 'absolute',  
                                    top: '20px',         
                                    right: '20px',         
                                    zIndex: 10,
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    backgroundColor: isBlocked ? '#636e72' : '#ff4757', 
                                    color: 'white',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                }}
                            >
                                {isBlocked ? <>🔓 Bỏ chặn</> : <>🚫 Chặn người dùng</>}
                            </button>
                        )}
                    </div>

                    <div className="profile-body" style={{ padding: '0 40px 40px 40px', position: 'relative' }}>
                        {/* Avatar */}
                        <div className="profile-avatar-container" style={{ position: 'relative', marginTop: '-50px', marginLeft: '30px' }}>
                            <img 
                                src={profileUser.avatar} 
                                alt="Avatar" 
                                style={{ 
                                    width: '120px', 
                                    height: '120px', 
                                    borderRadius: '50%', 
                                    objectFit: 'cover',
                                    border: profileUser.is_premium === 1 ? '4px solid #FFD700' : '4px solid white',
                                    boxShadow: profileUser.is_premium === 1 
                                        ? '0 0 20px rgba(255, 215, 0, 0.8)'
                                        : '0 4px 10px rgba(0,0,0,0.1)' 
                                }} 
                            />
                            
                            {(profileUser.is_premium == 1 || profileUser.is_premium === true) && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '5px',
                                    right: '5px',
                                    background: '#fff',
                                    borderRadius: '50%',
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                    fontSize: '18px'
                                }}>
                                    👑
                                </div>
                            )}
                        </div>

                        {/* Nút Hành động (Sửa / Follow) */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
                            {isOwner ? (
                                <button 
                                    onClick={() => setIsEditModalOpen(true)} 
                                    style={{ padding: '8px 20px', borderRadius: '20px', border: '1px solid #eee', background: '#fff', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    ✏️ Chỉnh sửa hồ sơ
                                </button>
                            ) : (
                                <button 
                                    onClick={handleFollowUser}
                                    style={{ 
                                        padding: '10px 30px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                                        background: profileUser.is_following ? '#eee' : '#ff9f1c',
                                        color: profileUser.is_following ? '#333' : '#fff',
                                    }}
                                >
                                    {profileUser.is_following ? 'Đang theo dõi ✔' : '+ Theo dõi'}
                                </button>
                            )}
                        </div>

                        {/* phần Tên User */}
                        <div style={{ flex: 1 }}>
                            <h1 style={{ margin: 0, fontSize: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {profileUser.fullname}
                                
                                {profileUser.is_premium == 1 && (
                                    <span 
                                        title="Thành viên VIP Premium" 
                                        style={{ 
                                            fontSize: '24px', 
                                            filter: 'drop-shadow(0 0 5px gold)',
                                            cursor: 'help',
                                            animation: 'float 2s ease-in-out infinite'
                                        }}
                                    >
                                        👑
                                    </span>
                                )}
                            </h1>
                            
                            <p style={{ fontStyle: 'italic', color: '#888' }}>
                                {profileUser.bio || "Người dùng này chưa viết giới thiệu."}
                            </p>
                        </div>

                        {/* Thống kê */}
                        <div className="profile-stats" style={{ display: 'flex', gap: '50px', marginTop: '30px' }}>
                            <div><b style={{ fontSize: '18px', display: 'block' }}>{userRecipes.length}</b><span style={{ color: '#999', fontSize: '14px' }}>Công thức</span></div>
                            <div><b style={{ fontSize: '18px', display: 'block' }}>{profileUser.stats?.followers || 0}</b><span style={{ color: '#999', fontSize: '14px' }}>Followers</span></div>
                            <div><b style={{ fontSize: '18px', display: 'block' }}>{profileUser.stats?.following || 0}</b><span style={{ color: '#999', fontSize: '14px' }}>Following</span></div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '30px', borderBottom: '2px solid #eee', marginBottom: '20px' }}>
                    <h3 
                        onClick={() => setActiveTab('recipes')}
                        style={{ 
                            cursor: 'pointer', paddingBottom: '10px',
                            color: activeTab === 'recipes' ? '#ff9f1c' : '#999',
                            borderBottom: activeTab === 'recipes' ? '3px solid #ff9f1c' : 'none'
                        }}
                    >
                        {isOwner ? "Công thức của tôi" : `Bếp của ${profileUser.fullname}`}
                    </h3>
                    
                    <h3 
                        onClick={() => setActiveTab('history')}
                        style={{ 
                            cursor: 'pointer', paddingBottom: '10px',
                            color: activeTab === 'history' ? '#ff9f1c' : '#999',
                            borderBottom: activeTab === 'history' ? '3px solid #ff9f1c' : 'none'
                        }}
                    >
                        {isOwner ? "Lịch sử nấu nướng" : "Món đã nấu thành công"}
                    </h3>
                </div>

                <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {activeTab === 'recipes' ? (
                        // HIỂN THỊ CÔNG THỨC
                        userRecipes.length > 0 ? (
                            userRecipes.map(item => (
                                <RecipeCard 
                                    key={item.id} item={item} 
                                    isFavorite={(favorites || []).includes(item.id)}
                                    onOpenModal={(recipe) => navigate(`/recipe/${recipe.id}`)}
                                    onViewProfile={(uid) => navigate(`/profile/${uid}`)}
                                    onToggleFavorite={handleToggleFavorite}
                                />
                            ))
                        ) : (
                            <p style={{ color: '#999', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>Chưa có công thức nào.</p>
                        )
                    ) : (
                        // HIỂN THỊ LỊCH SỬ NẤU
                        cookedHistory.length > 0 ? (
                            cookedHistory.map(item => (
                                <div key={item.id} style={{ position: 'relative' }}>
                                    <RecipeCard 
                                        key={item.id} item={item} 
                                        isFavorite={(favorites || []).includes(item.id)}
                                        onOpenModal={(recipe) => navigate(`/recipe/${recipe.id}`)}
                                        onViewProfile={(uid) => navigate(`/profile/${uid}`)}
                                        onToggleFavorite={handleToggleFavorite}
                                    />
                                    {/* Nhãn đánh dấu đã nấu xong */}
                                    <div style={{ position: 'absolute', top: '10px', background: '#2ed573', color: '#fff', padding: '2px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold' }}>
                                        ✅ ĐÃ NẤU
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: '#999', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>Chưa hoàn thành món ăn nào.</p>
                        )
                    )}
                </div>
            </div>

            {isOwner && (
                <EditProfileModal 
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    currentUser={profileUser}
                    onUpdateSuccess={(updatedUser) => {
                        setProfileUser(updatedUser); 
                        setIsEditModalOpen(false);   
                    }}
                />
            )}
            <ConfirmModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={executeBlockAction}
                title={isBlocked ? "Bỏ chặn người dùng" : "Chặn người dùng"}
                message={isBlocked 
                    ? "Bạn có chắc chắn muốn bỏ chặn người dùng này để xem lại công thức của họ?" 
                    : "Nếu chặn, bạn sẽ không thể xem hồ sơ này và họ cũng không thể xem bài đăng của bạn."
                }
            />
            
        </div>
        
    );
    
};

export default ProfilePage;