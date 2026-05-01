import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import './AdminPage.css';
import ConfirmModal from '../../components/modals/ConfirmModal';
import logo2 from '../../logo/logo2.png';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line } from 'recharts';
import RecipeDetailModal from '../../components/modals/RecipeDetailModal';
import PaymentDetailModal from '../../components/modals/PaymentDetailModal';
import AdminPackageModal from '../../components/modals/AdminPackageModal';
import AdminCouponModal from '../../components/modals/AdminCouponModal';
import PackageDetailModal from '../../components/modals/PackageDetailModal';
import AdminChatBot from '../../components/AdminChatBot';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { Scale } from 'lucide-react';
import { DEFAULT_CATEGORY_OPTIONS, DEFAULT_MEALTYPE_OPTIONS, withAllOption, toLabelMap } from '../../data/recipeClassifications';
import 'react-image-crop/dist/ReactCrop.css';

const formatRecipeClassification = (value, mapObj) => mapObj[value] || value || 'Không xác định';

const AdminPage = () => {
    let navigate = useNavigate();
    const [activityLogs, setActivityLogs] = useState([]);
    // Cập nhật State này
    const [activityLogFilter, setActivityLogFilter] = useState({
        search: '',
        startDate: '',
        endDate: '',
        actionType: ''
    });
    // State Nhật ký hoạt động
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [logToView, setLogToView] = useState(null);
    const [isDeleteLogModalOpen, setIsDeleteLogModalOpen] = useState(false);
    const [logToDelete, setLogToDelete] = useState(null);
    // State Quản lý 
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
    const [userList, setUserList] = useState([]);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [userToToggleVIP, setUserToToggleVIP] = useState(null);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [userToToggleVerify, setUserToToggleVerify] = useState(null);
    const [userFilter, setUserFilter] = useState({ search: '', role: 'all', premium: 'all', status: 'all', sortBy: 'newest' });
    const [userReports, setUserReports] = useState([]);
    const [isReportViewModalOpen, setIsReportViewModalOpen] = useState(false);
    const [selectedReportForView, setSelectedReportForView] = useState(null);
    const [isDeleteReportModalOpen, setIsDeleteReportModalOpen] = useState(false);
    const [reportToDelete, setReportToDelete] = useState(null);

    const [recipeReports, setRecipeReports] = useState([]);
    const [isRecipeReportViewModalOpen, setIsRecipeReportViewModalOpen] = useState(false);
    const [selectedRecipeReportForView, setSelectedRecipeReportForView] = useState(null);
    const [isDeleteRecipeReportModalOpen, setIsDeleteRecipeReportModalOpen] = useState(false);
    const [recipeReportToDelete, setRecipeReportToDelete] = useState(null);

    const [isErrorApp, setIsErrorApp] = useState('');

    const buildErrorMessage = (error, fallbackMessage) => {
        const responseData = error?.response?.data;
        const responseMessage = typeof responseData === 'string'
            ? responseData
            : responseData?.message || responseData?.reply || responseData?.error;
        const statusCode = error?.response?.status ? `HTTP ${error.response.status}` : '';
        const requestUrl = error?.config?.url ? `URL: ${error.config.url}` : '';
        const details = [
            fallbackMessage,
            statusCode,
            requestUrl,
            responseMessage,
            error?.message
        ].filter(Boolean);

        return details.join(' | ');
    };

    const appendAppError = (error, fallbackMessage) => {
        const message = buildErrorMessage(error, fallbackMessage);
        setIsErrorApp(prev => (prev ? `${prev}\n${message}` : message));
    };

    const [isMaintenance, setIsMaintenance] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [recipeBanner, setRecipeBanner] = useState({ banners: [] }); // Đổi từ 1 ảnh sang mảng banners
    const [originalFile, setOriginalFile] = useState(null); // File gốc vừa chọn
    const [originalImgSrc, setOriginalImgSrc] = useState(''); // Link ảnh ảo để hiện trong Modal Cắt
    const [croppedFile, setCroppedFile] = useState(null); // File SAU KHI CẮT (Dùng để up)
    const [croppedPreview, setCroppedPreview] = useState(''); // Link ảnh SAU KHI CẮT (Để xem trước)
    const [completedCrop, setCompletedCrop] = useState(null);
    // Quản lý Modal Cắt ảnh
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const imgRef = useRef(null); // Tham chiếu đến ảnh gốc
    const [crop, setCrop] = useState({
        unit: '%',
        x: 0, // Tọa độ x bắt đầu từ 0
        y: 0, // Tọa độ y bắt đầu từ 0
        width: 100, // Chiều rộng 100%
        height: 56.25 // Chiều cao = 100 / (16/9) để chuẩn tỷ lệ banner
    });
    const [cropTarget, setCropTarget] = useState({ type: null, index: null });
    const categoryActionRef = useRef(null);
    const mealTypeActionRef = useRef(null);
    const categoryImportInputRef = useRef(null);
    const mealTypeImportInputRef = useRef(null);
    const recipeImportInputRef = useRef(null);
    // Tổng quan
    const [dashboardMonth, setDashboardMonth] = useState('all');
    const [dashboardYear, setDashboardYear] = useState(new Date().getFullYear().toString());
    const [availableYears, setAvailableYears] = useState([new Date().getFullYear()]);

    // State Góp ý
    const [isDeleteFeedbackModalOpen, setIsDeleteFeedbackModalOpen] = useState(false);
    const [feedbackToDelete, setFeedbackToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [feedbackList, setFeedbackList] = useState([]);
    const [feedbackFilter, setFeedbackFilter] = useState({ search: '', type: 'all', sortBy: 'newest' });

    // State Công thức
    const [recipeToDelete, setRecipeToDelete] = useState(null);
    const [stats, setStats] = useState({ users: 0, recipes: 0, posts: 0 });
    const [favoriteStats, setFavoriteStats] = useState([]);
    const [favoriteFilter, setFavoriteFilter] = useState({ category: 'all', limit: 10 });
    const [recipes, setRecipes] = useState([]);
    const [recipeFilter, setRecipeFilter] = useState({ search: '', type: 'all', category: 'all', mealType: 'all', sortBy: 'newest' });
    const [recipeCategories, setRecipeCategories] = useState(DEFAULT_CATEGORY_OPTIONS);
    const [recipeMealTypes, setRecipeMealTypes] = useState(DEFAULT_MEALTYPE_OPTIONS);
    const [categoryDrafts, setCategoryDrafts] = useState(DEFAULT_CATEGORY_OPTIONS);
    const [mealTypeDrafts, setMealTypeDrafts] = useState(DEFAULT_MEALTYPE_OPTIONS);
    const [categoryImageUploading, setCategoryImageUploading] = useState({});

    // State Doanh thu
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [payments, setPayments] = useState([]);
    const [paymentFilter, setPaymentFilter] = useState({ search: '', status: 'all', sortBy: 'newest' });

    // State Reset Pass
    const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
    const [userToReset, setUserToReset] = useState(null);

    // STATE NEWSLETTER (GỬI EMAIL)
    const [newsletterSubject, setNewsletterSubject] = useState('');
    const [newsletterContent, setNewsletterContent] = useState('');
    const [isSendingNewsletter, setIsSendingNewsletter] = useState(false);

    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('admin_current_tab') || 'dashboard');
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Chart Data
    const [chartData, setChartData] = useState([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [paymentsByStatus, setPaymentsByStatus] = useState([]);

    // State Gói Premium
    const [isConfirmAddOpen, setIsConfirmAddOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [pkgToDelete, setPkgToDelete] = useState(null);
    const [packages, setPackages] = useState([]);
    const [isViewPackageModalOpen, setIsViewPackageModalOpen] = useState(false);
    const [pkgToView, setPkgToView] = useState(null);

    // STATE QUẢN LÝ GÓI CƯỚC
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentPkg, setCurrentPkg] = useState(null);
    const [packageFilter, setPackageFilter] = useState({ search: '', sortBy: 'newest' });

    // State Coupon
    const [couponList, setCouponList] = useState([]);
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [couponToDelete, setCouponToDelete] = useState(null);
    const [isDeleteCouponModalOpen, setIsDeleteCouponModalOpen] = useState(false);
    const [currentCoupon, setCurrentCoupon] = useState(null);
    const [isCouponEditMode, setIsCouponEditMode] = useState(false);
    const [couponFilter, setCouponFilter] = useState({ search: '', status: 'all', sortBy: 'newest' });

    // State Cộng đồng
    const [communityPosts, setCommunityPosts] = useState([]);
    const [postToDelete, setPostToDelete] = useState(null);
    const [isDeletePostModalOpen, setIsDeletePostModalOpen] = useState(false);
    const [postToApprove, setPostToApprove] = useState(null);
    const [isApprovePostModalOpen, setIsApprovePostModalOpen] = useState(false);
    // phân trang
    const [pages, setPages] = useState({
        logs: 1,
        users: 1,
        recipes: 1,
        payments: 1,
        feedbacks: 1,
        packages: 1,
        coupons: 1,
        community: 1,
        revenue: 1
    });
    const PAGE_SIZE = 10;

    const paginateData = (items, currentPage) => {
        const totalItems = items.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
        const page = Math.min(Math.max(1, currentPage), totalPages);
        const startIndex = (page - 1) * PAGE_SIZE;
        const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);

        return {
            data: items.slice(startIndex, endIndex),
            page,
            totalPages,
            totalItems,
            startIndex,
            endIndex
        };
    };

    const handlePageChange = (key, nextPage) => {
        setPages(prev => ({ ...prev, [key]: nextPage }));
    };

    const categoryFilterOptions = withAllOption(recipeCategories, 'Tất cả danh mục');
    const mealTypeFilterOptions = withAllOption(recipeMealTypes, 'Tất cả phân loại món');
    const categoryLabelMap = toLabelMap(recipeCategories);
    const mealTypeLabelMap = toLabelMap(recipeMealTypes);

    const filteredUsers = userList
        .filter(u => {
            const kw = userFilter.search.toLowerCase();
            const match = (u.fullname?.toLowerCase().includes(kw)) || (u.username?.toLowerCase().includes(kw)) || (u.email?.toLowerCase().includes(kw));
            const rMatch = userFilter.role === 'all' ? true : (userFilter.role === 'admin' ? u.role === 'admin' : u.role !== 'admin');
            const pMatch = userFilter.premium === 'all' ? true : (userFilter.premium === 'premium' ? !!u.is_premium : !u.is_premium);
            const sMatch = userFilter.status === 'all' ? true : (userFilter.status === 'active' ? !!u.is_verified : !u.is_verified);

            return match && rMatch && pMatch && sMatch;
        })
        .sort((a, b) => {
            if (userFilter.sortBy === 'name_asc') return (a.fullname || '').localeCompare(b.fullname || '');
            if (userFilter.sortBy === 'name_desc') return (b.fullname || '').localeCompare(a.fullname || '');
            return userFilter.sortBy === 'oldest' ? a.id - b.id : b.id - a.id;
        });

    const filteredRecipes = recipes
        .filter(r => {
            const kw = recipeFilter.search.toLowerCase();
            const match = (r.title?.toLowerCase().includes(kw)) || (r.author_name?.toLowerCase().includes(kw));
            let tMatch = true;
            let cMatch = true;
            let mMatch = true;
            if (recipeFilter.type === 'free') tMatch = r.is_premium === 0 || !r.is_premium;
            if (recipeFilter.type === 'premium') tMatch = r.is_premium === 1;
            if (recipeFilter.category !== 'all') cMatch = (r.category || 'Khac') === recipeFilter.category;
            if (recipeFilter.mealType !== 'all') mMatch = (r.meal_type || 'Khong_xac_dinh') === recipeFilter.mealType;
            return match && tMatch && cMatch && mMatch;
        })
        .sort((a, b) => {
            if (recipeFilter.sortBy === 'name_asc') return (a.title || '').localeCompare(b.title || '');
            if (recipeFilter.sortBy === 'name_desc') return (b.title || '').localeCompare(a.title || '');
            return recipeFilter.sortBy === 'newest' ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at);
        });

    const filteredPayments = payments
        .filter(p => {
            const kw = paymentFilter.search.toLowerCase();
            const match = (p.order_id?.toString().includes(kw)) || (p.fullname?.toLowerCase().includes(kw)) || (p.email?.toLowerCase().includes(kw));
            const st = (p.status || 'success').toLowerCase();
            let sMatch = true;
            if (paymentFilter.status === 'success') sMatch = st === 'success';
            else if (paymentFilter.status === 'pending') sMatch = st === 'pending';
            else if (paymentFilter.status === 'refunded') sMatch = st === 'refunded' || st === 'failed';
            return match && sMatch;
        })
        .sort((a, b) => {
            if (paymentFilter.sortBy === 'amount_desc') return (Number(b.amount || b.total || 0)) - (Number(a.amount || a.total || 0));
            if (paymentFilter.sortBy === 'amount_asc') return (Number(a.amount || a.total || 0)) - (Number(b.amount || b.total || 0));
            return paymentFilter.sortBy === 'newest' ? new Date(b.created_at || b.date) - new Date(a.created_at || a.date) : new Date(a.created_at || a.date) - new Date(b.created_at || b.date);
        });

    const filteredPackages = packages
        .filter(pkg => (pkg.name?.toLowerCase().includes(packageFilter.search.toLowerCase())) || (pkg.description?.toLowerCase().includes(packageFilter.search.toLowerCase())))
        .sort((a, b) => {
            if (packageFilter.sortBy === 'price_desc') return b.price - a.price;
            if (packageFilter.sortBy === 'price_asc') return a.price - b.price;
            return b.id - a.id;
        });

    const filteredCoupons = couponList
        .filter(c => c.code.toLowerCase().includes(couponFilter.search.toLowerCase()) && (couponFilter.status === 'all' || (couponFilter.status === 'active' ? c.is_active : !c.is_active)))
        .sort((a, b) => {
            if (couponFilter.sortBy === 'used_desc') return (b.used_count || 0) - (a.used_count || 0);
            if (couponFilter.sortBy === 'percent_desc') return b.percent - a.percent;
            return b.id - a.id;
        });

    const filteredCommunityPosts = [...communityPosts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const filteredFeedbacks = feedbackList
        .filter(item => {
            const kw = feedbackFilter.search.toLowerCase();
            return ((item.username?.toLowerCase().includes(kw)) || (item.email?.toLowerCase().includes(kw))) && (feedbackFilter.type === 'all' || item.type === feedbackFilter.type);
        })
        .sort((a, b) => {
            if (feedbackFilter.sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
            return new Date(b.created_at) - new Date(a.created_at);
        });

    const filteredLogs = activityLogs.filter(log => {
        const actionStr = log.action?.toLowerCase() || '';
        const adminName = log.username?.toLowerCase() || log.admin?.fullname?.toLowerCase() || log.admin?.username?.toLowerCase() || '';

        let matchSearch = true;
        if (activityLogFilter.search) {
            const searchStr = activityLogFilter.search.toLowerCase();
            matchSearch = actionStr.includes(searchStr) || adminName.includes(searchStr);
        }

        let matchType = true;
        if (activityLogFilter.actionType) {
            matchType = actionStr.includes(activityLogFilter.actionType);
        }

        let matchDate = true;
        if (activityLogFilter.startDate || activityLogFilter.endDate) {
            const logDate = new Date(log.createdAt);
            logDate.setHours(0, 0, 0, 0);

            if (activityLogFilter.startDate) {
                const start = new Date(activityLogFilter.startDate);
                start.setHours(0, 0, 0, 0);
                if (logDate < start) matchDate = false;
            }
            if (activityLogFilter.endDate) {
                const end = new Date(activityLogFilter.endDate);
                end.setHours(23, 59, 59, 999);
                if (logDate > end) matchDate = false;
            }
        }
        return matchSearch && matchType && matchDate;
    });

    const latestDashboardLogs = [...activityLogs]
        .sort((a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0))
        .slice(0, 5);

    const userPagination = paginateData(filteredUsers, pages.users);
    const recipePagination = paginateData(filteredRecipes, pages.recipes);
    const paymentPagination = paginateData(filteredPayments, pages.payments);
    const packagePagination = paginateData(filteredPackages, pages.packages);
    const couponPagination = paginateData(filteredCoupons, pages.coupons);
    const communityPagination = paginateData(filteredCommunityPosts, pages.community);
    const feedbackPagination = paginateData(filteredFeedbacks, pages.feedbacks);
    const logPagination = paginateData(filteredLogs, pages.logs);

    // Màu sắc
    const COLORS = ['#ff9f1c', '#ff7675', '#00b894', '#a29bfe'];

    // HÀM MỞ MODAL  
    const openDeleteModal = (recipe) => { setRecipeToDelete(recipe); setIsDeleteModalOpen(true); };
    const openResetPassModal = (user) => { setUserToReset(user); setIsResetPassModalOpen(true); };
    const openDetailModal = (recipe) => { setSelectedRecipeForDetail(recipe); setIsDetailModalOpen(true); };
    const handleTogglePremium = (user) => { setUserToToggleVIP(user); setIsPremiumModalOpen(true); };
    const openAddPackageModal = () => { setCurrentPkg(null); setIsEditMode(false); setIsPackageModalOpen(true); };
    const openEditPackageModal = (pkg) => { setCurrentPkg(pkg); setIsEditMode(true); setIsPackageModalOpen(true); };
    const openAddCouponModal = () => { setCurrentCoupon(null); setIsCouponEditMode(false); setIsCouponModalOpen(true); };
    const openEditCouponModal = (coupon) => { setCurrentCoupon(coupon); setIsCouponEditMode(true); setIsCouponModalOpen(true); };
    const openMaintenanceModal = () => { setIsMaintenanceModalOpen(true); };

    // dành cho điện thoại
    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        setIsMobileSidebarOpen(false);
    };
    function getCroppedImg(image, cropPixel) {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Tính kích thước thật của ảnh sau khi cắt
        canvas.width = cropPixel.width * scaleX;
        canvas.height = cropPixel.height * scaleY;
        const ctx = canvas.getContext('2d');

        // Cắt chuẩn xác theo tọa độ Pixel
        ctx.drawImage(
            image,
            cropPixel.x * scaleX,
            cropPixel.y * scaleY,
            cropPixel.width * scaleX,
            cropPixel.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error('Canvas rỗng');
                    return;
                }
                blob.name = `cropped-banner-${Date.now()}.jpeg`;
                resolve(blob);
            }, 'image/jpeg', 0.9);
        });
    }
    // EFFECTS & DATA LOADING 
    useEffect(() => {
        localStorage.setItem('admin_current_tab', activeTab);
        loadStats(); loadUsers(); loadFeedBacks(); loadPayments();
        loadUserReports(); loadRecipeReports();
        loadAllRecipes(); loadPackages(); loadCoupons(); loadCommunityPosts();
        loadActivityLogs(); loadRecipeClassifications();
    }, [activeTab]);

    // Tách riêng useEffect cho loadFavoriteStats vì nó phụ thuộc thêm vào favoriteFilter
    useEffect(() => {
        if (activeTab === 'dashboard') {
            loadFavoriteStats();
        }
    }, [activeTab, favoriteFilter.category, favoriteFilter.limit]);

    useEffect(() => {
        const activeUsersCount = userList.filter(u => u.is_verified === 1).length;
        setChartData([
            { name: 'Người dùng', count: activeUsersCount || 0 },
            { name: 'Công thức', count: stats.recipes || 0 },
            { name: 'Mã giảm giá', count: couponList.length || 0 }
        ]);
    }, [stats, couponList.length, userList]);

    useEffect(() => {
        axiosClient.get('/settings/maintenance')
            .then(res => setIsMaintenance(res.data.isMaintenance))
            .catch(err => console.log(err));

        axiosClient.get('/settings/recipe-banners')
            .then(res => {
                if (res?.data && res.data.banners) {
                    // Nếu có data từ backend thì đắp thẳng vào State
                    setRecipeBanner({ banners: res.data.banners });
                } else {
                    // Nếu rỗng thì khởi tạo mảng trống
                    setRecipeBanner({ banners: [] });
                }
            })
            .catch(err => console.log("Lỗi tải danh sách banner:", err));
    }, []);

    // API CALLS 
    const loadStats = async () => { try { const res = await axiosClient.get(`/admin/stats`); setStats(res.data); } catch (e) { } };
    const loadFavoriteStats = async () => {
        try {
            const res = await axiosClient.get(`/admin/favorite-stats`, { params: favoriteFilter });
            setFavoriteStats(res.data);
        } catch (e) { }
    };
    const loadUsers = async () => { try { const res = await axiosClient.get(`/admin/users`); setUserList(res.data); } catch (e) { } };
    const loadUserReports = async () => { try { const res = await axiosClient.get(`/admin/user-reports`); setUserReports(res.data); } catch (e) { } };
    const loadRecipeReports = async () => { try { const res = await axiosClient.get(`/admin/recipe-reports`); setRecipeReports(res.data); } catch (e) { } };
    const loadAllRecipes = async () => { try { const res = await axiosClient.get('/admin/recipes'); setRecipes(res.data); } catch (e) { } };
    const loadRecipeClassifications = async () => {
        try {
            const res = await axiosClient.get('/settings/recipe-classifications');
            const nextCategories = res?.data?.categories?.length ? res.data.categories : DEFAULT_CATEGORY_OPTIONS;
            const nextMealTypes = res?.data?.mealTypes?.length ? res.data.mealTypes : DEFAULT_MEALTYPE_OPTIONS;
            setRecipeCategories(nextCategories);
            setRecipeMealTypes(nextMealTypes);
            setCategoryDrafts(nextCategories);
            setMealTypeDrafts(nextMealTypes);
        } catch (e) {
            setRecipeCategories(DEFAULT_CATEGORY_OPTIONS);
            setRecipeMealTypes(DEFAULT_MEALTYPE_OPTIONS);
            setCategoryDrafts(DEFAULT_CATEGORY_OPTIONS);
            setMealTypeDrafts(DEFAULT_MEALTYPE_OPTIONS);
        }
    };
    const loadPayments = async () => { try { const res = await axiosClient.get('/admin/history'); setPayments(res.data); } catch (e) { } };
    const loadPackages = async () => { try { const res = await axiosClient.get('/packages'); setPackages(res.data); } catch (e) { } };
    const loadFeedBacks = async () => { try { const res = await axiosClient.get(`/admin/feedbacks`); setFeedbackList(res.data); } catch (e) { } };
    const loadCoupons = async () => { try { const res = await axiosClient.get(`/admin/coupons`); setCouponList(res.data); } catch (e) { } };
    const loadCommunityPosts = async () => { try { const res = await axiosClient.get(`/admin/community`); setCommunityPosts(res.data); } catch (e) { } };
    const loadActivityLogs = async () => { try { const res = await axiosClient.get('/admin/logs'); setActivityLogs(res.data); } catch (e) { console.log(e); } };
    // Xử lý biểu đồ doanh thu
    useEffect(() => {
        if (!payments || payments.length === 0) { setPaymentsByStatus([]); return; }
        const years = [...new Set(payments.map(p => new Date(p.created_at || p.date).getFullYear()))];
        if (!years.includes(new Date().getFullYear())) years.push(new Date().getFullYear());
        setAvailableYears(years.sort((a, b) => b - a));

        const targetYear = parseInt(dashboardYear);
        const targetMonth = dashboardMonth === 'all' ? 'all' : parseInt(dashboardMonth);
        const statusMap = {};
        let chartDataArr = targetMonth === 'all'
            ? Array.from({ length: 12 }, (_, i) => ({ name: `Tháng ${i + 1}`, revenue: 0 }))
            : Array.from({ length: new Date(targetYear, targetMonth, 0).getDate() }, (_, i) => ({ name: `Ngày ${i + 1}`, revenue: 0 }));

        payments.forEach(p => {
            const date = new Date(p.created_at || p.date);
            const pYear = date.getFullYear();
            const pMonth = date.getMonth() + 1;
            const pDay = date.getDate();

            if (pYear === targetYear) {
                if (targetMonth === 'all' || pMonth === targetMonth) {
                    const s = p.status || 'unknown';
                    statusMap[s] = (statusMap[s] || 0) + 1;
                }
                const pStatus = (p.status || 'success').toLowerCase();
                const isSuccess = pStatus === 'success';

                if (isSuccess) {
                    if (targetMonth === 'all') chartDataArr[pMonth - 1].revenue += Number(p.amount || p.total || 0);
                    else if (pMonth === targetMonth) chartDataArr[pDay - 1].revenue += Number(p.amount || p.total || 0);
                }
            }
        });
        setMonthlyRevenue(chartDataArr);
        setPaymentsByStatus(Object.keys(statusMap).map(k => ({ name: k, count: statusMap[k] })));
    }, [payments, dashboardYear, dashboardMonth]);
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => toast.success('Đã sao chép!'))
            .catch((err) => {
                console.error('Lỗi sao chép: ', err);
                appendAppError(err, 'Có lỗi ở sao chép!');
            });
    };

    // HANDLERS 
    const handleSendNewsletter = async () => {
        if (!newsletterSubject.trim() || !newsletterContent.trim()) {
            toast.error(' Vui lòng nhập đầy đủ tiêu đề và nội dung!');
            return;
        }

        if (!window.confirm("Bạn có chắc chắn muốn gửi email này đến TOÀN BỘ người dùng đã đăng ký nhận bản tin không?")) {
            return;
        }

        setIsSendingNewsletter(true);
        try {
            const formattedContent = newsletterContent.replace(/\n/g, '<br>');

            const res = await axiosClient.post('/admin/send-newsletter', {
                subject: newsletterSubject,
                htmlContent: formattedContent
            });

            toast.success(` ${res.data.message}`);
            setNewsletterSubject('');
            setNewsletterContent('');
        } catch (error) {
            toast.error(` Lỗi: ${error.response?.data?.message || 'Không thể gửi email lúc này'}`); appendAppError(error, 'Có lỗi khi gửi email!');
        } finally {
            setIsSendingNewsletter(false);
        }
    };

    const executeToggleMaintenance = async () => {
        try {
            const res = await axiosClient.post('/settings/maintenance/toggle', { status: !isMaintenance });
            setIsMaintenance(!isMaintenance);
            setIsMaintenanceModalOpen(false);
            toast.success(res.data.message);
        } catch (error) {
            toast.error("Lỗi khi thay đổi trạng thái bảo trì!");
            appendAppError(error, 'Có lỗi khi thay đổi trạng thái bảo trì!');
            setIsMaintenanceModalOpen(false);
        }
    };

    const closeCropModal = () => {
        setIsCropModalOpen(false);
        setCropTarget({ type: null, index: null });
    };

    const openCropModalWithFile = (file, type, index = null) => {
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
        const normalizedType = (file.type || '').toLowerCase();
        const normalizedName = (file.name || '').toLowerCase();
        const isValidImage = validTypes.includes(normalizedType) || validExtensions.some((ext) => normalizedName.endsWith(ext));

        if (!isValidImage) {
            toast.error('Chỉ hỗ trợ JPG, PNG, WebP hoặc AVIF');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ảnh quá lớn, vui lòng chọn ảnh dưới 5MB');
            return;
        }

        setOriginalFile(file);
        setCropTarget({ type, index });

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setOriginalImgSrc(reader.result.toString());
            setIsCropModalOpen(true);
        });
        reader.readAsDataURL(file);
    };

    const uploadImageToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const res = await axiosClient.post('/settings/upload-banners', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        return res?.data?.imageUrl;
    };

    const handleFileChange = (e) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        openCropModalWithFile(file, 'banner');
    };
    const handleConfirmCrop = async () => {
        // Kiểm tra xem đã có tọa độ pixel chưa
        if (!imgRef.current || !completedCrop || !completedCrop.width || !completedCrop.height) {
            return toast.error("Vui lòng dùng chuột kéo/chạm chọn vùng cần cắt trên ảnh!");
        }

        const toastId = toast.loading("Đang xử lý cắt ảnh...");

        try {
            const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
            const fileToUpload = new File([croppedBlob], croppedBlob.name, { type: 'image/jpeg' });

            if (cropTarget.type === 'category') {
                const targetIndex = cropTarget.index;
                if (targetIndex === null || targetIndex === undefined) {
                    toast.update(toastId, { render: "Không xác định danh mục cần cập nhật", type: "error", isLoading: false, autoClose: 2000 });
                    closeCropModal();
                    return;
                }

                setCategoryImageUploading(prev => ({ ...prev, [targetIndex]: true }));
                const uploadedUrl = await uploadImageToCloudinary(fileToUpload);

                if (!uploadedUrl) {
                    throw new Error('Upload ảnh danh mục thất bại');
                }

                handleDraftImageChange(targetIndex, uploadedUrl);
                setCategoryImageUploading(prev => ({ ...prev, [targetIndex]: false }));
                closeCropModal();
                toast.update(toastId, { render: "Đã cắt và tải ảnh danh mục lên Cloudinary", type: "success", isLoading: false, autoClose: 2200 });
                return;
            }

            setCroppedFile(fileToUpload);
            setCroppedPreview(URL.createObjectURL(croppedBlob));

            closeCropModal();
            toast.update(toastId, { render: "Đã cắt ảnh xong!", type: "success", isLoading: false, autoClose: 2000 });
        } catch (error) {
            console.log("Lỗi cắt ảnh:", error);
            if (cropTarget.type === 'category' && cropTarget.index !== null && cropTarget.index !== undefined) {
                setCategoryImageUploading(prev => ({ ...prev, [cropTarget.index]: false }));
            }
            appendAppError(error, 'Có lỗi khi cắt ảnh!');
            toast.update(toastId, { render: "Lỗi khi cắt ảnh!", type: "error", isLoading: false, autoClose: 2000 });
        }
    };
    // Hàm gọi API ném ảnh lên Cloudinary
    const handleAddNewBanner = async () => {
        if (!croppedFile) return toast.error("Vui lòng chọn và cắt 1 ảnh từ máy tính!");

        const toastId = toast.loading("Đang tải ảnh (đã cắt) lên mây Cloudinary...");

        try {
            const uploadedUrl = await uploadImageToCloudinary(croppedFile);

            if (!uploadedUrl) {
                throw new Error('Upload banner thất bại');
            }

            setRecipeBanner(prev => ({
                banners: [...(prev.banners || []), { imageUrl: uploadedUrl }]
            }));

            // Dọn dẹp ô input
            setCroppedFile(null);
            setCroppedPreview('');
            document.getElementById('banner-file-input').value = "";

            toast.update(toastId, { render: "Đã tải ảnh lên thành công!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (error) {
            console.log(error);
            appendAppError(error, 'Có lỗi khi tải ảnh lên!');
            toast.update(toastId, { render: "Lỗi khi tải ảnh lên!", type: "error", isLoading: false, autoClose: 3000 });
        }
    };

    const handleRemoveBanner = (indexToRemove) => {
        setRecipeBanner(prev => ({
            banners: prev.banners.filter((_, index) => index !== indexToRemove) // Lọc bỏ ảnh theo index
        }));
        toast.info("Đã xóa banner khỏi danh sách tạm!");
    };

    const handleSaveRecipeBanner = async () => {
        try {
            // 1. Kiểm tra xem có dữ liệu trong mảng banners không
            if (!recipeBanner.banners || recipeBanner.banners.length === 0) {
                return toast.error("Danh sách banner đang trống, hãy thêm ít nhất 1 ảnh!");
            }

            // 2. Chuẩn hóa dữ liệu để gửi lên Backend
            // Chuyển mảng hiện tại thành định dạng Backend cần: { banners: [{imageUrl: '...'}, ...] }
            const dataToSave = {
                banners: recipeBanner.banners.map(item => ({
                    imageUrl: item.imageUrl,
                    targetLink: item.targetLink || ''
                }))
            };

            const res = await axiosClient.put('/settings/recipe-banners', dataToSave);

            if (res.data.success) {
                toast.success('Đã chốt sổ danh sách banner vào Database!');
            }
        } catch (error) {
            console.error("Lỗi lưu banner:", error);
            appendAppError(error, 'Có lỗi khi lưu banner!');
            toast.error(error.response?.data?.message || 'Không thể lưu, hãy kiểm tra lại kết nối!');
        }
    };
    const confirmDeleteRecipe = async () => {
        if (!recipeToDelete) return;
        try { await axiosClient.delete(`/admin/recipes/${recipeToDelete.id}`); toast.success(`Đã xóa: ${recipeToDelete.name}`); loadAllRecipes(); }
        catch (e) { toast.error("Lỗi xóa công thức."); appendAppError(e, 'Có lỗi khi xóa công thức!'); }
    }
    const confirmDeletePost = async () => {
        if (!postToDelete) return;
        try { await axiosClient.delete(`/admin/community/${postToDelete.id}`); toast.success("Đã xóa bài viết."); setIsDeletePostModalOpen(false); loadCommunityPosts(); }
        catch (e) { toast.error("Lỗi xóa bài viết."); appendAppError(e, 'Có lỗi khi xóa bài viết!'); }
    };
    const confirmApprovePost = async () => {
        if (!postToApprove) return;
        try { await axiosClient.put(`/admin/community/${postToApprove.id}/approve`); toast.success("Đã duyệt."); setIsApprovePostModalOpen(false); loadCommunityPosts(); }
        catch (e) { toast.error("Lỗi duyệt bài."); }
    };
    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        const targetId = userToDelete._id || userToDelete.id;

        try {
            await axiosClient.delete(`/users/${targetId}`);
            toast.success(`Đã xóa: ${userToDelete.fullname}`);
            setIsDeleteUserModalOpen(false);
            loadUsers();
        }
        catch (e) { toast.error("Lỗi xóa tài khoản."); }
    };
    const confirmToggleVerify = async () => {
        if (!userToToggleVerify) return;
        const targetId = userToToggleVerify._id || userToToggleVerify.id;
        const newStatus = !userToToggleVerify.is_verified;

        try {
            await axiosClient.put(`/admin/users/${targetId}/verify`, { is_verified: newStatus });

            setUserList(prev => prev.map(u =>
                (u._id || u.id) === targetId ? { ...u, is_verified: newStatus } : u
            ));

            loadUsers();
            setIsVerifyModalOpen(false);
            toast.success(newStatus ? "Đã kích hoạt! " : "Đã khóa! ");
        } catch (err) { toast.error("Lỗi cập nhật trạng thái!"); }
    };
    const confirmResetPass = async () => {
        if (!userToReset) return;
        try { await axiosClient.put(`/admin/reset/${userToReset.id}`, { password: "123456" }); toast.success(`Reset mật khẩu thành: 123456`); }
        catch (e) { toast.error("Lỗi reset mật khẩu."); }
    };
    const confirmDeleteFeedback = async () => {
        if (!feedbackToDelete) return;
        try { await axiosClient.delete(`/admin/feedbacks/${feedbackToDelete.id}`); toast.success("Đã xóa góp ý."); loadFeedBacks(); }
        catch (e) { toast.error("Lỗi xóa góp ý."); }
    };
    const confirmTogglePremium = async () => {
        if (!userToToggleVIP) return;
        const targetId = userToToggleVIP._id || userToToggleVIP.id;

        const newStatus = !userToToggleVIP.is_premium;

        try {
            await axiosClient.put(`/admin/${targetId}/premium`, { is_premium: newStatus });

            setUserList(prev => prev.map(u =>
                (u._id || u.id) === targetId ? { ...u, is_premium: newStatus } : u
            ));

            loadUsers();
            setIsPremiumModalOpen(false);
            setUserToToggleVIP(null);
            toast.success(newStatus ? "Đã cấp VIP! 👑" : "Đã hủy VIP!");
        } catch (err) { toast.error("Lỗi cập nhật VIP!"); }
    };
    const toggleRecipeVIP = async (recipe) => {
        const newStatus = !recipe.is_premium;
        try {
            await axiosClient.put(`/admin/recipes/${recipe.id}/premium`, { is_premium: newStatus });
            loadAllRecipes();
            toast.success("Cập nhật trạng thái VIP thành công!");
        } catch (err) { toast.error("Lỗi cập nhật trạng thái VIP"); }
    };
    const updateRecipeClassification = async (recipe) => {
        try {
            await axiosClient.put(`/admin/recipes/${recipe.id}/classification`, {
                category: recipe.category || 'Khac',
                meal_type: recipe.meal_type || 'Khong_xac_dinh'
            });
            toast.success('Đã cập nhật danh mục và phân loại món!');
            loadAllRecipes();
        } catch (err) {
            toast.error('Lỗi cập nhật danh mục / phân loại món');
        }
    };

    const handleDraftLabelChange = (type, index, label) => {
        if (type === 'category') {
            setCategoryDrafts(prev => prev.map((item, idx) => idx === index ? { ...item, label } : item));
            return;
        }
        setMealTypeDrafts(prev => prev.map((item, idx) => idx === index ? { ...item, label } : item));
    };

    const handleDraftImageChange = (index, imageUrl) => {
        setCategoryDrafts(prev => prev.map((item, idx) => idx === index ? { ...item, imageUrl } : item));
    };

    const handleUploadCategoryImage = async (index, file) => {
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
        const normalizedType = (file.type || '').toLowerCase();
        const normalizedName = (file.name || '').toLowerCase();
        const isValidImage = validTypes.includes(normalizedType) || validExtensions.some((ext) => normalizedName.endsWith(ext));

        if (!isValidImage) {
            toast.error('Chỉ hỗ trợ JPG, PNG, WebP hoặc AVIF');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ảnh quá lớn, vui lòng chọn ảnh dưới 5MB');
            return;
        }

        setCategoryImageUploading(prev => ({ ...prev, [index]: true }));
        const toastId = toast.loading('Đang tải ảnh danh mục lên Cloudinary...');

        try {
            const uploadedUrl = await uploadImageToCloudinary(file);
            if (!uploadedUrl) {
                throw new Error('Upload ảnh danh mục thất bại');
            }

            handleDraftImageChange(index, uploadedUrl);
            toast.update(toastId, { render: 'Đã tải ảnh danh mục lên thành công', type: 'success', isLoading: false, autoClose: 2000 });
        } catch (error) {
            appendAppError(error, 'Có lỗi khi tải ảnh danh mục lên!');
            toast.update(toastId, { render: 'Lỗi tải ảnh danh mục', type: 'error', isLoading: false, autoClose: 2200 });
        } finally {
            setCategoryImageUploading(prev => ({ ...prev, [index]: false }));
        }
    };

    const handleAddDraftItem = (type) => {
        const newItem = type === 'category'
            ? { value: '', label: '', imageUrl: '' }
            : { value: '', label: '' };
        if (type === 'category') {
            setCategoryDrafts(prev => [...prev, newItem]);
            return;
        }
        setMealTypeDrafts(prev => [...prev, newItem]);
    };

    const handleAddDraftItemAndScroll = (type) => {
        handleAddDraftItem(type);

        window.setTimeout(() => {
            const targetRef = type === 'category' ? categoryActionRef : mealTypeActionRef;
            targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 80);
    };

    const handleRemoveDraftItem = (type, index) => {
        if (type === 'category') {
            setCategoryDrafts(prev => prev.filter((_, idx) => idx !== index));
            return;
        }
        setMealTypeDrafts(prev => prev.filter((_, idx) => idx !== index));
    };

    const saveRecipeClassifications = async () => {
        try {
            const res = await axiosClient.put('/settings/recipe-classifications', {
                categories: categoryDrafts,
                mealTypes: mealTypeDrafts
            });

            const savedCategories = res?.data?.categories?.length ? res.data.categories : DEFAULT_CATEGORY_OPTIONS;
            const savedMealTypes = res?.data?.mealTypes?.length ? res.data.mealTypes : DEFAULT_MEALTYPE_OPTIONS;

            setRecipeCategories(savedCategories);
            setRecipeMealTypes(savedMealTypes);
            setCategoryDrafts(savedCategories);
            setMealTypeDrafts(savedMealTypes);
            toast.success('Đã lưu danh mục và phân loại món');
        } catch (err) {
            toast.error('Lỗi lưu danh mục / phân loại món');
        }
    };

    const handleImportClassifications = async (e, type) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            let importedData = [];

            if (file.name.endsWith('.json')) {
                importedData = JSON.parse(text);
            } else if (file.name.endsWith('.csv')) {
                const lines = text.split('\n').filter(line => line.trim());
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                importedData = lines.slice(1).map(line => {
                    const values = line.split(',').map(v => v.trim());
                    const obj = {};
                    headers.forEach((header, idx) => {
                        if (header === 'label' || header === 'name') obj.label = values[idx];
                        if (header === 'value') obj.value = values[idx];
                        if (header === 'imageurl' || header === 'image_url') obj.imageUrl = values[idx];
                    });
                    return obj;
                });
            } else {
                toast.error('Vui lòng chọn file CSV hoặc JSON');
                return;
            }

            if (!Array.isArray(importedData) || importedData.length === 0) {
                toast.error('Dữ liệu import không hợp lệ');
                return;
            }

            const cleanedData = importedData.map(item => ({
                label: String(item.label || item.name || '').trim(),
                value: String(item.value || '').trim() || `Value_${Date.now()}`,
                ...(type === 'category' && { imageUrl: item.imageUrl || '' })
            })).filter(item => item.label);

            if (cleanedData.length === 0) {
                toast.error('Không có dữ liệu hợp lệ để import');
                return;
            }

            if (type === 'category') {
                setCategoryDrafts(prev => [...prev, ...cleanedData]);
                toast.success(`Đã import ${cleanedData.length} danh mục`);
            } else {
                setMealTypeDrafts(prev => [...prev, ...cleanedData]);
                toast.success(`Đã import ${cleanedData.length} phân loại`);
            }

            e.target.value = '';
        } catch (err) {
            toast.error('Lỗi đọc file: ' + err.message);
            e.target.value = '';
        }
    };

    const handleImportRecipes = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            let importedRecipes = [];

            if (file.name.endsWith('.json')) {
                importedRecipes = JSON.parse(text);
            } else if (file.name.endsWith('.csv')) {
                const lines = text.split('\n').filter(line => line.trim());
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                importedRecipes = lines.slice(1).map(line => {
                    const values = line.split(',').map(v => v.trim());
                    const obj = {};
                    headers.forEach((header, idx) => {
                        if (header === 'name' || header === 'title') obj.name = values[idx];
                        if (header === 'description' || header === 'desc') obj.description = values[idx];
                        if (header === 'time' || header === 'cook_time') obj.time = parseInt(values[idx]) || 0;
                        if (header === 'calories') obj.calories = parseInt(values[idx]) || 0;
                        if (header === 'ingredients') obj.ingredients = JSON.parse(values[idx]) || [];
                        if (header === 'steps' || header === 'instructions') obj.steps = JSON.parse(values[idx]) || [];
                        if (header === 'category') obj.category = values[idx];
                        if (header === 'meal_type' || header === 'mealtype') obj.meal_type = values[idx];
                        if (header === 'image' || header === 'image_url' || header === 'img') obj.img = values[idx];
                    });
                    return obj;
                });
            } else {
                toast.error('Vui lòng chọn file CSV hoặc JSON');
                return;
            }

            if (!Array.isArray(importedRecipes) || importedRecipes.length === 0) {
                toast.error('Dữ liệu import không hợp lệ');
                return;
            }

            const cleanedRecipes = importedRecipes.map(item => ({
                name: String(item.name || item.title || '').trim(),
                description: String(item.description || item.desc || '').trim(),
                time: parseInt(item.time) || 0,
                calories: parseInt(item.calories) || 0,
                ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
                steps: Array.isArray(item.steps) ? item.steps : [],
                category: String(item.category || 'Khac').trim(),
                meal_type: String(item.meal_type || 'Khong_xac_dinh').trim(),
                img: String(item.img || '').trim()
            })).filter(item => item.name);

            if (cleanedRecipes.length === 0) {
                toast.error('Không có dữ liệu công thức hợp lệ để import');
                return;
            }

            // Call backend to import recipes
            const res = await axiosClient.post('/admin/import-recipes', { recipes: cleanedRecipes });
            toast.success(`Đã import ${res.data.count || cleanedRecipes.length} công thức`);
            loadAllRecipes();
            e.target.value = '';
        } catch (err) {
            toast.error('Lỗi import công thức: ' + (err.response?.data?.message || err.message));
            e.target.value = '';
        }
    };

    const confirmAddPackage = async () => {
        try { await axiosClient.post('/admin/packages', { name: 'Gói mới', price: 0, duration_days: 30, description: '' }); toast.success("Đã thêm gói!"); setIsPackageModalOpen(false); loadPackages(); }
        catch (err) { toast.error("Lỗi thêm gói"); }
    };
    const confirmDeletePackage = async () => {
        if (!pkgToDelete) return;
        try { await axiosClient.delete(`/admin/packages/${pkgToDelete.id}`); toast.success("Đã xóa gói"); loadPackages(); setIsConfirmDeleteOpen(false); }
        catch (e) { toast.error("Lỗi xóa gói"); }
    };
    const openRecipeDetails = async (recipeOrId) => {
        const id = recipeOrId?.id ?? recipeOrId;
        if (!id) return;
        try { setIsLoading(true); const res = await axiosClient.get(`/recipes/${id}`); setSelectedRecipeForDetail(res.data); setIsDetailModalOpen(true); }
        catch (e) { toast.error('Lỗi tải chi tiết.'); } finally { setIsLoading(false); }
    };
    const handleSavePackage = async (formData) => {
        try {
            if (isEditMode && currentPkg) { await axiosClient.put(`/admin/packages/${currentPkg.id}`, formData); toast.success("Đã cập nhật!"); }
            else { await axiosClient.post('/admin/packages', formData); toast.success("Đã thêm gói!"); }
            setIsPackageModalOpen(false); loadPackages();
        } catch (err) { toast.error("Lỗi lưu gói cước!"); }
    };
    const handleSaveCoupon = async (formData) => {
        try {
            if (isCouponEditMode && currentCoupon) { await axiosClient.put(`/admin/coupons/${currentCoupon.id}`, formData); toast.success("Đã cập nhật!"); }
            else { await axiosClient.post('/admin/coupons', formData); toast.success("Đã tạo mã!"); }
            setIsCouponModalOpen(false); loadCoupons();
        } catch (e) { toast.error(e.response?.data?.message || "Lỗi tạo mã"); }
    };
    const handleDeleteCoupon = async () => {
        if (!couponToDelete) return;
        try { await axiosClient.delete(`/admin/coupons/${couponToDelete.id}`); toast.success("Đã xóa mã"); loadCoupons(); setIsDeleteCouponModalOpen(false); }
        catch (e) { toast.error("Lỗi xóa mã"); }
    };
    const handleToggleCouponStatus = async (coupon) => {
        try {
            await axiosClient.put(`/admin/coupons/${coupon.id}/status`);
            setCouponList(prevList => prevList.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
            toast.success(`Đã ${coupon.is_active ? 'tắt' : 'bật'} mã ${coupon.code}`);
        } catch (e) { toast.error("Lỗi trạng thái!"); }
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    const formatDate = (dateString) => new Date(dateString).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

    // XUẤT EXCEL
    const handleExportExcel = (data, fileName) => {
        if (!data || data.length === 0) { toast.error("Không có dữ liệu để xuất!"); return; }
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
        toast.success(`Đã xuất ${fileName}.xlsx!`);
    };
    const exportUsersToExcel = () => {
        const formattedData = userList.map(u => ({ 'ID': u.id, 'Họ Tên': u.fullname, 'Username': u.username, 'Email': u.email, 'Vai trò': u.role === 'admin' ? 'Admin' : 'User', 'VIP': u.is_premium === 1 ? 'Có' : 'Không', 'Trạng thái': u.is_verified === 1 ? 'Hoạt động' : 'Bị khóa' }));
        handleExportExcel(formattedData, 'Danh_Sach_Users');
    };
    const exportRecipesToExcel = () => {
        const formattedData = recipes.map(r => ({
            'ID': r.id,
            'Tên món': r.title,
            'Tác giả': r.author_name,
            'Danh mục món': formatRecipeClassification(r.category, categoryLabelMap),
            'Phân loại món': formatRecipeClassification(r.meal_type, mealTypeLabelMap),
            'Loại': r.is_premium === 1 ? 'Premium' : 'Free',
            'Ngày đăng': new Date(r.created_at).toLocaleString('vi-VN')
        }));
        handleExportExcel(formattedData, 'Danh_Sach_Mon_An');
    };
    const exportBillingToExcel = () => {
        const formattedData = payments.map(p => ({ 'Mã GD': p.order_id, 'Khách hàng': p.fullname || p.username, 'Email': p.email, 'Số tiền': p.amount || p.total || 0, 'Phương thức': p.method || 'PayOS', 'Trạng thái': (p.status || '').toUpperCase(), 'Ngày GD': new Date(p.created_at || p.date).toLocaleString('vi-VN') }));
        handleExportExcel(formattedData, 'Lich_Su_Giao_Dich');
    };
    const exportFeedbacksToExcel = () => {
        if (!feedbackList || feedbackList.length === 0) { toast.error("Không có góp ý để xuất!"); return; }
        const formattedData = feedbackList.map(f => ({ 'ID': f.id, 'Người gửi': f.fullname || f.username, 'Email': f.email, 'Loại': f.type, 'Nội dung': f.content, 'Ngày gửi': new Date(f.created_at).toLocaleString('vi-VN') }));
        handleExportExcel(formattedData, 'Danh_Sach_Gop_Y');
    };
    const exportActivityLogsToExcel = () => {
        if (!activityLogs || activityLogs.length === 0) { toast.error("Không có log để xuất!"); return; }
        const formattedData = activityLogs.map(log => ({ 'ID': log.id, 'Người dùng': log.username || log.fullname, 'Hành động': log.action, 'Thời gian': new Date(log.timestamp).toLocaleString('vi-VN') }));
        handleExportExcel(formattedData, 'Nhat_Ky_Hoat_Dong');
    }
    if (isLoading && !selectedRecipeForDetail) return <div className="loading-state">Đang tải dữ liệu...</div>;
    return (
        <div className='admin-container'>
            {/* SIDEBAR */}
            <div
                className={`sidebar-overlay ${isMobileSidebarOpen ? 'active' : ''}`}
                onClick={() => setIsMobileSidebarOpen(false)}
            ></div>

            {/* 2. SIDEBAR CHÍNH (CHỈ 1 LỚP DUY NHẤT) */}
            <div className={`admin-sidebar ${isMobileSidebarOpen ? 'show-mobile' : ''}`}>
                <header className="admin-logo">
                    <img src={logo2} alt="EatDish Admin" style={{ width: '60px', height: '60px', borderRadius: '15px', objectFit: 'cover' }} />
                    <div className="logo-text">ADMIN<br /><span className="logo-highlight">EATDISH</span></div>
                </header>

                <div className={`admin-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleTabClick('dashboard')}><span className="menu-icon">📊</span><span>Tổng Quan</span></div>
                <div className={`admin-menu-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => handleTabClick('users')}><span className="menu-icon">👥</span><span>Người Dùng</span></div>
                <div className={`admin-menu-item ${activeTab === 'user_reports' ? 'active' : ''}`} onClick={() => handleTabClick('user_reports')}><span className="menu-icon">🚩</span><span>Báo Cáo User</span></div>
                <div className={`admin-menu-item ${activeTab === 'recipe_reports' ? 'active' : ''}`} onClick={() => handleTabClick('recipe_reports')}><span className="menu-icon">⚠️</span><span>Báo Cáo Món</span></div>
                <div className={`admin-menu-item ${activeTab === 'recipes' ? 'active' : ''}`} onClick={() => handleTabClick('recipes')}><span className="menu-icon">🍲</span><span>Công Thức</span></div>
                <div className={`admin-menu-item ${activeTab === 'recipe_categories' ? 'active' : ''}`} onClick={() => handleTabClick('recipe_categories')}><span className="menu-icon">📚</span><span>Danh Mục Món</span></div>
                <div className={`admin-menu-item ${activeTab === 'recipe_meal_types' ? 'active' : ''}`} onClick={() => handleTabClick('recipe_meal_types')}><span className="menu-icon">🍽️</span><span>Phân Loại Món</span></div>
                <div className={`admin-menu-item ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => handleTabClick('billing')}><span className="menu-icon">💰</span><span>Doanh Thu</span></div>
                <div className={`admin-menu-item ${activeTab === 'community' ? 'active' : ''}`} onClick={() => handleTabClick('community')}><span className="menu-icon">💬</span><span>Cộng Đồng</span></div>
                <div className={`admin-menu-item ${activeTab === 'packages' ? 'active' : ''}`} onClick={() => handleTabClick('packages')}><span className="menu-icon">💎</span><span>Gói Premium</span></div>
                <div className={`admin-menu-item ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => handleTabClick('coupons')}><span className="menu-icon">🎟️</span><span>Mã Giảm Giá</span></div>
                <div className={`admin-menu-item ${activeTab === 'activity_logs' ? 'active' : ''}`} onClick={() => handleTabClick('activity_logs')}><span className="menu-icon">📝</span><span>Nhật ký Hoạt động</span></div>
                <div className={`admin-menu-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => handleTabClick('settings')}><span className="menu-icon">⚙️</span><span>Cài Đặt</span></div>
                <div className={`admin-menu-item ${activeTab === 'feedbacks' ? 'active' : ''}`} onClick={() => handleTabClick('feedbacks')}><span className="menu-icon">📭</span><span>Góp Ý</span></div>
                <div className={`admin-menu-item ${activeTab === 'newsletter' ? 'active' : ''}`} onClick={() => handleTabClick('newsletter')}><span className="menu-icon">📧</span><span>Gửi Email</span></div>

                <div className='admin-menu-item btn-home' onClick={() => navigate('/')}><span className="menu-icon">🚪</span><span>Rời trang</span></div>
            </div>

            {/* MAIN CONTENT */}
            <div className='admin-content'>

                {/* DASHBOARD */}
                {activeTab === 'dashboard' && (
                    <div className='fadeIn'>
                        <div className="admin-header-row">
                            <div className="header-mobile-wrapper">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button className="mobile-menu-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
                                    <h1 className='page-title' style={{ margin: 0 }}>Tổng quan hệ thống</h1>
                                </div>
                                {isErrorApp ? (
                                    <div className="system-status-error">
                                        Hệ thống có lỗi: {isErrorApp}
                                    </div>
                                ) : (
                                    <div className="system-status">
                                        <Scale className="system-status-icon" />
                                        <span>Hệ thống hoạt động ổn định</span>
                                    </div>
                                )}
                            </div>
                            <div className="dashboard-date-filter">
                                <span className="dashboard-date-label">📅 Xem:</span>
                                <select value={dashboardMonth} onChange={(e) => setDashboardMonth(e.target.value)} className="dashboard-date-select">
                                    <option value="all">Cả năm</option>
                                    {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
                                </select>
                                <select value={dashboardYear} onChange={(e) => setDashboardYear(e.target.value)} className="dashboard-date-select">
                                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className='dashboard-grid'>
                            <Card
                                title="USER ĐANG HOẠT ĐỘNG"
                                value={userList.filter(u => u.is_verified === true || u.is_verified === 1).length}
                                color="#0984e3"
                                icon="👤"
                            />
                            <Card title="TỔNG CÔNG THỨC" value={stats.recipes || 0} color="#00b894" icon="🍲" />
                            <Card title={dashboardMonth === 'all' ? `DOANH THU NĂM ${dashboardYear}` : `DOANH THU THÁNG ${dashboardMonth}`} value={formatCurrency(monthlyRevenue.reduce((acc, curr) => acc + curr.revenue, 0))} color="#ff9f1c" icon="💰" />
                        </div>

                        <div className="admin-chart-box" style={{ marginBottom: '25px' }}>
                            <h3 className="admin-chart-box-title">Hoạt động gần đây</h3>
                            {latestDashboardLogs.length > 0 ? (
                                <div className="dashboard-log-marquee">
                                    <div className="dashboard-log-marquee-track">
                                        {[...latestDashboardLogs, ...latestDashboardLogs].map((log, index) => (
                                            <div className="dashboard-log-item" key={`${log._id || log.id || index}-${index}`}>
                                                <span className="dashboard-log-time">{new Date(log.createdAt || log.timestamp).toLocaleString('vi-VN')}</span>
                                                <span className="dashboard-log-dot">•</span>
                                                <span className="dashboard-log-user">{log.username || log.admin?.fullname || log.admin?.username || 'Admin'}</span>
                                                <span className="dashboard-log-action">{log.action || 'Hành động hệ thống'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="admin-empty-table" style={{ paddingTop: 10, paddingBottom: 10 }}>Chưa có dữ liệu nhật ký.</div>
                            )}
                        </div>

                        <div className="admin-chart-box" style={{ marginTop: '20px' }}>
                            <h3 className="admin-chart-box-title">Thống kê chung</h3>
                            <div style={{ width: '100%', height: '350px' }}>
                                {Array.isArray(chartData) && chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: '#f9fafc' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }} />
                                            <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={60}>
                                                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="admin-empty-table" style={{ paddingTop: '150px' }}>Đang tải dữ liệu...</div>
                                )}
                            </div>
                        </div>

                        <div className="admin-chart-grid">
                            <div className="admin-chart-box">
                                <h3 className="admin-chart-box-title">Trạng thái giao dịch {dashboardMonth !== 'all' ? `(Tháng ${dashboardMonth})` : `(${dashboardYear})`}</h3>
                                <div style={{ width: '100%', height: '250px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={paymentsByStatus} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                                {paymentsByStatus.map((entry, index) => <Cell key={`status-pie-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip /><Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="admin-chart-box">
                                <h3 className="admin-chart-box-title">Biểu đồ doanh thu {dashboardMonth !== 'all' ? `(Tháng ${dashboardMonth})` : `(${dashboardYear})`}</h3>
                                <div style={{ width: '100%', height: '250px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={monthlyRevenue}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                            <YAxis tickFormatter={(value) => `${value / 1000}k`} axisLine={false} tickLine={false} />
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                            <Line type="monotone" dataKey="revenue" stroke="#ff9f1c" strokeWidth={4} dot={{ r: 4, fill: '#ff9f1c', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="admin-chart-box" style={{ marginBottom: '25px', marginTop: '25px' }}>
                            <h3 className="admin-chart-box-title">📊 Top Mã Được Sử Dụng Nhiều Nhất</h3>
                            <div style={{ width: '100%', height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={couponList.map(c => ({ name: c.code, count: c.used_count || 0 }))}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: '#f9fafc' }} contentStyle={{ borderRadius: '10px', border: 'none' }} />
                                        <Bar dataKey="count" name="Lượt dùng" fill="#00b894" radius={[10, 10, 0, 0]} barSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="admin-chart-box" style={{ marginBottom: '25px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                <h3 className="admin-chart-box-title" style={{ margin: 0 }}>❤️ Top Món Ăn Yêu Thích Nhất</h3>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select
                                        className="admin-form-input"
                                        style={{ width: 'auto', padding: '5px 10px' }}
                                        value={favoriteFilter.category}
                                        onChange={(e) => setFavoriteFilter({ ...favoriteFilter, category: e.target.value })}
                                    >
                                        <option value="all">Tất cả danh mục</option>
                                        {recipeCategories.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                    <select
                                        className="admin-form-input"
                                        style={{ width: 'auto', padding: '5px 10px' }}
                                        value={favoriteFilter.limit}
                                        onChange={(e) => setFavoriteFilter({ ...favoriteFilter, limit: parseInt(e.target.value) })}
                                    >
                                        <option value={5}>Top 5</option>
                                        <option value={10}>Top 10</option>
                                        <option value={20}>Top 20</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ width: '100%', height: '300px', marginTop: '15px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={favoriteStats} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                                        <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                                        <YAxis dataKey="title" type="category" width={150} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: '#f9fafc' }} contentStyle={{ borderRadius: '10px', border: 'none' }} />
                                        <Bar dataKey="count" name="Lượt thích" fill="#ff7675" radius={[0, 10, 10, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                )}

                {/* SETTINGS */}
                {activeTab === 'settings' && (
                    <div className='fadeIn'>
                        <div className="admin-header-row">
                            <div className="header-mobile-wrapper">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button className="mobile-menu-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
                                    <h1 className='page-title' style={{ margin: 0 }}>Cài đặt hệ thống</h1>
                                </div>
                            </div>
                        </div>

                        {/* --- KHỐI BẢO TRÌ --- */}
                        <div className="admin-chart-box" style={{ marginBottom: '25px' }}>
                            <h3 className="admin-chart-box-title">🛠️ Chế độ bảo trì</h3>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', background: '#f9fafc', padding: '20px', borderRadius: '15px', border: '1px solid #eee' }}>
                                <div>
                                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#2d3436' }}>Trạng thái hệ thống</p>
                                    <span style={{ color: isMaintenance ? '#e74c3c' : '#00b894', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: isMaintenance ? '#e74c3c' : '#00b894', display: 'inline-block' }}></span>
                                        {isMaintenance ? 'ĐANG BẢO TRÌ (Khách bị chặn)' : 'HOẠT ĐỘNG BÌNH THƯỜNG'}
                                    </span>
                                </div>
                                <button
                                    onClick={openMaintenanceModal}
                                    className={`btn-primary-admin`}
                                    style={{ backgroundColor: isMaintenance ? '#e74c3c' : '#ff9f1c', boxShadow: 'none' }}
                                >
                                    {isMaintenance ? 'Tắt Bảo Trì' : 'Bật Bảo Trì'}
                                </button>
                            </div>
                        </div>

                        {/* --- KHỐI BANNER --- */}
                        <div className="admin-chart-box" style={{ marginBottom: '25px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                                <h3 className="admin-chart-box-title" style={{ margin: 0 }}>🖼️ Quản lý Banner Giao Diện Chính</h3>
                                <button onClick={handleSaveRecipeBanner} className="btn-primary-admin" style={{ padding: '10px 25px' }}>
                                    💾 Lưu thay đổi
                                </button>
                            </div>

                            {/* Khu vực Upload */}
                            <div style={{ background: '#f9fafc', padding: '20px', borderRadius: '15px', border: '1px dashed #ccc', marginBottom: '25px' }}>
                                <label style={{ fontWeight: 'bold', color: '#2d3436', marginBottom: '10px', display: 'block' }}>Thêm Banner mới (Tỷ lệ 16:9):</label>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <input
                                        id="banner-file-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="admin-form-input"
                                        style={{ flex: 1, maxWidth: '400px', background: '#fff' }}
                                    />
                                    <button
                                        onClick={handleAddNewBanner}
                                        className="btn-primary-admin"
                                        style={{ background: '#ff9f1c', boxShadow: 'none' }}
                                        disabled={!croppedFile}
                                    >
                                        ☁️ Tải lên & Thêm
                                    </button>
                                </div>

                                {croppedPreview && (
                                    <div style={{ marginTop: '15px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                                        <div style={{ border: '2px solid #ff9f1c', padding: '5px', borderRadius: '12px', background: '#fff', display: 'inline-block' }}>
                                            <img src={croppedPreview} alt="Cropped Preview" style={{ width: '250px', height: '140px', objectFit: 'cover', borderRadius: '8px', display: 'block' }} />
                                        </div>
                                        <span style={{ color: '#ff9f1c', fontWeight: 'bold', fontSize: '13px', alignSelf: 'center' }}>✓ Ảnh đã cắt xong, sẵn sàng tải lên!</span>
                                    </div>
                                )}
                            </div>

                            {/* Danh sách Banner dạng Card (Gộp chung Ảnh + Nhập Link) */}
                            <label style={{ fontWeight: 'bold', color: '#2d3436', marginBottom: '15px', display: 'block' }}>
                                Danh sách Banner đang hiển thị ({recipeBanner.banners?.length || 0}):
                            </label>

                            {(!recipeBanner.banners || recipeBanner.banners.length === 0) ? (
                                <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center', background: '#f9fafc', borderRadius: '15px', border: '1px dashed #dfe6e9', color: '#a4b0be' }}>
                                    <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🏞️</span>
                                    Chưa có banner nào. Hãy chọn ảnh và tải lên ở khung phía trên!
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                    {recipeBanner.banners.map((banner, index) => (
                                        <div key={index} style={{
                                            border: '1px solid #eee', borderRadius: '15px', overflow: 'hidden',
                                            background: 'white', position: 'relative', boxShadow: '0 5px 15px rgba(0,0,0,0.03)',
                                            display: 'flex', flexDirection: 'column'
                                        }}>
                                            {/* Nút xóa ảnh */}
                                            <button
                                                onClick={() => handleRemoveBanner(index)}
                                                style={{
                                                    position: 'absolute', top: '10px', right: '10px',
                                                    background: '#ff7675', border: 'none', borderRadius: '50%',
                                                    width: '30px', height: '30px', cursor: 'pointer', color: '#fff',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', zIndex: 1,
                                                    boxShadow: '0 2px 5px rgba(255, 118, 117, 0.4)'
                                                }}
                                                title="Xóa banner này"
                                            >
                                                ✕
                                            </button>

                                            {/* Hình ảnh */}
                                            <img
                                                src={banner.imageUrl}
                                                alt={`Banner ${index + 1}`}
                                                style={{ width: '100%', height: '170px', objectFit: 'cover' }}
                                            />

                                            {/* Khu vực nhập Link */}
                                            <div style={{ padding: '15px', background: '#f9fafc', flex: 1 }}>
                                                <label style={{ fontSize: '13px', color: '#636e72', display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                                                    🔗 Link chuyển hướng:
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="VD: /premium hoặc https://shopee..."
                                                    value={banner.targetLink || ''}
                                                    onChange={(e) => {
                                                        const updatedBanners = [...recipeBanner.banners];
                                                        updatedBanners[index].targetLink = e.target.value;
                                                        setRecipeBanner({ banners: updatedBanners });
                                                    }}
                                                    className="admin-form-input"
                                                    style={{ padding: '10px', fontSize: '13px', background: '#fff' }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* --- MODAL CẮT ẢNH --- */}
                        {isCropModalOpen && (
                            <div className="admin-crop-modal-overlay" style={{
                                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                                background: 'rgba(0,0,0,0.85)', zIndex: 10000,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                                backdropFilter: 'blur(5px)'
                            }}>
                                <div className="admin-crop-modal-content fadeIn" style={{
                                    background: 'white', padding: '25px', borderRadius: '20px',
                                    width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                                        <h3 style={{ margin: 0, fontSize: '20px', color: '#2d3436' }}>
                                            ✂️ {cropTarget.type === 'category' ? 'Cắt ảnh Danh mục' : 'Cắt ảnh Banner'} (Tỷ lệ 16:9)
                                        </h3>
                                        <button onClick={closeCropModal} style={{ border: 'none', background: '#f1f2f6', color: '#636e72', width: '35px', height: '35px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'center', background: '#f1f2f6', borderRadius: '15px', padding: '15px', marginBottom: '25px', minHeight: '300px' }}>
                                        <ReactCrop
                                            crop={crop}
                                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                                            onComplete={(c) => setCompletedCrop(c)}
                                            aspect={16 / 9}
                                            style={{ maxWidth: '100%' }}
                                        >
                                            <img ref={imgRef} src={originalImgSrc} alt="Original" style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
                                        </ReactCrop>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                                        <button onClick={closeCropModal} className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Hủy bỏ</button>
                                        <button onClick={handleConfirmCrop} className="btn-primary-admin" style={{ borderRadius: '10px' }}>✂️ Chốt & Cắt ảnh</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* USER REPORTS */}
                {activeTab === 'user_reports' && (
                    <div className='fadeIn'>
                        <div className="admin-header-row">
                            <div className="header-mobile-wrapper">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button className="mobile-menu-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
                                    <h1 className='page-title' style={{ margin: 0 }}>Báo cáo người dùng vi phạm</h1>
                                </div>
                            </div>
                        </div>

                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Người báo cáo</th>
                                        <th>Người bị báo cáo</th>
                                        <th>Lý do</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày báo cáo</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userReports.length > 0 ? userReports.map(report => (
                                        <tr key={report.id} style={{ cursor: 'pointer' }} onClick={() => { setIsReportViewModalOpen(true); setSelectedReportForView(report); }}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <img src={report.reporter?.avatar || 'https://ui-avatars.com/api/?name=U'} alt="avt" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                                                    <span>{report.reporter?.fullname || report.reporter?.username || 'Đã xóa'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <img src={report.reportedUser?.avatar || 'https://ui-avatars.com/api/?name=U'} alt="avt" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                                                    <span>{report.reportedUser?.fullname || report.reportedUser?.username || 'Đã xóa'}</span>
                                                </div>
                                            </td>
                                            <td>{report.reason}</td>
                                            <td>
                                                <span className={`status-badge ${report.status === 'resolved' ? 'active' : (report.status === 'dismissed' ? 'inactive' : 'pending')}`}>
                                                    {report.status === 'resolved' ? 'Đã xử lý' : (report.status === 'dismissed' ? 'Bỏ qua' : 'Chờ xử lý')}
                                                </span>
                                            </td>
                                            <td>{new Date(report.createdAt).toLocaleDateString('vi-VN')}</td>
                                            <td>
                                                <div className="admin-action-btns">
                                                    {report.status === 'pending' && (
                                                        <>
                                                            <button className="btn btn-success" onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    await axiosClient.put(`/admin/user-reports/${report.id}/status`, { status: 'resolved' });
                                                                    toast.success('Đã đánh dấu là đã xử lý');
                                                                    loadUserReports();
                                                                } catch (err) { toast.error('Lỗi khi cập nhật trạng thái'); }
                                                            }}>Đã xử lý</button>
                                                            <button className="btn btn-confirm-no" onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    await axiosClient.put(`/admin/user-reports/${report.id}/status`, { status: 'dismissed' });
                                                                    toast.success('Đã đánh dấu bỏ qua');
                                                                    loadUserReports();
                                                                } catch (err) { toast.error('Lỗi khi cập nhật trạng thái'); }
                                                            }}>Bỏ qua</button>
                                                        </>
                                                    )}
                                                    <button className="btn btn-danger" onClick={(e) => {
                                                        e.stopPropagation();
                                                        setReportToDelete(report);
                                                        setIsDeleteReportModalOpen(true);
                                                    }}>Xóa</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="6" className="admin-empty-table">Không có báo cáo nào.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* RECIPE REPORTS */}
                {activeTab === 'recipe_reports' && (
                    <div className='fadeIn'>
                        <div className="admin-header-row">
                            <div className="header-mobile-wrapper">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button className="mobile-menu-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
                                    <h1 className='page-title' style={{ margin: 0 }}>Báo cáo công thức vi phạm</h1>
                                </div>
                            </div>
                        </div>

                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Người báo cáo</th>
                                        <th>Công thức bị báo cáo</th>
                                        <th>Lý do</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày báo cáo</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recipeReports.length > 0 ? recipeReports.map(report => (
                                        <tr key={report.id || report._id} onClick={() => { setIsRecipeReportViewModalOpen(true); setSelectedRecipeReportForView(report); }}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <img src={report.reporter?.avatar || 'https://ui-avatars.com/api/?name=U'} alt="avt" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                                                    <span>{report.reporter?.fullname || report.reporter?.username || 'Đã xóa'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <img src={report.reportedRecipe?.image || report.reportedRecipe?.img || 'https://via.placeholder.com/150'} alt="recipe" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                                                    <span>{report.reportedRecipe?.name || report.reportedRecipe?.title || 'Đã xóa'}</span>
                                                </div>
                                            </td>
                                            <td>{report.reason}</td>
                                            <td>
                                                <span className={`status-badge ${report.status === 'resolved' ? 'active' : (report.status === 'dismissed' ? 'inactive' : 'pending')}`}>
                                                    {report.status === 'resolved' ? 'Đã xử lý' : (report.status === 'dismissed' ? 'Bỏ qua' : 'Chờ xử lý')}
                                                </span>
                                            </td>
                                            <td>{new Date(report.createdAt).toLocaleDateString('vi-VN')}</td>
                                            <td>
                                                <div className="admin-action-btns">
                                                    {report.status === 'pending' && (
                                                        <>
                                                            <button className="btn btn-success" onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    await axiosClient.put(`/admin/recipe-reports/${report._id || report.id}/status`, { status: 'resolved' });
                                                                    toast.success('Đã đánh dấu là đã xử lý');
                                                                    loadRecipeReports();
                                                                } catch (err) { toast.error('Lỗi khi cập nhật trạng thái'); }
                                                            }}>Đã xử lý</button>
                                                            <button className="btn btn-confirm-no" onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    await axiosClient.put(`/admin/recipe-reports/${report._id || report.id}/status`, { status: 'dismissed' });
                                                                    toast.success('Đã đánh dấu bỏ qua');
                                                                    loadRecipeReports();
                                                                } catch (err) { toast.error('Lỗi khi cập nhật trạng thái'); }
                                                            }}>Bỏ qua</button>
                                                        </>
                                                    )}
                                                    <button className="btn btn-danger" onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRecipeReportToDelete(report);
                                                        setIsDeleteRecipeReportModalOpen(true);
                                                    }}>Xóa</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="6" className="admin-empty-table">Không có báo cáo công thức nào.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* USERS */}
                {activeTab === 'users' && (
                    <div className='fadeIn'>
                        <div className="admin-header-row">
                            <div className="header-mobile-wrapper">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button className="mobile-menu-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
                                    <h1 className='page-title' style={{ margin: 0 }}>Quản lý người dùng ({userList.length})</h1>
                                </div>
                            </div>
                            <button onClick={exportUsersToExcel} className="btn-primary-admin">Xuất Excel</button>
                        </div>
                        <div className="admin-filter-row">
                            <div className="admin-search-wrapper">
                                <input type="text" placeholder="Tìm tên, username, email..." value={userFilter.search} onChange={(e) => setUserFilter(prev => ({ ...prev, search: e.target.value }))} className="admin-search-input" />
                                <span className="admin-search-icon">🔍</span>
                            </div>
                            <select value={userFilter.premium} onChange={(e) => setUserFilter(prev => ({ ...prev, premium: e.target.value }))} className="admin-filter-select">
                                <option value="all">Tất cả gói</option><option value="premium">VIP</option><option value="free">Free</option>
                            </select>
                            <select value={userFilter.status} onChange={(e) => setUserFilter(prev => ({ ...prev, status: e.target.value }))} className="admin-filter-select">
                                <option value="all">Tất cả trạng thái</option><option value="active">Đang hoạt động</option><option value="locked">Bị khóa</option>
                            </select>
                            <select value={userFilter.sortBy} onChange={(e) => setUserFilter(prev => ({ ...prev, sortBy: e.target.value }))} className="admin-filter-select">
                                <option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="name_asc">A-Z Tên</option><option value="name_desc">Z-A Tên</option>
                            </select>
                        </div>

                        <div className='table-container'>
                            <table className="admin-table">
                                <thead><tr><th>Người dùng</th><th>Email / Username</th><th>Vai trò</th><th>Gói Premium</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
                                <tbody>
                                    {userPagination.data.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="admin-flex-align-center">
                                                    <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.fullname}&background=random`} className="admin-avatar-sm" alt="" />
                                                    <span className="admin-text-bold">{u.fullname}</span>
                                                </div>
                                            </td>
                                            <td>{u.email} <br /><small className="admin-text-muted">@{u.username || 'user'}</small></td>
                                            <td><span className={`admin-badge ${u.role === 'admin' ? 'warning' : 'secondary'}`}>{u.role ? u.role.toUpperCase() : 'USER'}</span></td>

                                            <td><span className={`admin-badge ${u.is_premium ? 'vip' : 'free'}`}>{u.is_premium ? '👑 VIP' : 'Free'}</span></td>
                                            <td><span className={`admin-badge ${u.is_verified ? 'success' : 'danger'}`}>{u.is_verified ? '• Active' : '• Locked'}</span></td>
                                            <td>
                                                {u.role !== 'admin' && (
                                                    <div className="admin-action-row">
                                                        <button onClick={() => { setUserToDelete(u); setIsDeleteUserModalOpen(true); }} className="btn btn-delete" title="Xóa">🗑️</button>
                                                        <button onClick={() => openResetPassModal(u)} className="btn btn-secondary" title="Reset MK">🔑</button>
                                                        <button onClick={() => handleTogglePremium(u)} className={`btn ${u.is_premium ? 'btn-danger' : 'btn-warning'}`} title="VIP">{u.is_premium ? '⇩' : '👑'}</button>
                                                        <button onClick={() => { setUserToToggleVerify(u); setIsVerifyModalOpen(true); }} className={`btn ${u.is_verified ? 'btn-secondary' : 'btn-success'}`} title="Khóa">{u.is_verified ? '🔒' : '🔓'}</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                            <AdminPagination
                                pagination={userPagination}
                                onPrev={() => handlePageChange('users', userPagination.page - 1)}
                                onNext={() => handlePageChange('users', userPagination.page + 1)}
                            />
                        </div>
                    </div>
                )}

                {/* RECIPES */}
                {activeTab === 'recipes' && (
                    <div className="fadeIn">
                        <div className="admin-header-row">
                            <div className="header-mobile-wrapper">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button className="mobile-menu-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
                                    <h1 className='page-title' style={{ margin: 0 }}>Quản lý Công Thức ({recipes.length})</h1>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={exportRecipesToExcel} className="btn-primary-admin">Xuất Excel</button>
                                <button onClick={() => recipeImportInputRef.current?.click()} className="btn btn-secondary">📥 Import CSV/JSON</button>
                                <input
                                    ref={recipeImportInputRef}
                                    type="file"
                                    accept=".csv,.json"
                                    style={{ display: 'none' }}
                                    onChange={handleImportRecipes}
                                />
                            </div>
                        </div>
                        <div className="admin-filter-row">
                            <div className="admin-search-wrapper">
                                <input type="text" placeholder="Tìm tên công thức, tác giả..." value={recipeFilter.search} onChange={(e) => setRecipeFilter(prev => ({ ...prev, search: e.target.value }))} className="admin-search-input" />
                                <span className="admin-search-icon">🔍</span>
                            </div>
                            <select value={recipeFilter.type} onChange={(e) => setRecipeFilter(prev => ({ ...prev, type: e.target.value }))} className="admin-filter-select">
                                <option value="all">Tất cả thể loại</option><option value="free">Miễn phí</option><option value="premium">Premium</option>
                            </select>
                            <select value={recipeFilter.category} onChange={(e) => setRecipeFilter(prev => ({ ...prev, category: e.target.value }))} className="admin-filter-select">
                                {categoryFilterOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            <select value={recipeFilter.mealType} onChange={(e) => setRecipeFilter(prev => ({ ...prev, mealType: e.target.value }))} className="admin-filter-select">
                                {mealTypeFilterOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            <select value={recipeFilter.sortBy} onChange={(e) => setRecipeFilter(prev => ({ ...prev, sortBy: e.target.value }))} className="admin-filter-select">
                                <option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="name_asc">A-Z</option><option value="name_desc">Z-A</option>
                            </select>
                        </div>

                        <div className="table-container">
                            <table className="admin-table">
                                <thead><tr><th>Công thức</th><th>Tác giả</th><th>Danh mục món</th><th>Phân loại món</th><th>Ngày đăng</th><th>Loại</th><th>Hành động</th></tr></thead>
                                <tbody>
                                    {recipePagination.data.map((r) => (
                                        <tr key={r.id}>
                                            <td>
                                                <div className="admin-flex-align-center">
                                                    <img src={r.image_url} alt="" className="admin-avatar-recipe" />
                                                    <span className="admin-text-bold">{r.title}</span>
                                                </div>
                                            </td>
                                            <td><span onClick={() => navigate(`/profile/${r.author_id}`)} className="admin-text-primary admin-pointer">@{r.author_name}</span></td>
                                            <td>
                                                <div>{formatRecipeClassification(r.category, categoryLabelMap)}</div>
                                            </td>
                                            <td>
                                                <div>{formatRecipeClassification(r.meal_type, mealTypeLabelMap)}</div>
                                            </td>
                                            <td className="admin-text-muted">{new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
                                            <td><span className={`admin-badge ${r.is_premium === 1 ? 'vip' : 'free'}`}>{r.is_premium === 1 ? '👑 PREMIUM' : 'Free'}</span></td>
                                            <td>
                                                <div className="admin-action-row">
                                                    <button onClick={() => openRecipeDetails(r)} className="btn btn-outline">Xem</button>
                                                    <button onClick={() => toggleRecipeVIP(r)} className={`btn ${r.is_premium ? 'btn-danger' : 'btn-warning'}`}>{r.is_premium ? 'Hủy VIP' : 'Set VIP'}</button>
                                                    <button onClick={() => openDeleteModal(r)} className="btn btn-delete">Xóa</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <AdminPagination
                                pagination={recipePagination}
                                onPrev={() => handlePageChange('recipes', recipePagination.page - 1)}
                                onNext={() => handlePageChange('recipes', recipePagination.page + 1)}
                            />
                        </div>
                    </div>
                )}
                {/* danh mục món */}
                {activeTab === 'recipe_categories' && (
                    <div className="fadeIn">
                        <div className="admin-header-row">
                            <div className="header-mobile-wrapper">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button className="mobile-menu-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
                                    <h1 className='page-title' style={{ margin: 0 }}>Quản lý Danh Mục Món</h1>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handleAddDraftItemAndScroll('category')} className="btn-primary-admin">+ Thêm danh mục</button>
                                <button onClick={() => categoryImportInputRef.current?.click()} className="btn btn-secondary">📥 Import CSV/JSON</button>
                                <input
                                    ref={categoryImportInputRef}
                                    type="file"
                                    accept=".csv,.json"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleImportClassifications(e, 'category')}
                                />
                            </div>
                        </div>

                        <div className="table-container">
                            <table className="admin-table">
                                <thead><tr><th>Tên danh mục (Tiếng Việt)</th><th>Ảnh danh mục (URL)</th><th>Hành động</th></tr></thead>
                                <tbody>
                                    {categoryDrafts.map((item, index) => (
                                        <tr key={`category-${index}`}>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="admin-search-input"
                                                    placeholder="Ví dụ: Món hấp"
                                                    value={item.label || ''}
                                                    onChange={(e) => handleDraftLabelChange('category', index, e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <input
                                                        type="text"
                                                        className="admin-search-input"
                                                        placeholder="https://..."
                                                        value={item.imageUrl || ''}
                                                        onChange={(e) => handleDraftImageChange(index, e.target.value)}
                                                    />
                                                    <label htmlFor={`category-image-upload-${index}`} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                                                        {categoryImageUploading[index] ? 'Đang tải...' : 'Chọn từ thư viện'}
                                                    </label>
                                                    <input
                                                        id={`category-image-upload-${index}`}
                                                        type="file"
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            handleUploadCategoryImage(index, file);
                                                            e.target.value = '';
                                                        }}
                                                    />
                                                    {item.imageUrl ? (
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={item.label || 'Danh mục'}
                                                            style={{ width: '46px', height: '46px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }}
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td>
                                                <button className="btn btn-delete" onClick={() => handleRemoveDraftItem('category', index)}>Xóa</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div ref={categoryActionRef} style={{ padding: '12px 4px' }}>
                                <button className="btn btn-warning" onClick={saveRecipeClassifications}>Lưu danh mục</button>
                            </div>
                        </div>
                    </div>
                )}
                {/* phân loại món */}
                {activeTab === 'recipe_meal_types' && (
                    <div className="fadeIn">
                        <div className="admin-header-row">
                            <div className="header-mobile-wrapper">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button className="mobile-menu-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
                                    <h1 className='page-title' style={{ margin: 0 }}>Quản lý Phân Loại Món</h1>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handleAddDraftItemAndScroll('mealType')} className="btn-primary-admin">+ Thêm phân loại</button>
                                <button onClick={() => mealTypeImportInputRef.current?.click()} className="btn btn-secondary">📥 Import CSV/JSON</button>
                                <input
                                    ref={mealTypeImportInputRef}
                                    type="file"
                                    accept=".csv,.json"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleImportClassifications(e, 'mealType')}
                                />
                            </div>
                        </div>

                        <div className="table-container">
                            <table className="admin-table">
                                <thead><tr><th>Tên phân loại (Tiếng Việt)</th><th>Hành động</th></tr></thead>
                                <tbody>
                                    {mealTypeDrafts.map((item, index) => (
                                        <tr key={`meal-type-${index}`}>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="admin-search-input"
                                                    placeholder="Ví dụ: Bữa khuya"
                                                    value={item.label || ''}
                                                    onChange={(e) => handleDraftLabelChange('mealType', index, e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <button className="btn btn-delete" onClick={() => handleRemoveDraftItem('mealType', index)}>Xóa</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div ref={mealTypeActionRef} style={{ padding: '12px 4px' }}>
                                <button className="btn btn-warning" onClick={saveRecipeClassifications}>Lưu phân loại</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB CỘNG ĐỒNG */}
                {activeTab === 'community' && (
                    <div className="fadeIn">
                        <div className="admin-header-row">
                            <div className="header-mobile-wrapper">
                                <button className="mobile-menu-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
                                <h1 className='page-title' style={{ margin: 0 }}>Quản lý Cộng Đồng ({communityPosts.length})</h1>
                            </div>
                        </div>
                        <div className="table-container">
                            <table className="admin-table">
                                <thead><tr><th>Tác giả</th><th>Nội dung</th><th>Ảnh đính kèm</th><th>Ngày đăng</th><th>Hành động</th></tr></thead>
                                <tbody>
                                    {communityPagination.totalItems > 0 ? communityPagination.data.map((post) => (
                                        <tr key={post.id}>
                                            <td>
                                                <div className="admin-flex-align-center">
                                                    <img src={post.avatar || `https://ui-avatars.com/api/?name=${post.fullname}`} alt="" className="admin-avatar-sm" />
                                                    <span className="admin-text-bold">{post.fullname || post.username}</span>
                                                </div>
                                            </td>
                                            <td><div className="admin-text-truncate">{post.content}</div></td>
                                            <td>{post.image_url ? <img src={post.image_url} alt="img" className="admin-avatar-recipe" /> : <span className="admin-text-muted">Không ảnh</span>}</td>
                                            <td className="admin-text-muted">{new Date(post.created_at).toLocaleDateString('vi-VN')}</td>
                                            <td><button onClick={() => { setPostToDelete(post); setIsDeletePostModalOpen(true); }} className="btn btn-delete">Xóa</button></td>
                                        </tr>
                                    )) : <tr><td colSpan="5" className="admin-empty-table">Chưa có bài đăng nào.</td></tr>}
                                </tbody>
                            </table>
                            <AdminPagination
                                pagination={communityPagination}
                                onPrev={() => handlePageChange('community', communityPagination.page - 1)}
                                onNext={() => handlePageChange('community', communityPagination.page + 1)}
                            />
                        </div>
                    </div>
                )}

                {/* BILLING */}
                {activeTab === 'billing' && (
                    <div className="fadeIn">
                        <div className="admin-header-row">
                            <div className="header-mobile-wrapper">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button className="mobile-menu-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
                                    <h1 className="page-title" style={{ margin: 0 }}>Lịch sử giao dịch</h1>
                                </div>
                            </div>
                            <button onClick={exportBillingToExcel} className="btn-primary-admin">Xuất Excel</button>
                        </div>
                        <div className="admin-filter-row">
                            <div className="admin-search-wrapper">
                                <input type="text" placeholder="Tìm mã GD, tên, email..." value={paymentFilter.search} onChange={(e) => setPaymentFilter(prev => ({ ...prev, search: e.target.value }))} className="admin-search-input" />
                                <span className="admin-search-icon">🔍</span>
                            </div>
                            <select value={paymentFilter.status} onChange={(e) => setPaymentFilter(prev => ({ ...prev, status: e.target.value }))} className="admin-filter-select">
                                <option value="all">Tất cả trạng thái</option><option value="success">Thành công</option><option value="pending">Đang chờ</option><option value="refunded">Hoàn tiền/Thất bại</option>
                            </select>
                            <select value={paymentFilter.sortBy} onChange={(e) => setPaymentFilter(prev => ({ ...prev, sortBy: e.target.value }))} className="admin-filter-select">
                                <option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="amount_desc">Tiền (Cao ➔ Thấp)</option><option value="amount_asc">Tiền (Thấp ➔ Cao)</option>
                            </select>
                        </div>

                        <div className="table-container">
                            <table className="admin-table">
                                <thead><tr><th>Mã GD</th><th>Khách hàng</th><th>Số tiền</th><th>Phương thức</th><th>Trạng thái</th><th>Ngày tạo</th><th>Chi tiết</th></tr></thead>
                                <tbody>
                                    {paymentPagination.data.map((p) => {
                                        const pStatus = (p.status || 'success').toLowerCase();
                                        const isSuccess = pStatus === 'success';
                                        return (
                                            <tr key={p.order_id || Math.random()}>
                                                <td>#{p.order_id}</td>
                                                <td><b>{p.fullname || p.username}</b><br /><small className="admin-text-muted">{p.email}</small></td>
                                                <td className="admin-text-primary">{formatCurrency(p.amount || p.total || 0)}</td>
                                                <td>{p.method || 'PayOS'}</td>
                                                <td><span className={`admin-badge ${isSuccess ? 'success' : (pStatus === 'pending' ? 'warning' : 'danger')}`}>{p.status ? p.status.toUpperCase() : 'SUCCESS'}</span></td>
                                                <td>{formatDate(p.created_at || p.date)}</td>
                                                <td><button onClick={() => { setSelectedPayment(p); setIsPaymentModalOpen(true); }} className="btn btn-secondary">Xem</button></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <AdminPagination
                                pagination={paymentPagination}
                                onPrev={() => handlePageChange('payments', paymentPagination.page - 1)}
                                onNext={() => handlePageChange('payments', paymentPagination.page + 1)}
                            />
                        </div>
                    </div>
                )}

                {/* PACKAGES */}
                {activeTab === 'packages' && (
                    <div className="fadeIn">
                        <div className="admin-header-row">
                            <div className="header-mobile-wrapper">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button className="mobile-menu-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
                                    <h1 className="page-title" style={{ margin: 0 }}>Gói Premium</h1>
                                </div>
                            </div>
                            <button onClick={openAddPackageModal} className="btn-primary-admin">+ Thêm Gói</button>
                        </div>
                        <div className="admin-filter-row">
                            <div className="admin-search-wrapper">
                                <input type="text" placeholder="Tìm gói..." value={packageFilter.search} onChange={(e) => setPackageFilter(prev => ({ ...prev, search: e.target.value }))} className="admin-search-input" />
                                <span className="admin-search-icon">🔍</span>
                            </div>
                            <select value={packageFilter.sortBy} onChange={(e) => setPackageFilter(prev => ({ ...prev, sortBy: e.target.value }))} className="admin-filter-select">
                                <option value="newest">Mới nhất</option><option value="price_desc">Giá (Cao ➔ Thấp)</option><option value="price_asc">Giá (Thấp ➔ Cao)</option>
                            </select>
                        </div>

                        <div className="package-grid">
                            {packagePagination.data
                                .map(pkg => (
                                    <div
                                        key={pkg.id}
                                        className="package-card"
                                        onClick={() => { setPkgToView(pkg); setIsViewPackageModalOpen(true); }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="admin-action-row" style={{ position: 'absolute', top: 15, right: 15 }}>
                                            <button onClick={(e) => { e.stopPropagation(); openEditPackageModal(pkg); }} className="btn-icon btn-secondary" title="Sửa">✏️</button>
                                            <button onClick={(e) => { e.stopPropagation(); setPkgToDelete(pkg); setIsConfirmDeleteOpen(true); }} className="btn-icon btn-danger" title="Xóa">🗑️</button>
                                        </div>
                                        <div className="pkg-icon-box">{pkg.duration_days >= 365 ? '👑' : '💎'}</div>
                                        <h3>{pkg.name}</h3>
                                        <div className="pkg-price">{formatCurrency(pkg.price)}</div>
                                        <span className="pkg-duration">{pkg.duration_days} ngày</span>
                                        <p className="pkg-desc">{pkg.description}</p>
                                    </div>
                                ))}
                        </div>
                        <div className="table-container" style={{ marginTop: '20px' }}>
                            <AdminPagination
                                pagination={packagePagination}
                                onPrev={() => handlePageChange('packages', packagePagination.page - 1)}
                                onNext={() => handlePageChange('packages', packagePagination.page + 1)}
                            />
                        </div>
                    </div>
                )}

                {/* COUPON  */}
                {activeTab === 'coupons' && (
                    <div className="fadeIn">
                        <div className="admin-header-row">
                            <div className="header-mobile-wrapper">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button className="mobile-menu-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
                                    <h1 className="page-title" style={{ margin: 0 }}>Quản lý Mã Giảm Giá</h1>
                                </div>
                            </div>
                            <button onClick={openAddCouponModal} className="btn-primary-admin">+ Tạo Mã</button>
                        </div>
                        <div className="admin-filter-row">
                            <div className="admin-search-wrapper">
                                <input type="text" placeholder="Tìm theo mã code..." value={couponFilter.search} onChange={(e) => setCouponFilter(prev => ({ ...prev, search: e.target.value }))} className="admin-search-input" />
                                <span className="admin-search-icon">🔍</span>
                            </div>
                            <select value={couponFilter.status} onChange={(e) => setCouponFilter(prev => ({ ...prev, status: e.target.value }))} className="admin-filter-select">
                                <option value="all">Tất cả trạng thái</option><option value="active">🟢 Đang hoạt động</option><option value="inactive">⚫ Đang tắt</option>
                            </select>
                            <select value={couponFilter.sortBy} onChange={(e) => setCouponFilter(prev => ({ ...prev, sortBy: e.target.value }))} className="admin-filter-select">
                                <option value="newest">Mới nhất</option><option value="used_desc">Lượt dùng (Cao ➔ Thấp)</option><option value="percent_desc">Giảm giá (Cao ➔ Thấp)</option>
                            </select>
                        </div>

                        <div className="table-container">
                            <table className="admin-table">
                                <thead><tr><th>Mã Code</th><th>Giảm (%)</th><th>Đã dùng</th><th>Trạng thái</th><th>Hết hạn</th><th>Hành động</th></tr></thead>
                                <tbody>
                                    {couponPagination.data.map(c => (
                                        <tr key={c.id}>
                                            <td><span onClick={() => copyToClipboard(`${c.code}`)} className="coupon-code-badge">{c.code}</span></td>
                                            <td className="admin-text-danger">-{c.percent}%</td>
                                            <td><b>{c.used_count || 0}</b> <span className="admin-text-muted">lượt</span></td>
                                            <td><span onClick={() => handleToggleCouponStatus(c)} className={`admin-badge ${c.is_active ? 'solid-success' : 'solid-secondary'} admin-pointer`}>{c.is_active ? '🟢 Đang bật' : '⚫ Đã tắt'}</span></td>
                                            <td>{c.expiry_date ? formatDate(c.expiry_date).split(' ')[1] : 'Vô thời hạn'}</td>
                                            <td>
                                                <div className="admin-action-row">
                                                    <button onClick={() => openEditCouponModal(c)} className="btn btn-secondary">✏️</button>
                                                    <button onClick={() => { setCouponToDelete(c); setIsDeleteCouponModalOpen(true); }} className="btn btn-delete">Xóa</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <AdminPagination
                                pagination={couponPagination}
                                onPrev={() => handlePageChange('coupons', couponPagination.page - 1)}
                                onNext={() => handlePageChange('coupons', couponPagination.page + 1)}
                            />
                        </div>
                    </div>
                )}
                {/* ACTIVITY LOGS */}
                {activeTab === 'activity_logs' && (
                    <div className="fadeIn">
                        {/* Phần Header của mày giữ nguyên */}
                        <div className="admin-header-row">
                            <div className="header-mobile-wrapper">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button className="mobile-menu-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
                                    <h1 className="page-title" style={{ margin: 0 }}>Nhật ký hoạt động</h1>
                                </div>
                            </div>
                            <button onClick={exportActivityLogsToExcel} className="btn-primary-admin">Xuất Excel</button>
                        </div>

                        {/* Phần Search của mày giữ nguyên */}
                        <div className="admin-filter-row">
                            {/* 1. Ô tìm kiếm chữ */}
                            <div className="admin-search-wrapper">
                                <input
                                    type="text"
                                    placeholder="Tìm tên admin, tên hành động..."
                                    value={activityLogFilter.search}
                                    onChange={(e) => setActivityLogFilter(prev => ({ ...prev, search: e.target.value }))}
                                    className="admin-search-input"
                                />
                                <span className="admin-search-icon">🔍</span>
                            </div>

                            {/* 2. Lọc theo loại hành động */}
                            <select
                                value={activityLogFilter.actionType}
                                onChange={(e) => setActivityLogFilter(prev => ({ ...prev, actionType: e.target.value }))}
                                className="admin-filter-select"
                            >
                                <option value="">Tất cả hành động</option>
                                <option value="thêm">Chỉ Thêm mới</option>
                                <option value="cập nhật">Chỉ Cập nhật/Sửa</option>
                                <option value="xóa">Chỉ Xóa</option>
                                <option value="khóa">Chỉ Khóa/Ban</option>
                            </select>

                            {/* 3. Lọc Từ ngày */}
                            <div className='filter-daystart'>
                                <label >Từ:</label>
                                <input className='admin-filter-select-date'
                                    type="date"
                                    value={activityLogFilter.startDate}
                                    onChange={(e) => setActivityLogFilter(prev => ({ ...prev, startDate: e.target.value }))}
                                />
                            </div>

                            {/* 4. Lọc Đến ngày */}
                            <div className='filter-dayend'>
                                <label>Đến:</label>
                                <input className='admin-filter-select-date'
                                    type="date"
                                    value={activityLogFilter.endDate}
                                    onChange={(e) => setActivityLogFilter(prev => ({ ...prev, endDate: e.target.value }))}
                                />
                            </div>

                            {/* Nút Xóa bộ lọc */}
                            <button
                                onClick={() => setActivityLogFilter({ search: '', startDate: '', endDate: '', actionType: '' })}
                                className='unfilter'
                            >
                                Bỏ lọc
                            </button>
                        </div>
                        <div className="admin-table-wrapper" style={{ marginTop: '20px', overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <table className="admin-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #ddd', backgroundColor: '#f8f9fa' }}>
                                        <th style={{ padding: '15px 12px' }}>Thời gian</th>
                                        <th style={{ padding: '15px 12px' }}>Người thực hiện</th>
                                        <th style={{ padding: '15px 12px' }}>Hành động</th>
                                        <th style={{ padding: '15px 12px', textAlign: 'center' }}>Chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logPagination.totalItems > 0 ? (
                                        logPagination.data.map((log, index) => (
                                            <tr key={log._id || index} style={{ borderBottom: '1px solid #eee' }} className="admin-table-row-hover">
                                                <td style={{ padding: '12px', color: '#666', fontSize: '14px', whiteSpace: 'nowrap' }}>
                                                    {new Date(log.createdAt || log.timestamp || new Date()).toLocaleString('vi-VN')}
                                                </td>
                                                <td style={{ padding: '12px', fontWeight: 'bold', color: '#2c3e50' }}>
                                                    {log.username || log.admin?.fullname || log.admin?.username || (typeof log.admin === 'string' ? log.admin : 'Admin Ẩn danh')}
                                                </td>
                                                <td style={{ padding: '12px', color: '#e74c3c', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.action}>
                                                    {log.action}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <button onClick={() => { setLogToView(log); setIsLogModalOpen(true); }} className="btn btn-secondary" style={{ marginRight: '5px' }}>Xem</button>
                                                    <button onClick={() => { setLogToDelete(log); setIsDeleteLogModalOpen(true); }} className="btn btn-danger" style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Xóa</button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                                                Không tìm thấy lịch sử hoạt động nào.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>

                            </table>
                            <AdminPagination
                                pagination={logPagination}
                                onPrev={() => handlePageChange('logs', logPagination.page - 1)}
                                onNext={() => handlePageChange('logs', logPagination.page + 1)}
                            />
                        </div>
                    </div>
                )}
                {/* FEEDBACKS */}
                {activeTab === 'feedbacks' && (
                    <div className='fadeIn'>
                        <div className="admin-header-row">
                            <div className="header-mobile-wrapper">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button className="mobile-menu-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
                                    <h1 className="page-title" style={{ margin: 0 }}>Góp ý từ người dùng</h1>
                                </div>
                            </div>
                            <button onClick={exportFeedbacksToExcel} className="btn-primary-admin">Xuất Excel</button>
                        </div>
                        <div className="admin-filter-row" >
                            <div className="admin-search-wrapper">
                                <input type="text" placeholder="Tìm tên, email..." value={feedbackFilter.search} onChange={(e) => setFeedbackFilter(prev => ({ ...prev, search: e.target.value }))} className="admin-search-input" />
                                <span className="admin-search-icon">🔍</span>
                            </div>
                            <select value={feedbackFilter.type} onChange={(e) => setFeedbackFilter(prev => ({ ...prev, type: e.target.value }))} className="admin-filter-select">
                                <option value="all">Tất cả thể loại</option><option value="feature">Tính năng</option><option value="ui">Giao diện</option><option value="bug">Lỗi</option>
                            </select>
                        </div>
                        <div className="table-container">
                            <table className="admin-table">
                                <thead><tr><th>Người gửi</th><th>Loại</th><th>Nội dung</th><th>Thời gian</th><th>Hành động</th></tr></thead>
                                <tbody>
                                    {feedbackPagination.data.map(item => {
                                        const styleMap = { bug: 'danger', feature: 'info', ui: 'warning', other: 'success' };
                                        return (
                                            <tr key={item.id}>
                                                <td><b>{item.username || "Ẩn danh"}</b><br /><small className="admin-text-muted">{item.email}</small></td>
                                                <td><span className={`admin-badge ${styleMap[item.type] || 'success'}`}>{item.type}</span></td>
                                                <td><div className="admin-text-truncate">{item.content}</div></td>
                                                <td className="admin-text-muted">{new Date(item.created_at).toLocaleString('vi-VN')}</td>
                                                <td><button onClick={() => { setFeedbackToDelete(item); setIsDeleteFeedbackModalOpen(true); }} className="btn btn-delete">Xóa</button></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <AdminPagination
                                pagination={feedbackPagination}
                                onPrev={() => handlePageChange('feedbacks', feedbackPagination.page - 1)}
                                onNext={() => handlePageChange('feedbacks', feedbackPagination.page + 1)}
                            />
                        </div>
                    </div>
                )}

                {/* NEWSLETTER (GỬI EMAIL) */}
                {activeTab === 'newsletter' && (
                    <div className='fadeIn'>
                        <div className="admin-header-row">
                            <div className="header-mobile-wrapper">
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button className="mobile-menu-toggle" onClick={() => setIsMobileSidebarOpen(true)}>☰</button>
                                    <h1 className='page-title'>Chiến Dịch Email 🚀</h1>
                                </div>
                            </div>
                        </div>
                        <p style={{ color: '#666', marginBottom: '20px' }}>Gửi bản tin ưu đãi, thông báo tính năng mới đến cộng đồng EatDish.</p>

                        <div className="admin-filter-row" style={{ display: 'block', background: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                            <label className="feedback-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#333' }}>Tiêu đề Email:</label>
                            <input
                                type="text"
                                placeholder="VD: Top 5 Công thức Hot Nhất Tuần Qua!"
                                value={newsletterSubject}
                                onChange={(e) => setNewsletterSubject(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px', fontSize: '15px' }}
                            />

                            <label className="feedback-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#333' }}>Nội dung (Hỗ trợ thẻ HTML cơ bản: &lt;b&gt;, &lt;br&gt;, &lt;i&gt;):</label>
                            <textarea
                                placeholder="Nhập nội dung thư vào đây...&#10;Có thể dùng <br> để xuống dòng, <b>chữ đậm</b>..."
                                style={{ width: '100%', minHeight: '200px', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px', resize: 'vertical', fontSize: '15px', fontFamily: 'inherit' }}
                                value={newsletterContent}
                                onChange={(e) => setNewsletterContent(e.target.value)}
                            ></textarea>

                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#666', border: '1px dashed #ccc' }}>
                                💡 <b>Mẹo:</b> Hệ thống đã tự động bao bọc bức thư bằng một khung viền đẹp, chèn logo EatDish lên trên cùng và gắn nút "Hủy đăng ký" ở dưới cùng. Bạn chỉ cần nhập đúng phần nội dung cốt lõi của bức thư thôi nhé!
                            </div>

                            <button
                                onClick={handleSendNewsletter}
                                disabled={isSendingNewsletter}
                                style={{
                                    background: isSendingNewsletter ? '#ccc' : '#e74c3c',
                                    color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '8px',
                                    cursor: isSendingNewsletter ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '15px',
                                    transition: '0.3s'
                                }}
                            >
                                {isSendingNewsletter ? 'Đang gửi tên lửa đi... 🚀' : 'Phát Sóng Hàng Loạt 📢'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            <ConfirmModal isOpen={isDeleteLogModalOpen} onClose={() => setIsDeleteLogModalOpen(false)} onConfirm={async () => {
                try {
                    await axiosClient.delete(`/admin/logs/${logToDelete._id}`);
                    toast.success("Đã xóa nhật ký hoạt động!");
                    setActivityLogs(prev => prev.filter(l => l._id !== logToDelete._id));
                    setIsDeleteLogModalOpen(false);
                    setLogToDelete(null);
                } catch (error) {
                    toast.error("Lỗi khi xóa nhật ký hoạt động!");
                }
            }} title="Xóa nhật ký" message="Bạn có chắc chắn muốn xóa nhật ký hoạt động này?" />
            <AdminPackageModal isOpen={isPackageModalOpen} onClose={() => setIsPackageModalOpen(false)} onSubmit={handleSavePackage} initialData={currentPkg} isEditMode={isEditMode} />
            <AdminCouponModal isOpen={isCouponModalOpen} onClose={() => setIsCouponModalOpen(false)} onSubmit={handleSaveCoupon} initialData={currentCoupon} isEditMode={isCouponEditMode} />
            <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDeleteRecipe} title="Xóa công thức" message={recipeToDelete ? <>Bạn có chắc muốn xóa món <b>{recipeToDelete.title}</b>?</> : ""} />
            <ConfirmModal isOpen={isDeleteUserModalOpen} onClose={() => setIsDeleteUserModalOpen(false)} onConfirm={confirmDeleteUser} title="Xóa người dùng" message={userToDelete ? <>Xóa vĩnh viễn tài khoản <b>@{userToDelete.username}</b>?</> : ""} />
            <ConfirmModal isOpen={isDeleteFeedbackModalOpen} onClose={() => setIsDeleteFeedbackModalOpen(false)} onConfirm={confirmDeleteFeedback} title="Xóa góp ý" message="Bạn muốn xóa phản hồi này?" />
            <ConfirmModal isOpen={isResetPassModalOpen} onClose={() => setIsResetPassModalOpen(false)} onConfirm={confirmResetPass} title="Reset mật khẩu" message="Mật khẩu sẽ về mặc định: 123456" />
            <ConfirmModal isOpen={isPremiumModalOpen} onClose={() => setIsPremiumModalOpen(false)} onConfirm={confirmTogglePremium} title={userToToggleVIP?.is_premium === 1 ? "Hủy VIP ❌" : "Cấp VIP 👑"} message={userToToggleVIP ? <>Thay đổi trạng thái Premium cho <b>{userToToggleVIP.fullname}</b>?</> : ""} />
            <ConfirmModal isOpen={isVerifyModalOpen} onClose={() => setIsVerifyModalOpen(false)} onConfirm={confirmToggleVerify} title={userToToggleVerify?.is_verified === 1 ? "Khóa tài khoản" : "Mở khóa tài khoản"} message="Người dùng bị khóa sẽ không thể đăng nhập." />
            <ConfirmModal isOpen={isDeletePostModalOpen} onClose={() => setIsDeletePostModalOpen(false)} onConfirm={confirmDeletePost} title="Xóa bài viết" message="Bạn có chắc chắn muốn xóa bài viết này khỏi cộng đồng?" />
            <ConfirmModal isOpen={isApprovePostModalOpen} onClose={() => setIsApprovePostModalOpen(false)} onConfirm={confirmApprovePost} title="Duyệt bài viết" message="Cho phép bài viết này hiển thị công khai trong cộng đồng?" />
            <ConfirmModal isOpen={isConfirmAddOpen} onClose={() => setIsConfirmAddOpen(false)} onConfirm={confirmAddPackage} title="Thêm gói" message="Tạo gói cước mới này?" />
            <ConfirmModal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} onConfirm={confirmDeletePackage} title="Xóa gói" message="Xóa gói cước này?" />
            <ConfirmModal isOpen={isDeleteCouponModalOpen} onClose={() => setIsDeleteCouponModalOpen(false)} onConfirm={handleDeleteCoupon} title="Xóa mã" message="Xóa vĩnh viễn mã giảm giá này?" />
            <ConfirmModal
                isOpen={isMaintenanceModalOpen}
                onClose={() => setIsMaintenanceModalOpen(false)}
                onConfirm={executeToggleMaintenance}
                title={isMaintenance ? "Tắt Bảo Trì 🟢" : "Bật Bảo Trì 🛠️"}
                message={isMaintenance ? "Trang web sẽ hoạt động lại bình thường, mở cửa đón khách." : "Bật chế độ tu luyện? Khách hàng sẽ bị chuyển sang trang bảo trì, chỉ Admin mới vào được."}
            />
            <PackageDetailModal
                isOpen={isViewPackageModalOpen}
                onClose={() => setIsViewPackageModalOpen(false)}
                pkg={pkgToView}
            />

            {isLogModalOpen && logToView && (
                <div className="confirm-overlay" style={{ zIndex: 1050 }}>
                    <div className="fadeIn confirm-content" style={{ maxWidth: '550px', width: '90%', textAlign: 'left' }}>
                        <h3 className="confirm-title" style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Chi tiết hoạt động</h3>

                        <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#636e72' }}>Thời gian: </strong>
                            {new Date(logToView.createdAt || logToView.timestamp || new Date()).toLocaleString('vi-VN')}
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#636e72' }}>Người thực hiện: </strong>
                            {logToView.username || logToView.admin?.fullname || logToView.admin?.username || (typeof logToView.admin === 'string' ? logToView.admin : 'Admin Ẩn danh')}
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#636e72', display: 'block', marginBottom: '8px' }}>Nội dung hành động: </strong>
                            <div style={{ padding: '12px', background: '#fdf0ed', borderRadius: '8px', border: '1px solid #fadcd6', color: '#e74c3c', maxHeight: '300px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6' }}>
                                {logToView.action}
                            </div>
                        </div>

                        <div className="confirm-btn-row" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn-confirm-no" style={{ padding: '8px 20px' }} onClick={() => setIsLogModalOpen(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {isReportViewModalOpen && selectedReportForView && (
                <div className="confirm-overlay" style={{ zIndex: 1050 }}>
                    <div className="fadeIn confirm-content" style={{ maxWidth: '550px', width: '90%', textAlign: 'left' }}>
                        <h3 className="confirm-title" style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Chi tiết báo cáo vi phạm</h3>

                        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <strong style={{ color: '#636e72', width: '120px' }}>Người báo cáo: </strong>
                            <img src={selectedReportForView.reporter?.avatar || 'https://ui-avatars.com/api/?name=U'} alt="avt" style={{ width: '25px', height: '25px', borderRadius: '50%' }} />
                            <span>{selectedReportForView.reporter?.fullname || selectedReportForView.reporter?.username || 'Người dùng đã xóa'}</span>
                        </div>
                        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <strong style={{ color: '#636e72', width: '120px' }}>Bị báo cáo: </strong>
                            <img src={selectedReportForView.reportedUser?.avatar || 'https://ui-avatars.com/api/?name=U'} alt="avt" style={{ width: '25px', height: '25px', borderRadius: '50%' }} />
                            <span>{selectedReportForView.reportedUser?.fullname || selectedReportForView.reportedUser?.username || 'Người dùng đã xóa'}</span>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#636e72' }}>Ngày báo cáo: </strong>
                            {new Date(selectedReportForView.createdAt).toLocaleString('vi-VN')}
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#636e72' }}>Trạng thái: </strong>
                            <span className={`status-badge ${selectedReportForView.status === 'resolved' ? 'active' : (selectedReportForView.status === 'dismissed' ? 'inactive' : 'pending')}`} style={{ padding: '4px 10px', fontSize: '13px' }}>
                                {selectedReportForView.status === 'resolved' ? 'Đã xử lý' : (selectedReportForView.status === 'dismissed' ? 'Bỏ qua' : 'Chờ xử lý')}
                            </span>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#636e72', display: 'block', marginBottom: '8px' }}>Lý do / Nội dung báo cáo: </strong>
                            <div style={{ padding: '12px', background: '#fdf0ed', borderRadius: '8px', border: '1px solid #fadcd6', color: '#e74c3c', maxHeight: '300px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6' }}>
                                {selectedReportForView.reason}
                            </div>
                        </div>

                        <div className="confirm-btn-row" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="btn-confirm-no" style={{ padding: '8px 20px' }} onClick={() => setIsReportViewModalOpen(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            <RecipeDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} selectedRecipe={selectedRecipeForDetail} />
            <PaymentDetailModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} payment={selectedPayment} />
            
            <ConfirmModal 
                isOpen={isDeleteReportModalOpen} 
                onClose={() => setIsDeleteReportModalOpen(false)} 
                onConfirm={async () => {
                    if (!reportToDelete) return;
                    try {
                        await axiosClient.delete(`/admin/user-reports/${reportToDelete.id}`);
                        toast.success("Xóa báo cáo thành công");
                        loadUserReports();
                        setIsDeleteReportModalOpen(false);
                    } catch (e) {
                        toast.error("Lỗi khi xóa báo cáo");
                    }
                }} 
                title="Xóa Báo cáo" 
                message={<span>Chắc chắn xóa báo cáo vi phạm này? Hành động này không thể hoàn tác.</span>} 
            />

            {isRecipeReportViewModalOpen && selectedRecipeReportForView && (
                <div className="confirm-overlay" style={{ zIndex: 1050 }}>
                    <div className="fadeIn confirm-content" style={{ maxWidth: '550px', width: '90%', textAlign: 'left' }}>
                        <h3 className="confirm-title" style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Chi tiết báo cáo công thức</h3>

                        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <strong style={{ color: '#636e72', width: '120px' }}>Người báo cáo: </strong>
                            <img src={selectedRecipeReportForView.reporter?.avatar || 'https://ui-avatars.com/api/?name=U'} alt="avt" style={{ width: '25px', height: '25px', borderRadius: '50%' }} />
                            <span>{selectedRecipeReportForView.reporter?.fullname || selectedRecipeReportForView.reporter?.username || 'Người dùng đã xóa'}</span>
                        </div>
                        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <strong style={{ color: '#636e72', width: '120px' }}>Món bị báo cáo: </strong>
                            <img src={selectedRecipeReportForView.reportedRecipe?.image || selectedRecipeReportForView.reportedRecipe?.img || 'https://via.placeholder.com/150'} alt="recipe" style={{ width: '40px', height: '40px', borderRadius: '5px', objectFit: 'cover' }} />
                            <span>{selectedRecipeReportForView.reportedRecipe?.name || selectedRecipeReportForView.reportedRecipe?.title || 'Đã xóa'}</span>
                        </div>
                        {selectedRecipeReportForView.reportedRecipe?.author && (
                            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <strong style={{ color: '#636e72', width: '120px' }}>Tác giả món ăn: </strong>
                                <img src={selectedRecipeReportForView.reportedRecipe.author?.avatar || 'https://ui-avatars.com/api/?name=U'} alt="author" style={{ width: '25px', height: '25px', borderRadius: '50%' }} />
                                <span>{selectedRecipeReportForView.reportedRecipe.author?.fullname || selectedRecipeReportForView.reportedRecipe.author?.username}</span>
                            </div>
                        )}
                        <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#636e72' }}>Ngày báo cáo: </strong>
                            {new Date(selectedRecipeReportForView.createdAt).toLocaleString('vi-VN')}
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#636e72' }}>Trạng thái: </strong>
                            <span className={`status-badge ${selectedRecipeReportForView.status === 'resolved' ? 'active' : (selectedRecipeReportForView.status === 'dismissed' ? 'inactive' : 'pending')}`} style={{ padding: '4px 10px', fontSize: '13px' }}>
                                {selectedRecipeReportForView.status === 'resolved' ? 'Đã xử lý' : (selectedRecipeReportForView.status === 'dismissed' ? 'Bỏ qua' : 'Chờ xử lý')}
                            </span>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#636e72', display: 'block', marginBottom: '8px' }}>Lý do / Nội dung báo cáo: </strong>
                            <div style={{ padding: '12px', background: '#fdf0ed', borderRadius: '8px', border: '1px solid #fadcd6', color: '#e74c3c', maxHeight: '300px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6' }}>
                                {selectedRecipeReportForView.reason}
                            </div>
                        </div>

                        <div className="confirm-btn-row" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="btn-confirm-no" style={{ padding: '8px 20px' }} onClick={() => setIsRecipeReportViewModalOpen(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={isDeleteRecipeReportModalOpen} 
                onClose={() => setIsDeleteRecipeReportModalOpen(false)} 
                onConfirm={async () => {
                    if (!recipeReportToDelete) return;
                    try {
                        await axiosClient.delete(`/admin/recipe-reports/${recipeReportToDelete._id || recipeReportToDelete.id}`);
                        toast.success("Xóa báo cáo thành công");
                        loadRecipeReports();
                        setIsDeleteRecipeReportModalOpen(false);
                    } catch (e) {
                        toast.error("Lỗi khi xóa báo cáo");
                    }
                }} 
                title="Xóa Báo cáo Công thức" 
                message={<span>Chắc chắn xóa báo cáo vi phạm này? Hành động này không thể hoàn tác.</span>} 
            />

            <AdminChatBot />
        </div>
    );
};

const Card = ({ title, value, color, icon }) => (
    <div className="stat-card">
        <div className="stat-icon" style={{ color: color, background: `${color}15` }}>
            {icon}
        </div>
        <div className="stat-card-wrapper">
            <b className="stat-card-val">{value}</b>
            <span className="stat-card-title-text">{title}</span>
        </div>
    </div>
);

const AdminPagination = ({ pagination, onPrev, onNext }) => (
    <div className="admin-pagination">
        <div className="pagination-info">
            Hiển thị <b>{pagination.totalItems === 0 ? 0 : pagination.startIndex + 1}</b> đến <b>{pagination.endIndex}</b> trong tổng số <b>{pagination.totalItems}</b> kết quả
        </div>

        <div className="pagination-controls">
            <button
                disabled={pagination.page === 1}
                onClick={onPrev}
                className="btn-page"
            >
                &#10094;
            </button>

            <span className="page-info">
                Trang {pagination.page} / {pagination.totalPages}
            </span>

            <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={onNext}
                className="btn-page"
            >
                &#10095;
            </button>
        </div>
    </div>
);

export default AdminPage;