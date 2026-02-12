import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import Overview from '../components/view/Overview';
import RecipesView from '../components/view/RecipesView';
import CommunityView from '../components/view/CommunityView';
import FavoritesView from '../components/view/FavoritesView';
import SettingView from '../components/view/SettingView';
import RightSidebar from '../components/RightSidebar';
import RecipeDetailModal from '../components/modals/RecipeDetailModal';
import FilterModal from '../components//modals/FilterModal';
import ChatBot from '../components/ChatBot';
import SurpriseMascot from '../components/SurpriseMascot';  
import AccountSettingsView from '../components/view/AccountSettingsView';
import NotificationSettingsView from '../components/view/NotificationSettingsView';
import UploadModal from '../components/modals/UploadModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import Toast from '../components/Toast';
import '../index.css'; 


const HomePage = () => {
    const navigate = useNavigate();
    // STATES 
    const [error, setError] = useState(''); // Lỗi chung
    const [successMsg, setSuccessMsg] = useState(''); // thông báo thành công chung
    const [isLoading, setIsLoading] = useState(false); // trạng thái load profile
    const [recipes, setRecipes] = useState([]);// danh sách công thức
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('eatdish_active_tab') || 'overview';
    }); // tab đang active
    const [showFilter, setShowFilter] = useState(false); // hiển thị modal bộ lọc
    const [filters, setFilters] = useState({ maxCal: '', maxTime: '' }); // bộ lọc
    
    const [isConfirmModalLogOut, setIsConfirmModalLogOut] = useState(false);
    const [favorites, setFavorites] = useState([]); // danh sách công thức yêu thích
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); // trạng thái modal tải công thức
    const [uploadData, setUploadData] = useState({
        name: '', description: '', calories: '', time: '', 
        image: null, ingredients: [], steps: []
    }); // dữ liệu công thức tải lên
    const [showChatBot, setShowChatBot] = useState(false); // trạng thái hiển thị chatbot
    const location = useLocation(); // để lấy query params
    const [uploadPreview, setUploadPreview] = useState(null); // preview ảnh tải công thức

    // State cho Cộng đồng (Community)

    const [communityPosts, setCommunityPosts] = useState([]); // danh sách bài viết
    const [postContent, setPostContent] = useState(''); // nội dung bài viết mới
    const [postImage, setPostImage] = useState(null); // ảnh bài viết mới
    const [imagePreview, setImagePreview] = useState(null); // preview ảnh bài viết mới
    const [replyingTo, setReplyingTo] = useState(null); // trạng thái đang trả lời comment nào
    const [editingPostId, setEditingPostId] = useState(null);  // ID bài viết đang sửa
    const [editPostContent, setEditPostContent] = useState(''); // Nội dung mới khi sửa
    const [editPostImage, setEditPostImage] = useState(null); // Ảnh mới khi sửa
    const [editImagePreview, setEditImagePreview] = useState(null);// Preview ảnh mới khi sửa
    
    // State cho Thông báo
    const [notifications, setNotifications] = useState([]); // danh sách thông báo
    const [selectedRecipe, setSelectedRecipe] = useState(null); // công thức được chọn để xem chi tiết
    const [showNotifDropdown, setShowNotifDropdown] = useState(false); // hiển thị dropdown thông báo
    
    // State cho Modal và Cài đặt
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // trạng thái modal chỉnh sửa hồ sơ
    const [accountSubView, setAccountSubView] = useState('main'); // 'main', 'password', 'blocked', 'delete'
    const [passwordData, setPasswordData] = useState({ old: '', new: '', confirm: '' }); // dữ liệu đổi mật khẩu
    
    // State cho Comment 
    const [activeCommentPostId, setActiveCommentPostId] = useState(null); // Bài viết nào đang mở comment
    const [commentsList, setCommentsList] = useState([]); // Danh sách comment của bài đang mở
    const [commentText, setCommentText] = useState('');   // Nội dung đang nhập

    // State User
    const [user, setUser] = useState({
        id: null,
        fullname: 'Khách',
        username: 'Khách',
        avatar: `https://ui-avatars.com/api/?name= ${'Khách'}&background=random&length=2&size=128`,
        cover_img: '',
        bio: '',
        stats: { recipes: 0, followers: 0, following: 0 }
    });
    const isGuest = !user || !user.id || user.id === null; // Kiểm tra user là khách
    const handleTabChange = (tab) => {
    const restrictedTabs = ['favorites', 'community', 'settings', 'account_settings', 'profile'];
    
    if (isGuest && restrictedTabs.includes(tab)) {
        setError("Vui lòng đăng nhập để truy cập mục này!");
        return;
    }
    
    setActiveTab(tab);
    localStorage.setItem('eatdish_active_tab', tab);
    window.scrollTo(0, 0);
};
        // STYLES 
    const rowStyle = {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '22px 20px', borderBottom: '1px solid #f2f2f2', cursor: 'pointer', transition: 'background 0.2s'
    };
    const inputStyle = {
        width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #eee',
        background: '#f9fafc', marginBottom: '15px', outline: 'none', fontSize: '14px'
    };
    const btnOrange = {
        width: '100%', padding: '15px', background: '#ff9f1c', color: '#fff',
        border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px'
    };

    //  HANDLERS 

    const handleSearch = async (keyword, e) => {
         if(e) {e.preventDefault();}
    try {
        const url = keyword 
        ? `/recipes/search?q=${keyword}` 
        : `/recipes`; 
        
        const res = await axiosClient.get(url);
        setRecipes(res.data);
    } catch (err) {
        console.log("Lỗi tìm kiếm:", err);
        setError("Lỗi tìm kiếm");
    }
    };
    // Hàm mở chi tiết món ăn nếu khách ấn
    const handleOpenRecipe = (recipe) => {
        if (isGuest) {
            setError("Vui lòng đăng nhập để thực hiện hành động này!");
            return;
        }
        setSelectedRecipe(recipe);
    };
    //  Hàm xem trang cá nhân của bất kỳ ai
    const handleViewProfile = async (targetUserId) => {
        if (isGuest) {
            setError("Vui lòng đăng nhập để xem trang cá nhân!");
            navigate('/login');
            return;
        }

        if (!targetUserId) return;
        navigate(`/profile/${targetUserId}`);
    
    };
    //hàm lấy thời gian để chào
    const getGreetingTime = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Chào buổi sáng";
        if (hour < 18) return "Chào buổi chiều";
        return "Chào buổi tối";
    }
    
    // Hàm Xóa bài
    const handleDeletePost = async (postId, e) => {
         if(e) {e.preventDefault();}
        try {
            await axiosClient.delete(`/community/${postId}?userId=${user.id}`);
            setCommunityPosts(communityPosts.filter(p => p.id !== postId)); 
            setSuccessMsg("Đã xóa bài viết!");
        } catch (err) { setError("Lỗi khi xóa bài"); console.log(err); }
    };
    // sửa ảnh bài viết (cộng đồng)
    const handleEditImageChange = (e) => {
        const selectedFile = e.target.files[0];

        if (!selectedFile) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(selectedFile.type)) {
            alert("Vui lòng chọn định dạng ảnh hợp lệ (JPG, PNG, WebP)!");
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            alert("Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.");
            return;
        }

        if (uploadPreview && uploadPreview.startsWith('blob:')) {
            URL.revokeObjectURL(uploadPreview);
        }

        const objectUrl = URL.createObjectURL(selectedFile);

        setUploadPreview(objectUrl); 
        setUploadData((prev) => ({
            ...prev,
            image: selectedFile 
        }));
    };
        

    // Hàm lưu nội dung sau khi sửa (cho cộng đồng)
    const handleUpdatePost = async (postId, e) => {
        if(e) e.preventDefault();
        if (!editPostContent.trim()) return;
        if (!user?.id) return setError("Phiên đăng nhập hết hạn.");

        setCommunityPosts(prev => prev.map(p => 
            p.id === postId ? { ...p, content: editPostContent } : p
        ));
        setEditingPostId(null);

        const formData = new FormData();
        formData.append('userId', user.id);
        formData.append('content', editPostContent);
        
        if (editPostImage) {
            formData.append('image', editPostImage);
        } 

        try {
            const res = await axiosClient.put(`/community/${postId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.status === 200) {
                setSuccessMsg('Cập nhật thành công!');
            }
        } catch (err) {
            console.error("Chi tiết lỗi Backend:", err.response?.data || err.message);
            setError('Server bị lỗi khi lưu bài viết.');
        }
    };
    // Xử lý chọn file ảnh (cho cộng đồng)
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPostImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
        //  Xử lý đăng bài (cho cộng đồng)
    const handleSubmitPost = async (e) => {
         if(e) {e.preventDefault();}
        if (!user || !user.id) {
            setError("Vui lòng đăng nhập để thực hiện hành động này!");
            return;
        }
        if (!postContent && !postImage) return setError("Vui lòng nhập nội dung hoặc chọn ảnh để đăng.");

        const formData = new FormData();
        formData.append('userId', user.id);
        formData.append('content', postContent);
        if (postImage) formData.append('image', postImage);

        try {
            await axiosClient.post('/community', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setPostContent('');
            setPostImage(null);
            setImagePreview(null);
            setSuccessMsg("Đã đăng bài thành công!");
            
            try {
                const res = await axiosClient.get('/community');
                setCommunityPosts(res.data);
            } catch (e) {}

        } catch (err) {
            console.log(err);
            setError("Lỗi khi đăng bài.");
        }
    };
    
    // 1. Hàm Tym Bài Viết (cho cộng đồng)
    const handleLikePost = async (postId, e) => {
         if(e) {e.preventDefault();}
        try {
            setCommunityPosts(prevPosts => prevPosts.map(post => {
                if (post.id === postId) {
                    const newLikesCount = post.is_liked ? post.likes_count - 1 : post.likes_count + 1;
                    return { ...post, is_liked: !post.is_liked, likes_count: newLikesCount };
                }
                return post;
            }));

            await axiosClient.post('/community/like', { userId: user.id, postId });
            
        } catch (err) { 
            console.log(err);
            setError("Lỗi khi thả tim. Vui lòng thử lại.");
            const res = await axiosClient.get(`/community?userId=${user.id}`);
            setCommunityPosts(res.data);
        }
    };
        // Hàm mở, đóng comment(cho cộng đồng)
    const toggleComments = async (postId, e) => {
         if(e) {e.preventDefault();}
        if (activeCommentPostId === postId) {
            setActiveCommentPostId(null); 
        } else {
            setActiveCommentPostId(postId); 
            const res = await axiosClient.get(`/community/comments/${postId}`);
            setCommentsList(res.data);
        }
    };
    // hàm đăng công thức (cho tải công thức lên)
    const handleSubmitRecipe = async () => {
        if (isGuest) {
            setError("Vui lòng đăng nhập để thực hiện hành động này!");
            return;
        }
        if (!user || !user.id) {
            setError("Lỗi phiên đăng nhập. Vui lòng F5 lại trang.");
            return;
        }

        if (!uploadData.name || !uploadData.name.trim()) {
            setError("Vui lòng nhập tên món ăn!");
            return;
        }

        if (!uploadData.image) {
            setError("Vui lòng chọn ảnh cho món ăn ");
            return;
        }

        if (uploadData.ingredients.length === 0) {
            setError("Vui lòng thêm ít nhất 1 nguyên liệu!");
            return;
        }

        if (uploadData.steps.length === 0) {
            setError("Vui lòng thêm ít nhất 1 bước thực hiện!");
            return;
        }

        setError(""); 

        //  TẠO FORM DATA
        const formData = new FormData();
        formData.append('userId', user.id);
        formData.append('name', uploadData.name);
        formData.append('description', uploadData.description);
        formData.append('calories', uploadData.calories);
        formData.append('time', uploadData.time);
        formData.append('img', uploadData.image);
        formData.append('ingredients', JSON.stringify(uploadData.ingredients));
        formData.append('steps', JSON.stringify(uploadData.steps));
        formData.append('video_url', uploadData.video_url || '');

        try {
            const res = await axiosClient.post('/recipes/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setSuccessMsg(" Đã gửi công thức, chờ duyệt!");
                setIsUploadModalOpen(false);
                setUploadData({
                    name: '',
                    description: '',
                    calories: '',
                    time: '',
                    image: null,
                    ingredients: [],
                    steps: []
                });
                setUploadPreview(null);
            }
            
        } catch (err) {
            console.error(err);
            setError("Lỗi khi tải công thức lên.");
        }
    };
    // Xử lý Toggle Yêu thích (cho công thức)
    const handleToggleFavorite = async (recipeId, e) => {
        if (e && e.stopPropagation) e.stopPropagation();

        if (isGuest) {
            setError("Vui lòng đăng nhập để thả tim món ăn này!");
            return;
        }
        try {
            const res = await axiosClient.post('/recipes/favorites/toggle', { 
                userId: user.id, 
                recipeId 
            });
            if (res.data.status === 'liked') {
                setFavorites(prev => [...prev, recipeId]);
            } else {
                setFavorites(prev => prev.filter(id => id !== recipeId));
            }
        } catch (err) { 
            console.error("Lỗi yêu thích:", err);
            setError("Có lỗi xảy ra, vui lòng thử lại sau.");
        }
    };

    //  Xử lý đổi mật khẩu (cho cài đặt tài khoản)
    const handleChangePassword = async (e) => {
        if(isGuest) {
            setError("Vui lòng đăng nhập để thực hiện hành động này!");
            return;
        }
        if(e) {e.preventDefault();}
        if (passwordData.new !== passwordData.confirm) {
            return setError("Mật khẩu mới và xác nhận mật khẩu không khớp.");
        }
        try {
            const res = await axiosClient.put('/auth/change-password', {
                userId: user.id,
                oldPassword: passwordData.old,
                newPassword: passwordData.new
            });
            if (res.data.status === 'success') {
                setSuccessMsg("Đổi mật khẩu thành công!");
                setAccountSubView('main');
                setPasswordData({ old: '', new: '', confirm: '' });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Lỗi khi đổi mật khẩu");
        }
    };

    // Xử lý xóa tài khoản (cho cài đặt tài khoản)
    const handleDeleteAccount = async (e) => {
        if (isGuest) {
            setError("Vui lòng đăng nhập để thực hiện hành động này!");
            return;
        }
        if(e) {e.preventDefault();}
        if (window.confirm("BẠN CÓ CHẮC CHẮN? Toàn bộ dữ liệu sẽ mất vĩnh viễn!")) {
            try {
                const res = await axiosClient.delete(`/users/${user.id}`);
                if (res.data.status === 'success') {
                    setSuccessMsg("Tài khoản của bạn đã bị xóa.");
                    localStorage.clear();
                    window.location.href = '/login-register';
                }
            } catch (err) {
                console.log(err);
                setError(err.response?.data?.message || "Không thể xóa tài khoản lúc này.");
            }
        }
    };

    // Hàm mở danh sách thông báo và đánh dấu đã đọc nếu có (cho thông báo)
    const handleToggleNotifications = async (e) => {
        if(isGuest) {
            setError("Vui lòng đăng nhập để thực hiện hành động này!");
            return;
        }
        if(e) {e.preventDefault();}
        setShowNotifDropdown(!showNotifDropdown);

        if (!showNotifDropdown && unreadCount > 0) {
            try {
                await axiosClient.put('/notifications/read-all', { userId: user.id });
                setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
            } catch (err) {
                console.log("Lỗi đánh dấu đã đọc:", err);
                setError("Lỗi đánh dấu");
            }
        }
    };
    // xử lí mở chat bot
    const handleOpenChatBot = () => {
        if (isGuest) {
            setError("Bạn cần đăng nhập để trò chuyện với trợ lý ảo! ");
            return;
        }
        else {
        setShowChatBot(true);
        }
    };

    // Xử lý Đăng xuất
    const handleLogout = () => {
        setIsConfirmModalLogOut(true);
    };
    const executeLogout = () => {
        localStorage.clear();
        window.location.href = '/login-register';
    };
    

    // EFFECT
   useEffect(() => {
        if (location.state && location.state.viewProfileId) {
            const targetId = location.state.viewProfileId;
            handleViewProfile(targetId);

            window.history.replaceState({}, document.title);
        }
    }, [location]);
    useEffect(() => {
        const fetchData = async () => {
            localStorage.setItem('eatdish_active_tab', activeTab);
            const storedId = localStorage.getItem('eatdish_user_id');
            if (!storedId) {
                return;
            }

            try {
                
                const resUser = await axiosClient.get(`/users/${storedId}`);
                setUser(resUser.data);
                localStorage.setItem('user', JSON.stringify(resUser.data));
                localStorage.setItem('eatdish_user', JSON.stringify(resUser.data));

                const [resRec, resFav, resNotif, resComm] = await Promise.all([
                    axiosClient.get('/recipes'),
                    axiosClient.get(`/recipes/favorites/${storedId}`),
                    axiosClient.get(`/notifications/${storedId}`),
                    axiosClient.get(`/community?userId=${storedId}`)
                ]);
                setRecipes(resRec.data);
                setFavorites(resFav.data.map(f => f.id));
                setNotifications(resNotif.data);
                setCommunityPosts(resComm.data);

            } catch (err) {
                console.log("Lỗi chung:", err);

            }
        };

        fetchData();
    }, [ activeTab]); 

        useEffect(() => {
        if (error || successMsg) {
            const timer = setTimeout(() => {
                setError('');
                setSuccessMsg('');
            }, 3000); 

            return () => clearTimeout(timer); 
        }
    }, [error, successMsg]);
    const unreadCount = notifications.filter(n => n.is_read === 0).length;

    return (
        <div className="dashboard">
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
            
            <Sidebar 
                activeTab={activeTab}
            setActiveTab={handleTabChange} 
            onOpenUpload={isGuest ? () => setError("Vui lòng đăng nhập để tải công thức!") : () => setIsUploadModalOpen(true)} // Mở modal tải công thức, nếu là khách thì không cho mở
            currentUser={user} i
            unreadCount={isGuest ? 0 : unreadCount} 
            />
            <ChatBot 
                isOpen={showChatBot} 
                onClose={() => handleOpenChatBot()} 
                />

            <SurpriseMascot
                onClickMascot={() => {
                    handleOpenChatBot();
                }}
                />

            <main className="main-content">
                <Navbar onSearch={(keyword, e) => { setActiveTab('recipes'); handleSearch(keyword, e); }} onOpenFilter={() => setShowFilter(true)} />
                                
                <FilterModal 
                    isOpen={showFilter}
                    onClose={() => setShowFilter(false)} 
                    onApply={async (newFilters) => {
                        setFilters(newFilters);
                        setShowFilter(false);
                        setActiveTab('recipes');
                            try {
                                setIsLoading(true);
                                const { maxCal, maxTime, ingredient } = newFilters; 
                                                    
                                const res = await axiosClient.get(
                                    `/recipes/filter?maxCal=${maxCal}&maxTime=${maxTime}&ing=${ingredient}`
                                );
                                                    
                                setRecipes(res.data);
                                if (res.data.length === 0) setError("Không tìm thấy món phù hợp.");
                                    else setSuccessMsg(`Tìm thấy ${res.data.length} món phù hợp!`);
                                } catch (err) {
                                    setError("Lỗi khi áp dụng bộ lọc");
                                } finally {
                                    setIsLoading(false);
                                }
                    }}
                />
                {/* VIEW TỔNG QUAN */}
                {activeTab === 'overview' && (
                    <Overview user={user} getGreetingTime={getGreetingTime} />
                )}

                {/* VIEW CÔNG THỨC */}
                {activeTab === 'recipes' && (
                    <RecipesView 
                        recipes={recipes}
                        favorites={favorites}
                        handleToggleFavorite={handleToggleFavorite}
                        setSelectedRecipe={handleOpenRecipe}
                        handleViewProfile={handleViewProfile}
                        openPublicProfile={handleViewProfile}
                    />
                )}

                {/* VIEW YÊU THÍCH */}
                {activeTab === 'favorites' && (
                    <FavoritesView 
                        recipes={recipes} favorites={favorites} 
                        handleToggleFavorite={handleToggleFavorite} 
                        setSelectedRecipe={handleOpenRecipe}
                        handleViewProfile={handleViewProfile}
                    />
                )}
                {/* VIEW CỘNG ĐỒNG */}
                {activeTab === 'community' && (
                    <CommunityView 
                        user={user} 
                        communityPosts={communityPosts}
                        postContent={postContent} setPostContent={setPostContent}
                        imagePreview={imagePreview} setImagePreview={setImagePreview}
                        postImage={postImage} setPostImage={setPostImage}
                        handleFileChange={handleFileChange}
                        handleSubmitPost={handleSubmitPost}
                        handleLikePost={handleLikePost}
                        handleDeletePost={handleDeletePost}
                        handleUpdatePost={handleUpdatePost}
                        editingPostId={editingPostId} setEditingPostId={setEditingPostId}
                        editPostContent={editPostContent} setEditPostContent={setEditPostContent}
                        editPostImage={editPostImage}
                        setUploadData={setUploadData}
                        setUploadPreview={setUploadPreview}
                        setEditPostImage={setEditPostImage}
                        editImagePreview={editImagePreview}
                        setEditImagePreview={setEditImagePreview}
                        handleEditFileChange={handleEditImageChange}
                        toggleComments={toggleComments}
                        activeCommentPostId={activeCommentPostId}
                        commentsList={commentsList} setCommentsList={setCommentsList}
                        commentText={commentText} setCommentText={setCommentText}
                        replyingTo={replyingTo} setReplyingTo={setReplyingTo}
                        handleViewProfile={handleViewProfile}
                    />
                )}

                {/* VIEW PROFILE */}
                {activeTab === 'profile' && (
                    <Profile 
                        user={user} 
                        recipes={recipes} 
                        favorites={favorites || []} 
                        handleToggleFavorite={handleToggleFavorite}
                        setSelectedRecipe={setSelectedRecipe}
                        setActiveTab={setActiveTab}
                        setIsEditModalOpen={setIsEditModalOpen}
                    />
                )}


                {/* VIEW CÀI ĐẶT  */}
                {activeTab === 'settings' && (
                    <SettingView 
                        setActiveTab={setActiveTab}
                        handleLogout={handleLogout}
                    />
                )}
                
                {/* view cài đặt tài khoản */}
               {activeTab === 'account_settings' && (
                    <AccountSettingsView 
                        setActiveTab={setActiveTab}
                        accountSubView={accountSubView}
                        setAccountSubView={setAccountSubView}
                        passwordData={passwordData}
                        setPasswordData={setPasswordData}
                        handleChangePassword={handleChangePassword}
                        handleDeleteAccount={handleDeleteAccount}
                        styles={{ rowStyle, inputStyle, btnOrange }} 
                    />
                )}
                {/* view cài đặt thông báo */}
                {activeTab === 'notifications_settings' && (
                    <NotificationSettingsView setActiveTab={setActiveTab} />
                )}

            </main>

            

            {/* SIDEBAR PHẢI */}
            <RightSidebar 
                user={user}
                unreadCount={unreadCount}
                notifications={notifications}
                showNotifDropdown={showNotifDropdown}
                handleToggleNotifications={handleToggleNotifications}
                handleLogout={handleLogout}
                onOpenModal={handleOpenRecipe}
                setActiveTab={setActiveTab}
                handleViewProfile={handleViewProfile}
            />

            {/* Modal Recipe Detail */}
            <RecipeDetailModal 
                isOpen={!!selectedRecipe}
                onClose={() => setSelectedRecipe(null)}
                selectedRecipe={selectedRecipe}
                handleViewProfile={handleViewProfile}
            />
            {/* Modal Upload Recipe */}
            <UploadModal 
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                user={user}
                uploadData={uploadData}
                setUploadData={setUploadData}
                uploadPreview={uploadPreview}
                setUploadPreview={setUploadPreview}
                handleSubmitRecipe={handleSubmitRecipe}
            />
            {/* Modal Xác nhận Đăng xuất */}
            <ConfirmModal 
                isOpen={isConfirmModalLogOut}
                onClose={() => setIsConfirmModalLogOut(false)}
                onConfirm={executeLogout}
                title="Đăng xuất"
                message="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?"
            />
        </div>
    );
};

export default HomePage;