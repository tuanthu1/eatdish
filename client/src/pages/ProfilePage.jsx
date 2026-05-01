import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import RecipeCard from '../components/RecipeCard';
import EditProfileModal from '../components/modals/EditProfileModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import Modal from '../components/Modal';
import EditRecipeModal from '../components/modals/EditRecipeModal';
import { toast } from 'react-toastify';
import { ShieldMinus, UserLock, MapPin, Crown, CircleCheck, MessageSquareWarning } from 'lucide-react';
import '../index.css';

const ProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [myId, setMyId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const isOwner = myId ? String(id) === String(myId) : false;

    const [activeMenuUserId, setActiveMenuUserId] = useState(null);
    const [activeTab, setActiveTab] = useState('recipes');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');

    const [profileUser, setProfileUser] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [cookedHistory, setCookedHistory] = useState([]);
    const [profileFilter, setProfileFilter] = useState({ search: '', sort: 'newest' });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [recipeToDelete, setRecipeToDelete] = useState(null);
    const [isEditRecipeModalOpen, setIsEditRecipeModalOpen] = useState(false);
    const [recipeToEdit, setRecipeToEdit] = useState(null);

    const [followersList, setFollowersList] = useState([]);
    const [followingList, setFollowingList] = useState([]);
    const [isConnectionsLoaded, setIsConnectionsLoaded] = useState(false);

    // Fix lỗi author_id bị undefined do chuyển sang MongoDB
    const userRecipes = recipes.filter(r => String(r.author_id || r.user_id) === String(id));
    useEffect(() => {
        const handleClickOutside = () => setIsMenuOpen(false);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                let currentUserId = '';

                try {
                    const resAuth = await axiosClient.get('/auth/me');
                    const cUser = resAuth.data.user;
                    currentUserId = cUser._id || cUser.id;
                    setMyId(currentUserId);
                    setCurrentUser(cUser);
                } catch (authErr) {
                    console.log("Khách vãng lai đang xem hồ sơ");
                }
                const resUser = await axiosClient.get(`/users/${id}?viewerId=${currentUserId}`);
                setProfileUser(resUser.data);

                if (resUser.data.is_blocked) {
                    setIsBlocked(true);
                }

                const [resRecipes, resHistory] = await Promise.all([
                    axiosClient.get(`/recipes?userId=${id}`),
                    axiosClient.get(`/recipes/cooked-history/${id}`)
                ]);

                setRecipes(resRecipes.data);

                // Format lịch sử nấu ăn
                const formattedHistory = resHistory.data.map(item => {
                    const recipe = item.recipe || {};
                    return {
                        ...recipe,
                        ...item,
                        id: recipe._id || item.recipe_id || item.id || item._id,
                        name: recipe.name || recipe.title || item.name || item.title || 'Món ăn',
                        img: recipe.img || recipe.image || recipe.image_url || item.cooksnap_image || item.img,
                        author_id: recipe.author?._id || recipe.author || item.author_id,
                        author_name: recipe.author?.fullname || recipe.author?.username || item.author_name || item.fullname || 'Thành viên EatDish',
                        avatar: recipe.author?.avatar || item.avatar || item.author_avatar || `https://ui-avatars.com/api/?name=${recipe.author?.fullname || 'User'}&background=random`,
                        time: recipe.time || item.time,
                        calories: recipe.calories || item.calories,
                        is_premium: recipe.is_premium || item.is_premium
                    };
                });
                setCookedHistory(formattedHistory);
                if (currentUserId) {
                    try {
                        const resFav = await axiosClient.get(`/recipes/favorites/${currentUserId}`);
                        setFavorites(resFav.data.map(f => String(f.id || f._id)));
                    } catch (err) {
                        console.log("Lỗi lấy danh sách yêu thích:", err);
                    }
                } else {
                    setFavorites([]); // Khách thì mảng yêu thích trống
                }

            } catch (err) {
                if (err.response?.status === 403 || err.response?.status === 404) {
                    navigate('/not-found', { replace: true });
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchData();
    }, [id, navigate]);
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuUserId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);
    const fetchConnections = async () => {
        if (isConnectionsLoaded) return;
        try {
            const [resFollowers, resFollowing] = await Promise.all([
                axiosClient.get(`/users/${id}/followers`),
                axiosClient.get(`/users/${id}/following`)
            ]);
            setFollowersList(resFollowers.data);
            setFollowingList(resFollowing.data);
            setIsConnectionsLoaded(true);
        } catch (error) {
            console.log("Lỗi lấy danh sách kết nối:", error);
        }
    };

    const handleToggleFavorite = async (recipeId) => {
        try {
            const res = await axiosClient.post('/recipes/favorites/toggle', { userId: myId, recipeId });
            if (res.data.status === 'liked') setFavorites(prev => [...prev, recipeId]);
            else setFavorites(prev => prev.filter(favId => favId !== recipeId));
        } catch (err) { console.log(err); }
    };

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
        }
        catch (e) { console.log(e); toast.error("Lỗi khi thao tác theo dõi!"); }
    };
    const handleBlockToggle = () => {
        if (!myId) {
            return toast.error("Vui lòng đăng nhập để sử dụng tính năng này!");
        }
        setIsConfirmModalOpen(true);
    };

    const handleLogout = async () => {
        try {
            await axiosClient.post('/auth/logout');
            localStorage.clear();
            navigate('/login-register');
        } catch (err) {
            console.error(err);
        }
    };

    const executeBlockAction = async () => {
        try {
            if (isBlocked) {
                await axiosClient.post('/users/unblock', { blockerId: myId, blockedId: id });
                toast.success("Đã bỏ chặn thành công!");
                setIsBlocked(false);
            } else {
                await axiosClient.post('/users/block', { blockerId: myId, blockedId: id });
                navigate('/not-found');
            }
        } catch (err) {
            toast.error("Lỗi thao tác: " + (err.response?.data?.message || err.message));
        }
    };

    const handleReportUser = async () => {
        if (!myId) {
            return toast.error("Vui lòng đăng nhập để báo cáo!");
        }
        if (!reportReason.trim()) {
            return toast.error("Vui lòng nhập lý do báo cáo!");
        }
        try {
            const res = await axiosClient.post(`/users/report`, {
                reporterId: myId,
                reportedUserId: id,
                reason: reportReason
            });
            toast.success("Gửi báo cáo thành công!");
            setIsReportModalOpen(false);
            setReportReason('');
            setIsMenuOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi khi báo cáo người dùng");
        }
    };

    const handleDeleteClick = (recipe) => {
        setRecipeToDelete(recipe);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async (e) => {
        if (e) e.preventDefault();
        try {
            const recipeId = recipeToDelete?._id || recipeToDelete?.id;
            if (!recipeId) {
                toast.error("Không tìm thấy ID món ăn để xóa!");
                setIsDeleteModalOpen(false);
                return;
            }

            await axiosClient.delete(`/recipes/${recipeId}`);
            setRecipes(prev => prev.filter(r => String(r._id || r.id) !== String(recipeId)));
            setIsDeleteModalOpen(false);
            toast.success("Xóa món thành công");
            setRecipeToDelete(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Có lỗi xảy ra khi xóa!");
            setIsDeleteModalOpen(false);
        }
    };

    const keyword = profileFilter.search.toLowerCase();

    const filteredRecipes = userRecipes
        .filter(r => (r.title || r.name || '').toLowerCase().includes(keyword))
        .sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return profileFilter.sort === 'newest' ? dateB - dateA : dateA - dateB;
        });

    const filteredHistory = cookedHistory
        .filter(r => (r.title || r.name || '').toLowerCase().includes(keyword))
        .sort((a, b) => {
            const dateA = new Date(a.cooked_at || a.created_at || 0);
            const dateB = new Date(b.cooked_at || b.created_at || 0);
            return profileFilter.sort === 'newest' ? dateB - dateA : dateA - dateB;
        });

    if (isLoading) return <div className="page-loading-msg">Đang tải hồ sơ... </div>;
    if (!profileUser) return <div className="page-loading-msg">Không tìm thấy người dùng này </div>;

    const renderUserGrid = (list, emptyMessage) => {
        if (list.length === 0) return <p className="empty-msg" style={{ marginTop: '20px' }}>{emptyMessage}</p>;
        return (
            <div className="connections-grid">
                {list.map(user => (
                    <div key={user.id} className="connection-item" onClick={() => navigate(`/profile/${user.id}`)}>
                        <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.fullname || user.username}`} alt="avt" className={`connection-avt ${user.is_premium == 1 || user.is_premium === true ? 'premium' : ''}`} />
                        <div className="connection-info">
                            <h4 className="connection-name">{user.fullname || user.username}</h4>
                            <p className="connection-username">@{user.username}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    return (
        <div className="profile-page-wrapper fadeIn">

            <div className="profile-inner-wrapper">

                <div className="eatdish-profile-container">
                    <div className="eatdish-profile-header">
                        <button className="eatdish-btn-back profile-sticky-back-btn" onClick={() => navigate(-1)}>
                            ← Quay lại
                        </button>
                        {!isOwner ? (
                            <div className="action-menu-wrapper">
                                <button
                                    className="btn-three-dots"
                                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6 12c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm6-2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm8 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
                                    </svg>
                                </button>
                                {isMenuOpen && (
                                    <div className="dropdown-menu-container" style={{ top: '100%', right: 0 }} onClick={e => e.stopPropagation()}>
                                        <button onClick={handleBlockToggle} className="dropdown-item block">
                                            <span>{isBlocked ? <ShieldMinus /> : <UserLock />}</span>
                                            {isBlocked ? 'Bỏ chặn' : 'Chặn '}
                                        </button>
                                        <button onClick={() => { setIsMenuOpen(false); setIsReportModalOpen(true); }} className="dropdown-item report">
                                            <span><MessageSquareWarning /> Báo cáo vi phạm</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div onClick={handleLogout} className="rs-auth-links-profile">
                                    <span className="rs-auth-text-profile">Đăng xuất</span>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="eatdish-top-info">
                        <img src={profileUser.avatar || 'https://via.placeholder.com/100'} alt="avatar" className={`eatdish-avatar ${profileUser.is_premium == 1 || profileUser.is_premium === true ? 'premium' : ''}`} />
                        <div className="eatdish-name-box">
                            <h2 className="eatdish-fullname">
                                {profileUser.fullname}
                                {(profileUser.is_premium == 1 || profileUser.is_premium === true) && <span title="Thành viên VIP" style={{ marginLeft: '5px', fontSize: '18px' }}><Crown size={27} color='#ff9f1c' /></span>}
                            </h2>
                            <p className="eatdish-username">@{profileUser.username}</p>
                            {profileUser.location && <p className="eatdish-location"><MapPin /> {profileUser.location}</p>}
                        </div>
                    </div>

                    <div className="eatdish-stats-box">
                        <span
                            className={`stat-clickable ${activeTab === 'following' ? 'stat-active' : ''}`}
                            onClick={() => { setActiveTab('following'); fetchConnections(); }}
                        >
                            <strong>{profileUser?.stats?.following || 0}</strong> Bạn Bếp
                        </span>
                        <span
                            className={`stat-clickable ${activeTab === 'followers' ? 'stat-active' : ''}`}
                            onClick={() => { setActiveTab('followers'); fetchConnections(); }}
                        >
                            <strong>{profileUser?.stats?.followers || 0}</strong> Người quan tâm
                        </span>
                    </div>

                    <div className="eatdish-bio-box">
                        {profileUser?.bio && profileUser.bio.trim() !== "" ? <p>{profileUser.bio}</p> : <p className="text-muted" style={{ color: '#999' }}>{isOwner ? "Bạn chưa viết giới thiệu bản thân." : "Người dùng này chưa viết giới thiệu."}</p>}
                    </div>

                    <div className="eatdish-action-box" style={{ display: 'flex', gap: '10px' }}>
                        {isOwner ? (
                            <button className="eatdish-btn-action btn-edit-white" onClick={() => setIsEditModalOpen(true)}>Sửa thông tin cá nhân</button>
                        ) : (
                            <>
                                <button className={`eatdish-btn-action btn-follow-dark ${profileUser.is_following ? 'following' : ''}`} onClick={handleFollowUser}>
                                    {profileUser.is_following ? 'Đang theo dõi ✔' : 'Kết Bạn Bếp'}
                                </button>

                            </>
                        )}
                    </div>

                    <div className="eatdish-tabs-wrapper">
                        <div className={`eatdish-tab ${activeTab === 'recipes' ? 'active' : ''}`} onClick={() => setActiveTab('recipes')}>
                            Công thức ({userRecipes.length})
                        </div>
                        <div className={`eatdish-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                            Đã nấu ({cookedHistory.length})
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ padding: '20px 0', maxWidth: '100%', width: '100%', margin: '0 auto' }}>

                    {(activeTab === 'recipes' || activeTab === 'history') && (
                        <div className="profile-filter-row">
                            <div className="profile-search-wrapper">
                                <input type="text" placeholder="Tìm kiếm món ăn..." value={profileFilter.search} onChange={(e) => setProfileFilter({ ...profileFilter, search: e.target.value })} className="profile-search-input" />
                            </div>
                            <select value={profileFilter.sort} onChange={(e) => setProfileFilter({ ...profileFilter, sort: e.target.value })} className="profile-sort-select">
                                <option value="newest">Mới nhất</option>
                                <option value="oldest">Cũ nhất</option>
                            </select>
                        </div>
                    )}

                    {activeTab === 'recipes' && (
                        filteredRecipes.length > 0 ? (
                            isOwner ? (
                                <div className="profile-table-container">
                                    <table className="profile-table">
                                        <thead>
                                            <tr><th>Món ăn</th><th>Ngày đăng</th><th>Loại</th><th>Hành động</th></tr>
                                        </thead>
                                        <tbody>
                                            {filteredRecipes.map(item => (
                                                <tr key={item.id}>
                                                    <td className="profile-td-dish"><img src={item.img || item.image || item.image_url} alt="dish" className="profile-td-img" /><span className="profile-td-title">{item.title || item.name}</span></td>
                                                    <td className="profile-td-date">{new Date(item.created_at || Date.now()).toLocaleDateString('vi-VN')}</td>
                                                    <td className="profile-td-type">{item.is_premium || item.is_vip ? 'VIP' : 'Free'}</td>
                                                    <td>
                                                        <div className="profile-action-btns">
                                                            <button onClick={() => navigate(`/recipe/${item.id}`)} className="btn-profile-view">Xem</button>
                                                            <button onClick={() => { setRecipeToEdit(item); setIsEditRecipeModalOpen(true); }} className="btn-profile-edit">Sửa</button>
                                                            <button onClick={() => handleDeleteClick(item)} className="btn-profile-delete">Xóa</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="product-grid profile-grid-override">
                                    {filteredRecipes.map(item => <RecipeCard key={item.id} item={item} isFavorite={(favorites || []).includes(item.id)} onOpenModal={(recipe) => navigate(`/recipe/${recipe.id}`)} onViewProfile={(uid) => navigate(`/profile/${uid}`)} onToggleFavorite={handleToggleFavorite} />)}
                                </div>
                            )
                        ) : <p className="empty-msg" style={{ marginTop: '20px' }}>Chưa có công thức nào.</p>
                    )}

                    {activeTab === 'history' && (
                        <div className="product-grid profile-grid-override">
                            {filteredHistory.length > 0 ? (
                                filteredHistory.map((item, index) => {
                                    const fixedItem = { ...item, id: item.recipe_id || item.id, author_name: item.author_name || item.fullname || item.username || 'Thành viên' };
                                    return (
                                        <div key={`cooked-${fixedItem.id}-${index}`} className="cooked-item-wrapper">
                                            <RecipeCard item={fixedItem} isFavorite={(favorites || []).includes(fixedItem.id)} onOpenModal={(recipe) => navigate(`/recipe/${recipe.id}`)} onViewProfile={(uid) => navigate(`/profile/${uid || fixedItem.author_id}`)} onToggleFavorite={handleToggleFavorite} />
                                        </div>
                                    );
                                })
                            ) : <p className="empty-msg" style={{ marginTop: '20px' }}>Chưa hoàn thành món ăn nào.</p>}
                        </div>
                    )}

                    {activeTab === 'following' && renderUserGrid(followingList, "Chưa theo dõi Bạn Bếp nào.")}
                    {activeTab === 'followers' && renderUserGrid(followersList, "Chưa có người quan tâm nào.")}

                </div>
            </div>

            {isOwner && <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} currentUser={profileUser} onUpdateSuccess={(updatedUser) => { setProfileUser(updatedUser); setIsEditModalOpen(false); }} />}
            <ConfirmModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={executeBlockAction} title={isBlocked ? "Bỏ chặn" : "Chặn người này"} message={isBlocked ? "Họ sẽ có thể xem lại trang cá nhân của bạn." : "Họ sẽ không thể xem trang cá nhân và các món ăn của bạn nữa!"} />

            <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={executeDelete} title={'Xóa công thức'} message={<span>Chắc chắn xóa <b>{recipeToDelete?.title || recipeToDelete?.name}</b>?</span>} />
            <EditRecipeModal isOpen={isEditRecipeModalOpen} onClose={() => { setIsEditRecipeModalOpen(false); setRecipeToEdit(null); }} user={profileUser} editingRecipe={recipeToEdit} onUpdateSuccess={(updatedRecipe) => { setRecipes(prev => prev.map(r => r.id === updatedRecipe.id ? updatedRecipe : r)); toast.success("Cập nhật thành công!"); }} />

            <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Báo cáo người dùng">
                <p style={{ marginBottom: '15px', color: '#666' }}>Vui lòng cho biết lý do bạn báo cáo <b>{profileUser?.fullname}</b>:</p>
                <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Nhập lý do báo cáo..."
                    style={{ width: '100%', minHeight: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '15px' }}
                />
                <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button className="btn-confirm-no" onClick={() => setIsReportModalOpen(false)}>Hủy</button>
                    <button className="btn-confirm-yes" onClick={handleReportUser}>Gửi báo cáo</button>
                </div>
            </Modal>
        </div>
    );
};

export default ProfilePage;