import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import RecipesView from '../components/view/RecipesView';
import CommunityView from '../components/view/CommunityView';
import FavoritesView from '../components/view/FavoritesView';
import SettingView from '../components/view/SettingView';
import RightSidebar from '../components/RightSidebar';
import RecipeDetailModal from '../components/modals/RecipeDetailModal';
import FilterModal from '../components//modals/FilterModal';
import ChatBot from '../components/ChatBot';
import AccountSettingsView from '../components/view/AccountSettingsView';
import NotificationSettingsView from '../components/view/NotificationSettingsView';
import UploadModal from '../components/modals/UploadModal';
import ConfirmModal from '../components/modals/ConfirmModal';
import PremiumView from '../components/view/PremiumView';
import PremiumModal from '../components/modals/PremiumModal';
import MobileBottomNav from '../components/MobileBottomNav';
import { toast } from 'react-toastify';
import { DEFAULT_RECIPE_CLASSIFICATIONS } from '../data/recipeClassifications';
import '../index.css'; 
import '../MobileApp.css';

const HomePage = () => {
    const navigate = useNavigate();
    const defaultRecipeFilters = {
        name: '',
        authorName: '',
        category: 'all',
        mealType: 'all',
        maxCal: '',
        maxTime: '',
        ingredient: '',
        hasVideo: false,
        premiumOnly: 'all',
        sortBy: 'newest',
    };
    // STATES 
    const [isLoading, setIsLoading] = useState(false); 
    const [recipes, setRecipes] = useState([]);
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('eatdish_active_tab') || 'recipes';
    }); 
    const [showFilter, setShowFilter] = useState(false); 
    const [filters, setFilters] = useState(defaultRecipeFilters); 
    const [blockedUserIds, setBlockedUserIds] = useState([]);
    const [isConfirmModalLogOut, setIsConfirmModalLogOut] = useState(false);
    const [favorites, setFavorites] = useState([]); 
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); 
    const [uploadData, setUploadData] = useState({
        name: '', description: '', calories: '', time: '', 
        image: null, ingredients: [], steps: [], video_url: '', is_premium: 0,
        category: 'Khac', meal_type: 'Khong_xac_dinh'
    }); 
    const [recipeClassifications, setRecipeClassifications] = useState(DEFAULT_RECIPE_CLASSIFICATIONS);
    const [showChatBot, setShowChatBot] = useState(false); 
    const location = useLocation(); 
    const [uploadPreview, setUploadPreview] = useState(null); 
    const [isExpiredAlert, setIsExpiredAlert] = useState(false);
    const [isUpgradeModal, setIsUpgradeModal] = useState(false);

    // State cho Cộng đồng (Community)
    const [communityPosts, setCommunityPosts] = useState([]); 
    const [postContent, setPostContent] = useState(''); 
    const [postImage, setPostImage] = useState(null); 
    const [imagePreview, setImagePreview] = useState(null); 
    const [replyingTo, setReplyingTo] = useState(null); 
    const [editingPostId, setEditingPostId] = useState(null);  
    const [editPostContent, setEditPostContent] = useState(''); 
    const [editPostImage, setEditPostImage] = useState(null); 
    const [editImagePreview, setEditImagePreview] = useState(null);
    
    // State cho Thông báo
    const [notifications, setNotifications] = useState([]); 
    const [selectedRecipe, setSelectedRecipe] = useState(null); 
    const [showNotifDropdown, setShowNotifDropdown] = useState(false); 
    
    // State cho Modal và Cài đặt
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); 
    const [accountSubView, setAccountSubView] = useState('main'); 
    const [passwordData, setPasswordData] = useState({ old: '', new: '', confirm: '' }); 
    
    // State cho Comment 
    const [activeCommentPostId, setActiveCommentPostId] = useState(null); 
    const [commentsList, setCommentsList] = useState([]); 
    const [commentText, setCommentText] = useState('');   

    // State User
    const [user, setUser] = useState({
        id: null,
        fullname: 'Khách',
        username: 'Khách',
        avatar: `https://ui-avatars.com/api/?name= Khách&background=random&length=2&size=128`,
        cover_img: '',
        bio: '',
        stats: { recipes: 0, followers: 0, following: 0 }
    });
    
    const isGuest = !user || !user.id || user.id === null; 

    const handleTabChange = (tab) => {
        const restrictedTabs = ['favorites', 'community', 'settings', 'account_settings', 'profile', 'premium'];
        
        if (isGuest && restrictedTabs.includes(tab)) {
            toast.error("Vui lòng đăng nhập để truy cập mục này!");
            return;
        }
        
        setActiveTab(tab);
        localStorage.setItem('eatdish_active_tab', tab);
        window.scrollTo(0, 0);
    };

    //  HANDLERS 
    const handleSearch = async (keyword, e) => {
         if(e) {e.preventDefault();}
        try {
            setFilters(prev => ({ ...prev, name: keyword || '' }));
            const url = keyword ? `/recipes/search?q=${keyword}` : `/recipes`; 
            const res = await axiosClient.get(url);
            setRecipes(res.data);
        } catch (err) {
            console.log("Lỗi tìm kiếm:", err);
        }
    };

    const handleOpenRecipe = (recipe) => {
        if (isGuest) {
            toast.error("Vui lòng đăng nhập để thực hiện hành động này!");
            return;
        }
        setSelectedRecipe(recipe);
    };

    const handleApplyRecipeFilters = async (newFilters) => {
        const nextFilters = { ...defaultRecipeFilters, ...newFilters };
        setFilters(nextFilters);
        setShowFilter(false);
        setActiveTab('recipes');

        try {
            setIsLoading(true);

            const filterParams = {};
            if (nextFilters.name?.trim()) filterParams.keyword = nextFilters.name.trim();
            if (nextFilters.authorName?.trim()) filterParams.authorName = nextFilters.authorName.trim();
            if (nextFilters.maxCal) filterParams.maxCal = nextFilters.maxCal;
            if (nextFilters.maxTime) filterParams.maxTime = nextFilters.maxTime;
            if (nextFilters.ingredient?.trim()) filterParams.ingredient = nextFilters.ingredient.trim();
            if (nextFilters.category && nextFilters.category !== 'all') filterParams.category = nextFilters.category;
            if (nextFilters.mealType && nextFilters.mealType !== 'all') filterParams.mealType = nextFilters.mealType;
            if (nextFilters.hasVideo) filterParams.hasVideo = 'true';
            if (nextFilters.premiumOnly && nextFilters.premiumOnly !== 'all') filterParams.premiumOnly = nextFilters.premiumOnly;
            if (nextFilters.sortBy) filterParams.sortBy = nextFilters.sortBy;

            const res = await axiosClient.get('/recipes/filter', { params: filterParams });
            setRecipes(res.data);

            if (res.data.length === 0) {
                toast.error("Không tìm thấy món phù hợp.");
            } else {
                toast.success(`Tìm thấy ${res.data.length} món phù hợp!`);
            }
        } catch (err) {
            toast.error("Lỗi khi áp dụng bộ lọc");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectHomeCategory = (categoryValue) => {
        const isSameCategory = filters.category === categoryValue;
        handleApplyRecipeFilters({ category: isSameCategory ? 'all' : categoryValue });
    };

    const handleClearHomeCategory = () => {
        handleApplyRecipeFilters({ category: 'all' });
    };

    const handleViewProfile = async (targetUserId) => {
        if (isGuest) {
            toast.error("Vui lòng đăng nhập để xem trang cá nhân!");
            navigate('/login');
            return;
        }
        if (!targetUserId) return;
        navigate(`/profile/${targetUserId}`);
    };
    
    const handleDeletePost = async (postId, e) => {
         if(e) {e.preventDefault();}
        const normalizedPostId = String(postId || '');
        if (!normalizedPostId) return;
        try {
            await axiosClient.delete(`/community/${normalizedPostId}?userId=${user.id}`);
            setCommunityPosts(communityPosts.filter(p => String(p.id || p._id || '') !== normalizedPostId)); 
            toast.success("Đã xóa bài viết!");
        } catch (err) { toast.error("Lỗi khi xóa bài"); console.log(err); }
    };

    const handleEditImageChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
        const normalizedType = (selectedFile.type || '').toLowerCase();
        const normalizedName = (selectedFile.name || '').toLowerCase();
        const isValidImage = validTypes.includes(normalizedType) || validExtensions.some((ext) => normalizedName.endsWith(ext));

        if (!isValidImage) {
            alert("Vui lòng chọn định dạng ảnh hợp lệ (JPG, PNG, WebP, AVIF)!");
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
        setUploadData((prev) => ({ ...prev, image: selectedFile }));
    };
        
    const handleUpdatePost = async (postId, e) => {
        if(e) e.preventDefault();
        const normalizedPostId = String(postId || '');
        if (!normalizedPostId) return;
        if (!editPostContent.trim()) return;
        if (!user?.id) return toast.error("Phiên đăng nhập hết hạn.");

        setCommunityPosts(prev => prev.map(p => 
            String(p.id || p._id || '') === normalizedPostId ? { ...p, content: editPostContent } : p
        ));
        setEditingPostId(null);

        const formData = new FormData();
        formData.append('userId', user.id);
        formData.append('content', editPostContent);
        
        if (editPostImage) formData.append('image', editPostImage);

        try {
            const res = await axiosClient.put(`/community/${normalizedPostId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.status === 200) {
                toast.success('Cập nhật thành công!');
            }
        } catch (err) {
            console.error("Chi tiết lỗi Backend:", err.response?.data || err.message);
            toast.error('Server bị lỗi khi lưu bài viết.');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPostImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmitPost = async (e) => {
         if(e) {e.preventDefault();}
        if (!user || !user.id) {
            toast.error("Vui lòng đăng nhập để thực hiện hành động này!");
            return;
        }
        if (!postContent && !postImage) return toast.error("Vui lòng nhập nội dung hoặc chọn ảnh để đăng.");

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
            toast.success("Đã đăng bài thành công!");
            
            try {
                const res = await axiosClient.get('/community');
                setCommunityPosts(res.data);
            } catch (e) {}

        } catch (err) {
            console.log(err);
            toast.error("Lỗi khi đăng bài.");
        }
    };
    
    const handleLikePost = async (postId, e) => {
         if(e) {e.preventDefault();}
        const normalizedPostId = String(postId || '');
        if (!normalizedPostId) return;
        try {
            setCommunityPosts(prevPosts => prevPosts.map(post => {
                const currentPostId = String(post.id || post._id || '');
                if (currentPostId === normalizedPostId) {
                    const currentLikes = Number(post.likes_count) || 0;
                    const newLikesCount = post.is_liked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
                    return { ...post, is_liked: !post.is_liked, likes_count: newLikesCount };
                }
                return post;
            }));

            await axiosClient.post('/community/like', { userId: user.id, postId: normalizedPostId });
            
        } catch (err) { 
            console.log(err);
            toast.error("Lỗi khi thả tim. Vui lòng thử lại.");
            const res = await axiosClient.get(`/community?userId=${user.id}`);
            setCommunityPosts(res.data);
        }
    };

    const toggleComments = async (postId, e) => {
         if(e) {e.preventDefault();}
        const normalizedPostId = String(postId || '');
        if (!normalizedPostId) return;
        if (String(activeCommentPostId) === normalizedPostId) {
            setActiveCommentPostId(null); 
        } else {
            setActiveCommentPostId(normalizedPostId); 
            const res = await axiosClient.get(`/community/comments/${normalizedPostId}`);
            setCommentsList(res.data);
        }
    };

    const handleSubmitRecipe = async () => {
        if (isGuest) return toast.error("Vui lòng đăng nhập để thực hiện hành động này!");
        if (!user || !user.id) return toast.error("Lỗi phiên đăng nhập. Vui lòng F5 lại trang.");
        if (!uploadData.name || !uploadData.name.trim()) return toast.error("Vui lòng nhập tên món ăn!");
        if (!uploadData.image) return toast.error("Vui lòng chọn ảnh cho món ăn ");
        if (uploadData.ingredients.length === 0) return toast.error("Vui lòng thêm ít nhất 1 nguyên liệu!");
        if (uploadData.steps.length === 0) return toast.error("Vui lòng thêm ít nhất 1 bước thực hiện!");
        const parsedTime = uploadData.time ? parseInt(String(uploadData.time).replace(/[^0-9]/g, '')) || 0 : 0;
        if (!parsedTime || parsedTime <= 0) return toast.error("Vui lòng nhập thời gian nấu hợp lệ (phút)!");
        const parsedCalories = uploadData.calories ? parseInt(String(uploadData.calories).replace(/[^0-9]/g, '')) || 0 : 0;
        console.log("CHUẨN BỊ GỬI:", uploadData.time, uploadData.calories);
        const formData = new FormData();
        formData.append('userId', user.id);
        formData.append('name', uploadData.name);
        formData.append('description', uploadData.description);
        formData.append('calories', uploadData.calories || 0); 
        formData.append('time', uploadData.time || 0);
        
        formData.append('img', uploadData.image);
        formData.append('ingredients', JSON.stringify(uploadData.ingredients));
        formData.append('steps', JSON.stringify(uploadData.steps));
        formData.append('video_url', uploadData.video_url || '');
        formData.append('category', uploadData.category || 'Khac');
        formData.append('meal_type', uploadData.meal_type || 'Khong_xac_dinh');
        
        formData.append('is_premium', uploadData.is_premium ? 1 : 0);

        try {
            const res = await axiosClient.post('/recipes/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                toast.success("Đăng công thức thành công!"); 
                setIsUploadModalOpen(false);
                
                setUploadData({ name: '', description: '', calories: '', time: '', image: null, ingredients: [], steps: [], video_url: '', is_premium: 0, category: 'Khac', meal_type: 'Khong_xac_dinh' });
                setUploadPreview(null);
            }
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi tải công thức lên.");
        }
    };
    const handleToggleFavorite = async (recipeId, e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        
        if (isGuest) return toast.error("Vui lòng đăng nhập để thả tim món ăn này!");
        
        const idStr = String(recipeId);
        
        const isCurrentlyLiked = favorites.includes(idStr);

        if (isCurrentlyLiked) {
            setFavorites(prev => prev.filter(id => String(id) !== idStr));
        } else {
            setFavorites(prev => [...prev, idStr]);
        }

        try {
            await axiosClient.post('/recipes/favorites/toggle', { 
                userId: String(user.id || user._id), 
                recipeId: idStr 
            });
            
            
        } catch (err) { 
            console.error("Lỗi yêu thích:", err);
            if (isCurrentlyLiked) {
                setFavorites(prev => [...prev, idStr]);
            } else {
                setFavorites(prev => prev.filter(id => String(id) !== idStr));
            }
            toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
        }
    };

    const handleChangePassword = async (e) => {
        if(isGuest) return toast.error("Vui lòng đăng nhập để thực hiện hành động này!");
        if(e) {e.preventDefault();}
        if (passwordData.new !== passwordData.confirm) return toast.error("Mật khẩu mới và xác nhận mật khẩu không khớp.");
        
        try {
            const res = await axiosClient.put('/auth/change-password', {
                userId: user.id,
                oldPassword: passwordData.old,
                newPassword: passwordData.new
            });
            if (res.data.status === 'success') {
                toast.success("Đổi mật khẩu thành công!");
                setAccountSubView('main');
                setPasswordData({ old: '', new: '', confirm: '' });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi khi đổi mật khẩu");
        }
    };

    const handleDeleteAccount = async (e) => {
        if (isGuest) return toast.error("Vui lòng đăng nhập để thực hiện hành động này!");
        if(e) {e.preventDefault();}
        
        if (window.confirm("BẠN CÓ CHẮC CHẮN? Toàn bộ dữ liệu sẽ mất vĩnh viễn!")) {
            try {
                const res = await axiosClient.delete(`/users/${user.id}`);
                if (res.data.status === 'success') {
                    toast.success("Tài khoản của bạn đã bị xóa.");
                    localStorage.clear();
                    window.location.href = '/login-register';
                }
            } catch (err) {
                console.log(err);
                toast.error(err.response?.data?.message || "Không thể xóa tài khoản lúc này.");
            }
        }
    };

    const handleToggleNotifications = async (e) => {
        if(isGuest) return toast.error("Vui lòng đăng nhập để thực hiện hành động này!");
        if(e) {e.preventDefault();}
        
        setShowNotifDropdown(!showNotifDropdown);

        if (!showNotifDropdown && unreadCount > 0) {
            try {
                await axiosClient.put('/notifications/read-all', { userId: user.id });
                setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
            } catch (err) {
                console.log("Lỗi đánh dấu đã đọc:", err);
                toast.error("Lỗi đánh dấu");
            }
        }
    };

    const handleOpenChatBot = () => {
        if (isGuest) {
            toast.error("Bạn cần đăng nhập để trò chuyện với trợ lý ảo! ");
            return;
        }
        setShowChatBot(true);
    };

    const handleLogout = () => {
        setIsConfirmModalLogOut(true);
    };

    const executeLogout = async () => {
        try {
            await axiosClient.post('/auth/logout');
            localStorage.clear();
            window.location.href = '/login-register';
        } catch(err) { console.log(err); }
    };
    const handleAcceptUpgrade = () => {
    setIsUpgradeModal(true); // Mở modal chọn gói
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
        localStorage.setItem('eatdish_active_tab', activeTab);
    }, [activeTab]);
    // Lần đầu vào trang, tải công thức và thông tin người dùng
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                let currentUser = null;
                
                try {
                    const resAuth = await axiosClient.get('/auth/me');
                    currentUser = resAuth.data.user;
                    currentUser.id = currentUser._id || currentUser.id;
                    setUser(currentUser); 
                } catch (err) {
                    setUser({
                        id: null, fullname: 'Khách', username: 'Khách',
                        avatar: `https://ui-avatars.com/api/?name=Khách&background=random&length=2&size=128`,
                        stats: { recipes: 0, followers: 0, following: 0 }
                    });
                }
                // Lấy sở thích từ localStorage để gửi kèm khi tải công thức, giúp cá nhân hóa kết quả
                // Mình sẽ lưu 3 thể loại gần nhất mà người dùng xem vào localStorage dưới dạng mảng JSON, 
                // mỗi khi tải trang sẽ gửi lên backend để ưu tiên hiển thị những món ăn thuộc các thể loại đó
                const prefs = JSON.parse(localStorage.getItem('eatdish_prefs') || '[]');
                // Chuyển mảng thành chuỗi phân cách bằng dấu phẩy để gửi lên backend
                const prefString = prefs.join(',');
                // Nếu có user thì gửi cả userId và prefs, 
                // nếu không có user thì chỉ gửi prefs thôi
                const queryParams = currentUser 
                    ? `?userId=${currentUser.id}&prefs=${prefString}` 
                    : `?prefs=${prefString}`;
                // Tải công thức, sở thích, thông báo, 
                // bài viết cộng đồng và danh sách chặn (nếu có user)
                const apiCalls = [
                    axiosClient.get(`/recipes${queryParams}`) 
                ];

                if (currentUser) {
                    apiCalls.push(
                        axiosClient.get(`/recipes/favorites/${currentUser.id}`),
                        axiosClient.get(`/notifications/${currentUser.id}`),
                        axiosClient.get(`/community?userId=${currentUser.id}`),
                        axiosClient.get(`/users/blocks?userId=${currentUser.id}`)
                    );
                }

                const results = await Promise.all(apiCalls);

                setRecipes(results[0].data);

                if (currentUser) {
                    setFavorites(results[1].data.map((f) => String(f.id || f._id || f.recipe_id || f.recipeId))); 
                    setNotifications(results[2].data);
                    setCommunityPosts(results[3].data);

                    if (results[4] && results[4].data) {
                        const blockedIdsArray = Array.isArray(results[4].data) 
                            ? results[4].data.map(item => String(item.id || item._id || item.block_id || item)) 
                            : [];
                        setBlockedUserIds(blockedIdsArray);
                    }
                }

            } catch (error) {
                console.log("Lỗi tải dữ liệu trang chủ:", error);
            }
        };

        fetchAllData();
    }, []);
    // Lấy phân loại món ăn từ backend
    useEffect(() => {
        const fetchRecipeClassifications = async () => {
            try {
                const res = await axiosClient.get('/settings/recipe-classifications');
                setRecipeClassifications({
                    categories: res?.data?.categories?.length ? res.data.categories : DEFAULT_RECIPE_CLASSIFICATIONS.categories,
                    mealTypes: res?.data?.mealTypes?.length ? res.data.mealTypes : DEFAULT_RECIPE_CLASSIFICATIONS.mealTypes
                });
            } catch (err) {
                setRecipeClassifications(DEFAULT_RECIPE_CLASSIFICATIONS);
            }
        };

        fetchRecipeClassifications();
    }, []);
    // Kiểm tra nếu có thông tin hết hạn gói Premium trong localStorage
    useEffect(() => {
        const data = localStorage.getItem('user');
        if (data) {
            const storedUser = JSON.parse(data);
            if (storedUser.premium_expired === true) {
                console.log("Phát hiện hết hạn, đang mở Modal...");
                setIsExpiredAlert(true);
                const updatedUser = { ...storedUser };
                delete updatedUser.premium_expired;
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        }
    }, []);

    const unreadCount = notifications.filter(n => n.is_read === 0).length;
    const visibleRecipes = recipes.filter(r => 
        !blockedUserIds.includes(Number(r.author_id)) && 
        !blockedUserIds.includes(Number(r.user_id))
    );

    const visibleCommunity = communityPosts.filter(p => 
        !blockedUserIds.includes(Number(p.user_id)) && 
        !blockedUserIds.includes(Number(p.author_id))
    );

    return (
        <div className="dashboard">
            
            <Sidebar 
                activeTab={activeTab}
                setActiveTab={handleTabChange} 
                onOpenUpload={isGuest ? () => toast.error("Vui lòng đăng nhập để tải công thức!") : () => setIsUploadModalOpen(true)} 
                currentUser={user} 
                unreadCount={isGuest ? 0 : unreadCount} 
            />
            
            <ChatBot isOpen={handleOpenChatBot} onClose={() => setShowChatBot(false)} />

            <main className="main-content">
                <Navbar 
                    onSearch={(keyword, e) => { 
                        if (keyword || e) {
                            handleTabChange('recipes');
                        }
                        handleSearch(keyword, e); 
                    }} 
                    onOpenFilter={() => setShowFilter(true)} 
                />
                <MobileBottomNav 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    onOpenUpload={isGuest ? () => toast.error("Vui lòng đăng nhập để tải công thức!") : () => setIsUploadModalOpen(true)} 
                    
                />
                                
                <FilterModal 
                    isOpen={showFilter}
                    onClose={() => setShowFilter(false)} 
                    onApply={handleApplyRecipeFilters}
                    initialFilters={filters}
                    categoryOptions={recipeClassifications.categories}
                    mealTypeOptions={recipeClassifications.mealTypes}
                />

                {activeTab === 'recipes' && (
                    <RecipesView 
                        recipes={visibleRecipes}
                        favorites={favorites} 
                        handleToggleFavorite={handleToggleFavorite}
                        setSelectedRecipe={handleOpenRecipe} 
                        handleViewProfile={handleViewProfile} 
                        openPublicProfile={handleViewProfile}
                        categoryOptions={recipeClassifications.categories}
                        onCategorySelect={handleSelectHomeCategory}
                        onClearCategory={handleClearHomeCategory}
                        currentCategory={filters.category}
                        currentKeyword={filters.name}
                    />
                )}

                {activeTab === 'favorites' && (
                    <FavoritesView 
                        recipes={recipes} favorites={favorites} handleToggleFavorite={handleToggleFavorite} 
                        setSelectedRecipe={handleOpenRecipe} handleViewProfile={handleViewProfile}
                    />
                )}

                {activeTab === 'community' && (
                    <CommunityView 
                        user={user} communityPosts={visibleCommunity} postContent={postContent} setPostContent={setPostContent}
                        imagePreview={imagePreview} setImagePreview={setImagePreview} postImage={postImage} setPostImage={setPostImage}
                        handleFileChange={handleFileChange} handleSubmitPost={handleSubmitPost} handleLikePost={handleLikePost}
                        handleDeletePost={handleDeletePost} handleUpdatePost={handleUpdatePost} editingPostId={editingPostId} setEditingPostId={setEditingPostId}
                        editPostContent={editPostContent} setEditPostContent={setEditPostContent} editPostImage={editPostImage}
                        setUploadData={setUploadData} setUploadPreview={setUploadPreview} setEditPostImage={setEditPostImage}
                        editImagePreview={editImagePreview} setEditImagePreview={setEditImagePreview} handleEditFileChange={handleEditImageChange}
                        toggleComments={toggleComments} activeCommentPostId={activeCommentPostId} commentsList={commentsList} setCommentsList={setCommentsList}
                        commentText={commentText} setCommentText={setCommentText} replyingTo={replyingTo} setReplyingTo={setReplyingTo} handleViewProfile={handleViewProfile} setCommunityPosts={setCommunityPosts}
                    />
                )}

                {activeTab === 'premium' && (
                    <PremiumView user={user} />
                )}

                {activeTab === 'profile' && (
                    <Profile 
                        user={user} recipes={recipes} favorites={favorites || []} handleToggleFavorite={handleToggleFavorite}
                        setSelectedRecipe={setSelectedRecipe} setActiveTab={setActiveTab} setIsEditModalOpen={setIsEditModalOpen}
                    />
                )}

                {activeTab === 'settings' && <SettingView setActiveTab={setActiveTab} handleLogout={handleLogout} />}
                
                {activeTab === 'account_settings' && (
                    <AccountSettingsView 
                        setActiveTab={setActiveTab} accountSubView={accountSubView} setAccountSubView={setAccountSubView}
                        passwordData={passwordData} setPasswordData={setPasswordData} handleChangePassword={handleChangePassword}
                        handleDeleteAccount={handleDeleteAccount}
                    />
                )}
                
                {activeTab === 'notifications_settings' && <NotificationSettingsView setActiveTab={setActiveTab} />}
            </main>

            <RightSidebar 
                user={user} unreadCount={unreadCount} notifications={notifications} showNotifDropdown={showNotifDropdown}
                handleToggleNotifications={handleToggleNotifications} handleLogout={handleLogout}
                setActiveTab={setActiveTab} handleViewProfile={handleViewProfile} onOpenPremium={() => setIsUpgradeModal(true)}
            />

            <RecipeDetailModal isOpen={!!selectedRecipe} onClose={() => setSelectedRecipe(null)} selectedRecipe={selectedRecipe} handleViewProfile={handleViewProfile} />
            <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} user={user} uploadData={uploadData} setUploadData={setUploadData} uploadPreview={uploadPreview} setUploadPreview={setUploadPreview} handleSubmitRecipe={handleSubmitRecipe} categoryOptions={recipeClassifications.categories} mealTypeOptions={recipeClassifications.mealTypes} />
            <ConfirmModal isOpen={isConfirmModalLogOut} onClose={() => setIsConfirmModalLogOut(false)} onConfirm={executeLogout} title="Đăng xuất" message="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?" />
                <ConfirmModal 
                isOpen={isExpiredAlert} 
                onClose={() => setIsExpiredAlert(false)} 
                onConfirm={handleAcceptUpgrade} 
                title="Hết Hạn Gói Premium" 
                message="Gói Premium của bạn đã hết hạn, bạn có muốn mua thêm ngay để tiếp tục sử dụng tính năng VIP không?" 
            />
            <PremiumModal 
            isOpen={isUpgradeModal} 
            onClose={() => setIsUpgradeModal(false)} 
            user={user}
        />
        </div>
    );
};

export default HomePage;