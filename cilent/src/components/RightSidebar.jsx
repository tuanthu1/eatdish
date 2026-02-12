import React, { useState, useEffect, use } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

import PremiumModal from '../components/modals/PremiumModal';

const RightSidebar = ({ 
    user, 
    unreadCount, 
    notifications, 
    showNotifDropdown, 
    handleToggleNotifications, 
    handleLogout,
    onOpenModal
}) => {
    const navigate = useNavigate();
    const [topChefs, setTopChefs] = useState([]);
    const [trending, setTrending] = useState([]);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [isGuest, setIsGuest] = useState(false);

    // Kiểm tra nếu là user khách
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser || JSON.parse(storedUser).id === null) {
            setIsGuest(true);
        } else {
            setIsGuest(false);
        }
    }, []);

    useEffect(() => {
        axiosClient.get('/users/top-chefs')
            .then(res => setTopChefs(res.data))
            .catch(err => console.log("Lỗi lấy Top Chef:", err));

        const fetchTrending = async () => {
            try {
                const res = await axiosClient.get('/recipes/trending');
                setTrending(res.data);
            } catch (err) {
                console.log("Lỗi lấy món hot:", err);
            }
        };
        fetchTrending();
    }, []);

    const handleOpenProfile = (id) => {
        if (isGuest) {
            // Khách không được mở profile 
            navigate('/not-found');
            return;
        }
        navigate(`/profile/${id}`);
    };

    const handleUpgradeSuccess = () => {
        const updatedUser = { ...user, is_premium: 1 };
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };
    return (
        <aside className="sidebar-right" style={{ 
            height: '100vh', 
            position: 'sticky', 
            top: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden',
            backgroundColor: '#fff',
            borderLeft: '1px solid #eee',
            zIndex: isPremiumModalOpen ? 999999 : 10
        }}>
            {/*(User & Top Chefs) */}
            <div className="user-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '15px', marginBottom: '30px' }}>
                 <div className="notif-wrapper" style={{ position: 'relative', cursor: 'pointer' }}>
                    <span onClick={handleToggleNotifications} style={{ fontSize: '20px', userSelect: 'none' }}>🔔</span>
                    {unreadCount > 0 && (
                        <div className="notif-badge" style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</div>
                    )}
                    {showNotifDropdown && (
                        <div className="notif-dropdown show" style={{ position: 'absolute', top: '30px', right: '0', width: '280px', background: 'white', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden' }}>
                            <div style={{ padding: '15px', fontWeight: 'bold', borderBottom: '1px solid #eee', background: '#f8f9fa' }}>Thông báo mới</div>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {notifications.length > 0 ? notifications.map(n => (
                                    <div key={n.id} style={{ padding: '12px 15px', borderBottom: '1px solid #f0f0f0', background: n.is_read ? '#fff' : '#eaf6ff', fontSize: '13px', lineHeight: '1.5' }}>
                                        {n.message}
                                        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>{new Date(n.created_at).toLocaleDateString()}</div>
                                    </div>
                                )) : <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '13px' }}>Không có thông báo.</div>}
                            </div>
                        </div>
                    )}
                </div>

                <div onClick={() => navigate(`/profile/${user.id}`)}   style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    
                {/*  Avatar */}
                <div style={{ position: 'relative' }}>
                    <img 
                        src={user.avatar} 
                        style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '10px', 
                            objectFit: 'cover',
                            border: user.is_premium === 1 ? '2px solid #FFD700' : '1px solid #eee',
                            boxShadow: user.is_premium === 1 ? '0 0 8px rgba(255, 215, 0, 0.6)' : 'none'
                        }} 
                        alt="Avatar" 
                    />
                </div>
                {/* Tên User*/}
                <span style={{fontWeight: '600', fontSize: '12px', color: '#555', display: 'flex', alignItems: 'center'}}>
                    {user.fullname}
                    
                    {user.is_premium === 1 && (
                        <span
                            title="Thành viên VIP"
                            style={{ marginLeft: '6px', fontSize: '16px', filter: 'drop-shadow(0 0 2px gold)' }}
                        >
                            👑
                        </span>
                    )}
                    </span>
                    </div>

                    {isGuest ? (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span
                                onClick={() => navigate('/login-register')}
                                style={{  color: '#ff9f1c', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}
                            >
                                Đăng Nhập/Đăng Ký
                            </span>
                        </div>
                    ) : (
                        <div onClick={handleLogout} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: '#ff9f1c', fontWeight: '600', fontSize: '12px' }}>Đăng Xuất</span>
                        </div>
                    )}

                    </div>

                    <div className="default-right-view fadeIn">
                        
                        {/* TOP CHEF  */}
                <div className="top-chef-section" style={{ background: 'white', borderRadius: '20px', padding: '5px 15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ff9f1c' , cursor: 'pointer'}}>🏆 Top Đầu Bếp</h3>

                    </div>
                    {/* modal premium */}
                    {user && user.is_premium !== 1 && (
                        <div 
                            onClick={() => {setIsPremiumModalOpen(true);}}
                            style={{
                                position: 'fixed', bottom: '40px',
                                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                                padding: '15px 25px', borderRadius: '30px',
                                boxShadow: '0 4px 15px rgba(255, 165, 0, 0.5)',
                                cursor: 'pointer', fontWeight: 'bold', color: '#fff',
                                display: 'flex', alignItems: 'center', gap: '8px', zIndex: 9999, border: '2px solid #fff'
                            }}
                        >
                            <span>👑</span> 
                        </div>
                    )}
                    {topChefs.length > 0 ? topChefs.map((chef, idx) => (
                        <div 
                            key={chef.id} 
                            onClick={() => {navigate(`/profile/${chef.id}`); handleOpenProfile(chef.id);}}
                            style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: 'pointer' }}
                        >
                            <div style={{ width: '30px', fontSize: '22px', textAlign: 'center', marginRight: '5px' }}>
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                            </div>
                            
                            <img 
                                src={chef.avatar || "https://ui-avatars.com/api/?name=" + chef.username} 
                                alt="" 
                                style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', marginRight: '15px', border: '1px solid #eee' }} 
                            />
                            
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', fontSize: '14px', color: '#2d3436' }}>
                                    {chef.fullname || chef.username}
                                </div>
                                <div style={{ fontSize: '12px', color: '#636e72', fontWeight: 'bold' }}>
                                    ❤️ {chef.total_likes} tim
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div style={{ textAlign: 'center', color: '#999', fontSize: '13px', padding: '20px' }}>Chưa có dữ liệu xếp hạng</div>
                    )}
                </div>
            </div>
            {/* MÓN ĐANG HOT */}
            <div className="scrollable-hot-section" style={{ 
                flexGrow: 1, 
                overflowY: 'auto', 
                padding: '0 20px 20px 20px',
                borderTop: '1px solid #f5f5f5'
            }}>
                <div className="section-header" style={{ position: 'sticky', top: 0, backgroundColor: '#fff', padding: '15px 0', zIndex: 1 }}>
                    <h2 style={{ fontSize: '18px', margin: 0 }}>🔥 Đang Hot</h2>
                </div>
                
                <div className="hot-list"  >
                    {trending.length > 0 ? trending.map((item) => (
                        <div className="small-card" onClick={() => onOpenModal(item)} key={item.id} style={{ position: 'sticky', top: 0, backgroundColor: '#fff', padding: '15px 0', zIndex: 1 }}>
                            <img 
                                src={item.img} 
                                className="small-img" 
                                alt={item.name} 
                                style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }}
                                // onError={(e) => { e.target.src = 'https://via.placeholder.com/60'; }}
                            />
                            <div className="small-info">
                                <h4 style={{ fontSize: '14px', margin: '0 0 4px 0', color: '#333' }}>{item.name}</h4>
                                <p style={{ fontSize: '12px', color: '#ff4757', margin: 0, fontWeight: 'bold' }}>
                                    ❤️ {item.total_likes} lượt thích
                                </p>
                            </div>
                        </div>
                    )) : (
                        <p style={{ color: '#999', fontSize: '13px' }}>Chưa có món ăn nào được yêu thích...</p>
                    )}
                </div>
                {/* Modal Premium */}
                <PremiumModal 
                    isOpen={isPremiumModalOpen} 
                    onClose={() => setIsPremiumModalOpen(false)}
                    user={user}
                    onUpgradeSuccess={handleUpgradeSuccess}
                />
            </div>
        </aside>
    );
};

export default RightSidebar;