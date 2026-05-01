import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import PremiumModal from '../components/modals/PremiumModal';
import '../index.css';
import { Bell, Crown, Trophy, Flame, Heart } from 'lucide-react';
const RightSidebar = ({ user, unreadCount, notifications, showNotifDropdown, handleToggleNotifications, handleLogout, onOpenPremium }) => {
    const navigate = useNavigate();
    const [topChefs, setTopChefs] = useState([]);
    const [trending, setTrending] = useState([]);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const notifRef = useRef(null);
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        setIsGuest(!storedUser || JSON.parse(storedUser).id === null);
    }, []);

   useEffect(() => {
        const userIdParam = user?.id ? `?userId=${user.id}` : '';

        const fetchSidebarData = async () => {
            try { 
                const [resTopChefs, resTrending] = await Promise.all([
                    axiosClient.get(`/users/top-chefs${userIdParam}`),
                    axiosClient.get(`/recipes/trending${userIdParam}`)
                ]);
                setTopChefs(resTopChefs.data); 
                setTrending(resTrending.data); 
            } 
            catch (err) { 
                console.log("Lỗi lấy dữ liệu Cột phải:", err); 
            }
        };

        fetchSidebarData();
    }, [user?.id]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showNotifDropdown && notifRef.current && !notifRef.current.contains(event.target)) {
                handleToggleNotifications(); 
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showNotifDropdown, handleToggleNotifications]);

    const handleOpenProfile = (id) => {
        if (isGuest) return navigate('/not-found');
        navigate(`/profile/${id}`);
    };

    const handleUpgradeSuccess = () => {
        const updatedUser = { ...user, is_premium: 1 };
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const handleOpenRecipeDetail = (recipe) => {
        const recipeId = recipe?._id || recipe?.id;
        if (!recipeId) return;
        navigate(`/recipe/${recipeId}`);
    };

    return (
        <aside className={`sidebar-right-panel ${isPremiumModalOpen ? 'z-max' : ''}`}>
            <div className="user-panel-header">
                {!isGuest && (
                    <div onClick={onOpenPremium} className="mobile-header-premium">
                        <Crown color='#ff9f1c'/> VIP
                    </div>
                )}
                <div className="rs-notif-wrapper" ref={notifRef}>
                    <span 
                        onClick={handleToggleNotifications} 
                        className="rs-notif-icon">
                        <Bell fill='#f1c40f' color='#f1c40f'/>
                    </span>
                    {unreadCount > 0 && (
                        <div className="rs-notif-badge">
                            {unreadCount}
                        </div>
                    )}
                    
                    {showNotifDropdown && (
                        <div className="rs-notif-dropdown show fadeIn">
                            <div className="rs-notif-header">Thông báo mới</div>
                            <div className="rs-notif-list">
                                {notifications.length > 0 ? notifications.map(n => (
                                    <div key={n.id} className={`rs-notif-item ${n.is_read ? 'read' : 'unread'}`}>
                                        {n.message}
                                        <div className="rs-notif-date">{new Date(n.created_at).toLocaleDateString()}</div>
                                    </div>
                                )) : <div className="rs-notif-empty">Không có thông báo.</div>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Phần Avatar + Tên */}
                <div 
                    onClick={() => navigate(`/profile/${user.id}`)} 
                    className="rs-user-profile-trigger">
                    <div className="rs-avatar-wrapper">
                        <img src={user.avatar} className={`rs-avatar-img ${user.is_premium === 1 ? 'premium' : ''}`} alt="Avatar" />
                    </div>
                    
                    <span className="rs-user-name" >
                        {user.fullname}
                        {(user.is_premium == 1 || user.is_premium === true) && <span title="Thành viên VIP" ><Crown  size={18} color='#ff9f1c'/></span>}
                    </span>
                </div>

                {/* Nút Đăng xuất */}
                {isGuest ? (
                    <div className="rs-auth-links">
                        <span onClick={() => navigate('/login-register')} className="rs-auth-text" >Đăng Nhập</span>
                    </div>
                ) : (
                    <div onClick={handleLogout} className="rs-auth-links">
                        <span className="rs-auth-text">Đăng xuất</span>
                    </div>
                )}
            </div>

            <div className="default-right-view fadeIn">
                {/* TOP CHEF */}
                <div className="top-chef-section">
                    <div className="top-chef-header">
                        <h3 className="top-chef-title"><Trophy /> Top Đầu Bếp</h3>
                    </div>

                    {user && user.is_premium !== 1 && (
                        <div onClick={() => setIsPremiumModalOpen(true)} className="rs-floating-premium-btn">
                            <span><Crown color='#ff9f1c'/></span> 
                        </div>
                    )}

                    {topChefs.length > 0 ? topChefs.map((chef, idx) => (
                        <div key={chef.id} onClick={() => handleOpenProfile(chef.id)} className="top-chef-item">
                            <div className="top-chef-rank">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: idx === 0 ? 'linear-gradient(135deg, #f1c40f, #f39c12)' : 
                                                    idx === 1 ? 'linear-gradient(135deg, #d3d9df, #bdc3c7)' : 
                                                                'linear-gradient(135deg, #e67e22, #d35400)',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '900',
                                        fontSize: '16px',
                                        boxShadow: '0 3px 6px rgba(0,0,0,0.15)',
                                        border: '2px solid #fff',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                    }}>
                                        {idx + 1}
                                    </div>
                                </div>
                            </div>
                            <img src={chef.avatar || "https://ui-avatars.com/api/?name=" + chef.username} alt="" className="top-chef-avatar" />
                            <div className="top-chef-info">
                                <div className="top-chef-name">{chef.fullname || chef.username}</div>
                                <span className="stats">{chef.recipe_count || chef.total_recipes || chef.stats?.recipes || 0} công thức</span>
                            </div>
                        </div>
                    )) : (
                        <div className="top-chef-empty">Chưa có dữ liệu xếp hạng</div>
                    )}
                </div>
            </div>

            {/* MÓN ĐANG HOT */}
            <div className="scrollable-hot-section">
                <div className="trending-header-sticky">
                    <h2 className="trending-title"><Flame fill='#ff4800' color='#ff4800'/> Đang Hot</h2>
                </div>
                
                <div className="hot-list">
                    {trending.length > 0 ? trending.map((item) => (
                        <div className="trending-item-card" onClick={() => handleOpenRecipeDetail(item)} key={item.id}>
                            <img src={item.img} className="trending-img" alt={item.name} />
                            <div className="trending-info">
                                <h4 className="trending-item-name">{item.name || item.title}</h4>
                                <p className="trending-item-likes">
                                    <Heart size={20} color={"#ff4757"} fill={"#ff4757"} style={{ transition: 'all 0.2s ease-in-out' }}/>   
                                    {/* Thêm bọc lót cho chắc */}
                                    {item.total_likes || item.favorites_count || 0} lượt thích
                                </p>
                            </div>
                        </div>
                    )) : (
                        <p className="trending-empty-msg">Chưa có món ăn nào được yêu thích...</p>
                    )}
                </div>

                <PremiumModal 
                    isOpen={isPremiumModalOpen} 
                    onClose={() => setIsPremiumModalOpen(false)}
                    user={user} onUpgradeSuccess={handleUpgradeSuccess}
                />
            </div>
        </aside>
    );
};
export default RightSidebar;