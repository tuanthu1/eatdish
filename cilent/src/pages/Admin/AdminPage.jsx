import React, { useState, useEffect } from 'react';
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

const AdminPage = () => {
    let navigate = useNavigate();

    // State Quản lý 
    const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
    const [userList, setUserList] = useState([]);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [userToToggleVIP, setUserToToggleVIP] = useState(null);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [userToToggleVerify, setUserToToggleVerify] = useState(null);

    // State Góp ý
    const [isDeleteFeedbackModalOpen, setIsDeleteFeedbackModalOpen] = useState(false);
    const [feedbackToDelete, setFeedbackToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    // State Công thức
    const [recipeToDelete, setRecipeToDelete] = useState(null);
    const [stats, setStats] = useState({ users: 0, recipes: 0, posts: 0 }); 
    const [pendingRecipes, setPendingRecipes] = useState([]);
    const [recipes, setRecipes] = useState([]);
    
    // State Duyệt bài
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [recipeToApprove, setRecipeToApprove] = useState(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [recipeToReject, setRecipeToReject] = useState(null);

    // State Reset Pass
    const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
    const [userToReset, setUserToReset] = useState(null);

    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('admin_current_tab') || 'dashboard';
    });
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedRecipeForDetail, setSelectedRecipeForDetail] = useState(null);
    const [feedbackList, setFeedbackList] = useState([]);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Chart Data
    const [chartData, setChartData] = useState([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [revenueByMethod, setRevenueByMethod] = useState([]);
    const [paymentsByStatus, setPaymentsByStatus] = useState([]);
    
    // Payment Modal
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [payments, setPayments] = useState([]);
    
    // State Gói Premium
    const [isConfirmAddOpen, setIsConfirmAddOpen] = useState(false);     
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false); 
    const [pkgToDelete, setPkgToDelete] = useState(null);
    const [packages, setPackages] = useState([]); 
    const [newPackage, setNewPackage] = useState({ name: '', price: '', duration_days: 30, description: '' });

    // STATE QUẢN LÝ GÓI CƯỚC
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false); 
    const [currentPkg, setCurrentPkg] = useState(null);
    const [couponList, setCouponList] = useState([]);
    // state Coupon 
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [couponToDelete, setCouponToDelete] = useState(null);
    const [isDeleteCouponModalOpen, setIsDeleteCouponModalOpen] = useState(false);
    
    //MÀU SẮC CHỦ ĐẠO 
    const COLORS = ['#ff9f1c', '#ff7675', '#00b894', '#a29bfe'];

    //   HÀM MỞ MODAL  
    const openDeleteModal = (recipe) => {
        setRecipeToDelete(recipe);
        setIsDeleteModalOpen(true);
    };
    const openApproveModal = (recipe) => {
        setRecipeToApprove(recipe);
        setIsApproveModalOpen(true);
    };
    const openResetPassModal = (user) => {
        setUserToReset(user);
        setIsResetPassModalOpen(true);
    };
    const openRejectModal = (recipe) => {
        setRecipeToReject(recipe);
        setIsRejectModalOpen(true);
    };
    const openDetailModal = (recipe) => {
        setSelectedRecipeForDetail(recipe);
        setIsDetailModalOpen(true);
    };
    const handleTogglePremium = (user) => {
        setUserToToggleVIP(user);    
        setIsPremiumModalOpen(true);  
    };
    const handleDeletePackageClick = (pkg) => {
        setPkgToDelete(pkg);       
        setIsConfirmDeleteOpen(true); 
    };
    const openAddPackageModal = () => {
        setCurrentPkg(null);
        setIsEditMode(false);
        setIsPackageModalOpen(true);
    };
    const openEditPackageModal = (pkg) => {
        setCurrentPkg(pkg); 
        setIsEditMode(true);
        setIsPackageModalOpen(true);
    };
    

    // EFFECTS & DATA LOADING 
    useEffect(() => {
        localStorage.setItem('admin_current_tab', activeTab);
        loadStats();
        loadUsers();
        fetchPending();
        loadFeedBacks();
        loadPayments();
        loadAllRecipes();
        loadPackages();
        loadCoupons();
    }, [activeTab]);

    useEffect(() => {
        if (error || successMsg) {
            const timer = setTimeout(() => {
                setError('');
                setSuccessMsg('');
            }, 3000); 
            return () => clearTimeout(timer); 
        }
    }, [error, successMsg]);

    useEffect(() => {
        const dataForChart = [
            { name: 'Người dùng', count: stats.users || 0 },
            { name: 'Công thức', count: stats.recipes || 0 },
            { name: 'Chờ duyệt', count: pendingRecipes.length || 0 }
        ];
        setChartData(dataForChart);
    }, [stats, pendingRecipes.length]);

    //API CALLS 
    const loadStats = async () => { try { const res = await axiosClient.get(`/admin/stats`); setStats(res.data); } catch (e) {} };
    const loadUsers = async () => { try { const res = await axiosClient.get(`/admin/users`); setUserList(res.data); } catch (e) {} };
    const fetchPending = async () => { try { const res = await axiosClient.get(`/admin/pending`); setPendingRecipes(res.data); } catch (e) {} };
    const loadAllRecipes = async () => { try { const res = await axiosClient.get('/admin/recipes'); setRecipes(res.data); } catch (e) {} };
    const loadPayments = async () => { try { const res = await axiosClient.get('/admin/history'); setPayments(res.data); } catch (e) {} };
    const loadPackages = async () => { try { const res = await axiosClient.get('/packages'); setPackages(res.data); } catch (e) {} };
    const loadFeedBacks = async () => { try { const res = await axiosClient.get(`/admin/feedbacks`); setFeedbackList(res.data); } catch (e) {} };
    const loadCoupons = async () => { try { const res = await axiosClient.get(`/admin/coupons`); setCouponList(res.data); } catch (e) {} };

    // Xử lý biểu đồ doanh thu & trạng thái
    useEffect(() => {
        if (!payments.length) return;
        
        // Doanh thu theo tháng
        const year = new Date().getFullYear();
        const months = Array.from({ length: 12 }, (_, i) => ({ month: `Tháng ${i + 1}`, revenue: 0 }));
        payments.forEach(p => {
            const date = new Date(p.created_at || p.date);
            if (date.getFullYear() === year) {
                months[date.getMonth()].revenue += Number(p.amount || p.total || 0);
            }
        });
        setMonthlyRevenue(months);

        // Trạng thái giao dịch
        const statusMap = {};
        payments.forEach(p => {
            const s = p.status || 'unknown';
            statusMap[s] = (statusMap[s] || 0) + 1;
        });
        setPaymentsByStatus(Object.keys(statusMap).map(k => ({ name: k, count: statusMap[k] })));
    }, [payments]);

    useEffect(() => {
        if (!payments || payments.length === 0) {
            setPaymentsByStatus([]);
            return;
        }
        const map = {};
        payments.forEach((p) => {
            const status = (p.status || 'unknown').toString();
            map[status] = (map[status] || 0) + 1;
        });
        const arr = Object.keys(map).map((k) => ({ name: k, count: map[k] }));
        setPaymentsByStatus(arr);
    }, [payments]);

    //  HANDLERS 
    const confirmDeleteRecipe = async() => {
        if(!recipeToDelete) return;
        try {
            await axiosClient.delete(`/admin/recipes/${recipeToDelete.id}`);
            setSuccessMsg(`Đã xóa công thức: ${recipeToDelete.name}`);
            loadAllRecipes();
        } catch(e) { setError("Không thể xóa công thức này."); }
    }

    const confirmApprove = async () => {
        if (!recipeToApprove) return;
        try {
            await axiosClient.put(`/admin/approve/${recipeToApprove.id}`);
            setSuccessMsg("Đã duyệt món ăn lên trang chủ!");
            fetchPending();
            loadStats();
        } catch (error) { setError("Lỗi duyệt bài"); }
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await axiosClient.delete(`/users/${userToDelete.id}`);
            setSuccessMsg(`Đã xóa tài khoản: ${userToDelete.fullname}`);
            loadUsers(); 
        } catch (e) { setError("Lỗi khi xóa tài khoản."); }
    };

    const confirmToggleVerify = async () => {
        if (!userToToggleVerify) return;
        const newStatus = userToToggleVerify.is_verified === 1 ? 0 : 1;
        try {
            await axiosClient.put(`/admin/users/${userToToggleVerify.id}/verify`, { is_verified: newStatus });
            setUserList(prev => prev.map(u => 
                u.id === userToToggleVerify.id ? { ...u, is_verified: newStatus } : u
            ));
            setIsVerifyModalOpen(false);
            setSuccessMsg(newStatus === 1 ? "Đã kích hoạt tài khoản! ✅" : "Đã khóa tài khoản thành công! 🔒");
        } catch (err) { setError("Lỗi cập nhật trạng thái!"); }
    };

    const confirmReject = async () => {
        if (!recipeToReject) return;
        try {
            await axiosClient.delete(`/admin/recipes/${recipeToReject.id}`); 
            setPendingRecipes(prev => prev.filter(r => r.id !== recipeToReject.id));
            setSuccessMsg("Đã từ chối và xóa bài viết thành công!");
            fetchPending();
            loadStats();
        } catch (e) { setError("Lỗi khi từ chối bài"); }
    };

    const confirmResetPass = async () => {
        if (!userToReset) return;
        const newPass = "123456";
        try {
            await axiosClient.put(`/admin/reset/${userToReset.id}`, { password: newPass });
            setSuccessMsg(`Đã reset mật khẩu của @${userToReset.username || userToReset.email} thành: ${newPass}`);
        } catch (e) { setError("Lỗi reset mật khẩu."); }
    };

    const confirmDeleteFeedback = async () => {
        if (!feedbackToDelete) return;
        try {
            await axiosClient.delete(`/admin/feedbacks/${feedbackToDelete.id}`);
            setSuccessMsg("Đã xóa góp ý thành công");
            loadFeedBacks(); 
        } catch (e) { setError("Lỗi khi xóa góp ý."); }
    };

    const confirmTogglePremium = async () => {
        if (!userToToggleVIP) return;
        const newStatus = userToToggleVIP.is_premium === 1 ? 0 : 1;
        try {
            await axiosClient.put(`/admin/${userToToggleVIP.id}/premium`, { is_premium: newStatus });
            setUserList(prev => prev.map(u => 
                u.id === userToToggleVIP.id ? { ...u, is_premium: newStatus } : u
            ));
            setIsPremiumModalOpen(false);
            setUserToToggleVIP(null);
            setSuccessMsg(newStatus === 1 ? "Đã nâng cấp VIP thành công! 👑" : "Đã hủy gói VIP thành công!");
        } catch (err) { setError("Lỗi cập nhật trạng thái VIP!"); }
    };

    const toggleRecipeVIP = async (recipe) => {
        const newStatus = recipe.is_premium === 1 ? 0 : 1;
        try {
            await axiosClient.put(`/admin/recipes/${recipe.id}/premium`, { is_premium: newStatus });
            setRecipes(prev => prev.map(r => 
                r.id === recipe.id ? { ...r, is_premium: newStatus } : r
            ));
            setSuccessMsg("Cập nhật trạng thái VIP thành công!");
        } catch (err) { setError("Không thể cập nhật trạng thái VIP"); }
    };
    const confirmAddPackage = async () => {
        try {
            await axiosClient.post('/admin/packages', newPackage);
            setSuccessMsg("Đã thêm gói cước mới!");
            setIsPackageModalOpen(false); 
            loadPackages();
            setNewPackage({ name: '', price: '', duration_days: 30, description: '' }); 
        } catch (err) { setError("Lỗi thêm gói cước"); }
    };

    const confirmDeletePackage = async () => {
        if (!pkgToDelete) return;
        try {
            await axiosClient.delete(`/admin/packages/${pkgToDelete.id}`);
            setSuccessMsg("Đã xóa gói cước");
            loadPackages();
        } catch(e) { setError("Lỗi xóa gói"); }
    };

    const openRecipeDetails = async (recipeOrId) => {
        const id = recipeOrId?.id ?? recipeOrId;
        if (!id) return;
        try {
            setIsLoading(true);
            const res = await axiosClient.get(`/recipes/${id}`);
            setSelectedRecipeForDetail(res.data);
            setIsDetailModalOpen(true);
        } catch (e) { setError('Lỗi tải chi tiết công thức.'); } finally { setIsLoading(false); }
    };

    const handleSavePackage = async (formData) => {
        try {
            if (isEditMode && currentPkg) {
                // Sửa
                await axiosClient.put(`/admin/packages/${currentPkg.id}`, formData);
                setSuccessMsg("Đã cập nhật gói cước! ");
            } else {
                // Thêm
                await axiosClient.post('/admin/packages', formData);
                setSuccessMsg("Đã thêm gói cước mới! ");
            }
            setIsPackageModalOpen(false);
            loadPackages();
        } catch (err) {
            setError("Lỗi khi lưu gói cước!");
        }
    };
    const handleAddCoupon = async (formData) => {
        try {
            await axiosClient.post('/admin/coupons', formData);
            setSuccessMsg("Đã tạo mã giảm giá! 🎫");
            setIsCouponModalOpen(false);
            loadCoupons();
        } catch (e) {
            setError(e.response?.data?.message || "Lỗi tạo mã");
        }
    };

    const handleDeleteCoupon = async () => {
        if (!couponToDelete) return;
        try {
            await axiosClient.delete(`/admin/coupons/${couponToDelete.id}`);
            setSuccessMsg("Đã xóa mã giảm giá");
            loadCoupons();
        } catch (e) { setError("Lỗi xóa mã"); }
    };
    const handleToggleCouponStatus = async (coupon) => {
        try {
            await axiosClient.put(`/admin/coupons/${coupon.id}/status`);
            setCouponList(prevList => prevList.map(c => 
                c.id === coupon.id ? { ...c, is_active: !c.is_active } : c
            ));
            
            setSuccessMsg(`Đã ${coupon.is_active ? 'tắt' : 'bật'} mã ${coupon.code}`);
        } catch (e) {
            setError("Lỗi cập nhật trạng thái!");
        }
    };
    const formatCurrency = (amount) => 
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const formatDate = (dateString) => 
        new Date(dateString).toLocaleString('vi-VN', { 
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' 
        });
    
        
    // RENDER 
    if (isLoading && !selectedRecipeForDetail) return <div className="loading-state">Đang tải dữ liệu...</div>;

    return (
        <div className='admin-container'>
            {/*  NOTIFICATION */}
            {(error || successMsg) && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 10000,
                    padding: '15px 25px', borderRadius: '12px',
                    background: error ? '#ff4757' : '#2ed573',
                    color: '#fff', boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
                    fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px',
                    animation: 'slideIn 0.3s ease-out', maxWidth: '350px'
                }}>
                    <span style={{fontSize: '20px'}}>{error ? '⚠️' : '✅'}</span>
                    <span>{error || successMsg}</span>
                </div>
            )}

            {/* SIDEBAR */}
            <div className='admin-sidebar'>
                <header className="admin-logo">
                    <img 
                        src={logo2} 
                        alt="EatDish Admin" 
                        style={{ width: '60px', height: '60px', borderRadius: '15px', objectFit: 'cover' }} 
                    />
                    <div className="logo-text">
                        ADMIN<br /><span className="logo-highlight">EATDISH</span>
                    </div>
                </header>

                <div className={`admin-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                    <span className="menu-icon">📊</span>
                    <span>Tổng Quan</span>
                </div>
                <div className={`admin-menu-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                    <span className="menu-icon">👥</span>
                    <span>Người Dùng</span>
                </div>
                <div className={`admin-menu-item ${activeTab === 'recipes' ? 'active' : ''}`} onClick={() => setActiveTab('recipes')}>
                    <span className="menu-icon">🍲</span>
                    <span>Món Ăn</span>
                </div>
                <div className={`admin-menu-item ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>
                    <span className="menu-icon">💰</span>
                    <span>Doanh Thu</span>
                </div>
                <div className={`admin-menu-item ${activeTab === 'approvals' ? 'active' : ''}`} onClick={() => setActiveTab('approvals')}>
                    <span className="menu-icon">📝</span>
                    <span>Duyệt Bài</span>
                    {pendingRecipes.length > 0 && (
                        <span className='badge-count'>
                            {pendingRecipes.length > 99 ? '99+' : pendingRecipes.length}
                        </span>
                    )}
                </div>
                <div className={`admin-menu-item ${activeTab === 'packages' ? 'active' : ''}`} onClick={() => setActiveTab('packages')}>
                    <span className="menu-icon">💎</span>
                    <span>Gói Premium</span>
                </div>
                <div className={`admin-menu-item ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => setActiveTab('coupons')}>
                    <span className="menu-icon">🎟️</span>
                    <span>Mã Giảm Giá</span>
                </div>
                <div className={`admin-menu-item ${activeTab === 'feedbacks' ? 'active' : ''}`} onClick={() => setActiveTab('feedbacks')}>
                    <span className="menu-icon">📭</span>
                    <span>Góp Ý</span>
                </div>

                <div className='admin-menu-item btn-home' onClick={() => navigate('/')}>
                    <span className="menu-icon">🚪</span>
                    <span>Rời trang quản trị</span>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className='admin-content'>
                
                {/*   DASHBOARD   */}
                {activeTab === 'dashboard' && (
                    <div className='fadeIn'>
                        <h1 className='page-title'>Tổng quan hệ thống</h1>
                        <div className='dashboard-grid'>
                            <Card title="USER ĐANG HOẠT ĐỘNG" value={stats.users || 0} color="#0984e3" icon="👤" />
                            <Card title="CÔNG THỨC ĐÃ DUYỆT" value={stats.recipes || 0} color="#00b894" icon="🍲" />
                            <Card title="TỔNG DOANH THU" value={formatCurrency( payments.reduce((acc, curr) => acc + (Number(curr.amount || curr.total) || 0), 0))} color="#ff9f1c" icon="💰" />
                        </div>
                        
                        <div className="chart-box" style={{ background: 'white', padding: '20px', borderRadius: '25px', boxShadow: '0 5px 20px rgba(0,0,0,0.02)', marginTop: '20px' }}>
                            <h3 style={{ marginBottom: '20px', color: '#2d3436' }}>Thống kê chung</h3>
                            <div style={{ width: '100%', height: '350px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    {Array.isArray(chartData) && chartData.length > 0 ? (
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{fill: '#f9fafc'}} contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'}} />
                                            <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={60}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    ) : (
                                        <div style={{ textAlign: 'center', paddingTop: '150px', color: '#b2bec3' }}>Đang tải dữ liệu...</div>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginTop: '25px' }}>
                            <div className="chart-box" style={{ background: 'white', padding: '20px', borderRadius: '25px', boxShadow: '0 5px 20px rgba(0,0,0,0.02)' }}>
                                <h3 style={{ marginBottom: '15px' }}>Trạng thái giao dịch</h3>
                                <div style={{ width: '100%', height: '250px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie 
                                                data={paymentsByStatus} 
                                                dataKey="count" nameKey="name" 
                                                cx="50%" cy="50%" 
                                                innerRadius={60} outerRadius={80} 
                                                paddingAngle={5}
                                            >
                                                {paymentsByStatus.map((entry, index) => (
                                                    <Cell key={`status-pie-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="chart-box" style={{ background: 'white', padding: '20px', borderRadius: '25px', boxShadow: '0 5px 20px rgba(0,0,0,0.02)' }}>
                                <h3 style={{ marginBottom: '15px' }}>Doanh thu theo tháng</h3>
                                <div style={{ width: '100%', height: '250px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={monthlyRevenue}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                            <YAxis tickFormatter={(value) => `${value/1000}k`} axisLine={false} tickLine={false} />
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                            <Line type="monotone" dataKey="revenue" stroke="#ff9f1c" strokeWidth={4} dot={{ r: 4, fill: '#ff9f1c', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/*   USERS   */}
                {activeTab === 'users' && (
                    <div className='fadeIn'>
                        <h1 className='page-title'>Quản lý người dùng</h1>
                        <div className='table-container'>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Người dùng</th>
                                        <th>Email / Username</th>
                                        <th>Vai trò</th>
                                        <th>Gói Premium</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userList.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <img 
                                                        src={u.avatar || `https://ui-avatars.com/api/?name=${u.fullname}&background=random`} 
                                                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                                                        alt="" 
                                                    />
                                                    <span style={{fontWeight: 600}}>{u.fullname}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {u.email} <br/>
                                                <small style={{ color: '#a4b0be' }}>@{u.username || 'user'}</small>
                                            </td>
                                            <td>
                                                <span className='role-badge' style={{ 
                                                    background: u.role === 'admin' ? '#ffeaa7' : '#f1f2f6',
                                                    color: u.role === 'admin' ? '#d35400' : '#2d3436'
                                                }}>
                                                    {u.role ? u.role.toUpperCase() : 'USER'}
                                                </span>
                                            </td>
                                            <td>
                                                {u.is_premium === 1 ? (
                                                    <span style={{ 
                                                        background: 'linear-gradient(135deg, #f1c40f, #f39c12)', 
                                                        color: '#fff', padding: '4px 10px', borderRadius: '20px', 
                                                        fontSize: '11px', fontWeight: '800', boxShadow: '0 2px 5px rgba(241, 196, 15, 0.3)'
                                                    }}>
                                                        👑 VIP
                                                    </span>
                                                ) : <span style={{color: '#b2bec3', fontSize: '12px'}}>Free</span>}
                                            </td>
                                            <td>
                                                <span style={{ 
                                                    color: u.is_verified === 1 ? '#00b894' : '#ff7675', 
                                                    fontWeight: '700', fontSize: '13px'
                                                }}>
                                                    {u.is_verified === 1 ? '• Active' : '• Locked'}
                                                </span>
                                            </td>
                                            <td>
                                                {u.role !== 'admin' && (
                                                    <div className='btn-action' style={{flexDirection: 'row'}}>
                                                        <button 
                                                            onClick={() => {setUserToDelete(u); setIsDeleteUserModalOpen(true);}} 
                                                            className='btn btn-delete' title="Xóa"
                                                        >🗑️</button>
                                                        
                                                        <button 
                                                            onClick={() => openResetPassModal(u)} 
                                                            className='btn' style={{background: '#dfe6e9', color: '#636e72'}} title="Reset MK"
                                                        >🔑</button>

                                                        <button 
                                                            onClick={() => handleTogglePremium(u)} 
                                                            className='btn'
                                                            style={{
                                                                background: u.is_premium === 1 ? '#ff7675' : '#f1c40f', 
                                                                color: 'white'
                                                            }}
                                                            title={u.is_premium === 1 ? 'Hủy VIP' : 'Cấp VIP'}
                                                        >
                                                            {u.is_premium === 1 ? '⇩' : '👑'}
                                                        </button>
                                                        
                                                        <button 
                                                            onClick={() => { setUserToToggleVerify(u); setIsVerifyModalOpen(true); }}
                                                            className='btn'
                                                            style={{
                                                                background: u.is_verified === 1 ? '#636e72' : '#00b894',
                                                                color: 'white'
                                                            }}
                                                            title={u.is_verified === 1 ? 'Khóa' : 'Mở khóa'}
                                                        >
                                                            {u.is_verified === 1 ? '🔒' : '🔓'}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/*   RECIPES   */}
                {activeTab === 'recipes' && (
                    <div className="fadeIn">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h1 className='page-title' style={{margin: 0}}>Quản lý Món Ăn ({recipes.length})</h1>
                            <button onClick={loadAllRecipes} className="btn-refresh">🔄 Làm mới</button>
                        </div>

                        <div className="table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Món ăn</th>
                                        <th>Tác giả</th>
                                        <th>Ngày đăng</th>
                                        <th>Loại</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recipes.length > 0 ? recipes.map((r) => (
                                        <tr key={r.id}>
                                            <td>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                                    <img src={r.image_url} alt="" style={{ width: '45px', height: '45px', borderRadius: '10px', objectFit: 'cover' }} />
                                                    <span style={{fontWeight: 600, color: '#2d3436'}}>{r.title}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span onClick={() => navigate(`/profile/${r.author_id}`)} style={{ color: '#ff9f1c', cursor: 'pointer', fontWeight: 500 }}>
                                                    @{r.author_name}
                                                </span>
                                            </td>
                                            <td style={{ color: '#636e72', fontSize: '13px' }}>
                                                {new Date(r.created_at).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td>
                                                {r.is_premium === 1 ? <span style={{ color: '#f1c40f', fontWeight: 'bold', fontSize: '12px' }}>👑 PREMIUM</span> : <span style={{ color: '#b2bec3', fontSize: '12px' }}>Free</span>}
                                            </td>
                                            <td>
                                                <span style={{color: '#00b894', fontWeight: 'bold', fontSize: '12px'}}>● Đã duyệt</span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => openRecipeDetails(r)} className="btn" style={{background: '#fff', border: '1px solid #dfe6e9', color: '#2d3436'}}>Xem</button>
                                                    <button onClick={() => toggleRecipeVIP(r)} className='btn' style={{background: r.is_premium ? '#ff7675' : '#f1c40f', color: '#fff', minWidth: '40px'}}>
                                                        {r.is_premium ? 'Hủy VIP' : 'Set VIP'}
                                                    </button>
                                                    <button onClick={() => openDeleteModal(r)} className="btn btn-delete">Xóa</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="6" className="empty-state">Chưa có công thức nào.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/*   APPROVALS   */}
                {activeTab === 'approvals' && (
                    <div className="fadeIn">
                        <h1 className="page-title">Duyệt bài viết ({pendingRecipes.length})</h1>
                        {pendingRecipes.length === 0 ? (
                            <div className="empty-state">
                                <div style={{ fontSize: '50px', marginBottom: '15px' }}>🎉</div>
                                Tuyệt vời! Bạn đã duyệt hết các bài viết.
                            </div>
                        ) : (
                            <div className="pending-list">
                                {pendingRecipes.map(recipe => (
                                    <div key={recipe.id} className="pending-item">
                                        <div className="pending-img-box">
                                            <img src={recipe.img || recipe.image_url} alt="" className="pending-img" />
                                        </div>
                                        <div className="pending-content">
                                            <h3 className="pending-title">{recipe.name || recipe.title}</h3>
                                            <div className="pending-meta">
                                                <span>👤 <b>{recipe.author_name || recipe.username || "Ẩn danh"}</b></span>
                                                <span>🕒 {new Date(recipe.created_at).toLocaleString()}</span>
                                            </div>
                                            <div className="pending-desc">
                                                {recipe.description ? recipe.description.substring(0, 150) + '...' : 'Không có mô tả.'}
                                            </div>
                                        </div>
                                        <div className="btn-action">
                                            <button onClick={() => openApproveModal(recipe)} className="btn btn-approve">✅ Duyệt bài</button>
                                            <button onClick={() => openRejectModal(recipe)} className="btn btn-reject">⛔ Từ chối</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/*   BILLING   */}
                {activeTab === 'billing' && (
                    <div className="fadeIn">
                        <h1 className="page-title">Lịch sử giao dịch</h1>
                        <div className="table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Mã GD</th>
                                        <th>Khách hàng</th>
                                        <th>Số tiền</th>
                                        <th>Phương thức</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày tạo</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((p) => (
                                        <tr key={p.order_id || Math.random()}>
                                            <td>#{p.order_id}</td>
                                            <td><b>{p.fullname || p.username}</b><br/><small>{p.email}</small></td>
                                            <td style={{color: '#ff9f1c', fontWeight: 'bold'}}>{formatCurrency(p.amount || p.total || 0)}</td>
                                            <td>{p.method || 'PayOS'}</td>
                                            <td>
                                                <span style={{ 
                                                    color: p.status === 'refunded' ? '#ff7675' : '#00b894', 
                                                    fontWeight: 700 
                                                }}>
                                                    {p.status ? p.status.toUpperCase() : 'SUCCESS'}
                                                </span>
                                            </td>
                                            <td>{formatDate(p.created_at || p.date)}</td>
                                            <td>
                                                <div style={{display: 'flex', gap: '8px'}}>
                                                    <button onClick={() => { setSelectedPayment(p); setIsPaymentModalOpen(true); }} className="btn" style={{background: '#dfe6e9', color: '#636e72'}}>Xem</button>
                                                    {p.status !== 'refunded' && (
                                                        <button 
                                                            onClick={async () => {
                                                                if (!window.confirm('Hoàn tiền giao dịch này?')) return;
                                                                try { await axiosClient.post(`/admin/payments/${p.order_id}/refund`); setSuccessMsg('Đã hoàn tiền'); } catch (e) { setError('Lỗi hoàn tiền'); }
                                                            }} 
                                                            className="btn" 
                                                            style={{background: '#ffecec', color: '#ff7675'}}
                                                        >
                                                            Hoàn Tiền
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {/*   PACKAGES   */}
                {activeTab === 'packages' && (
                    <div className="fadeIn">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                            <h1 className="page-title">Gói Premium</h1>
                            <button onClick={openAddPackageModal} className="btn-primary-admin">+ Thêm Gói</button>
                        </div>
                        <div className="package-grid">
                            {packages.map(pkg => (
                                <div key={pkg.id} className="package-card">
                                    <div style={{ position: 'absolute', top: 15, right: 15, display: 'flex', gap: 5 }}>
                                        <button onClick={() => openEditPackageModal(pkg)} style={{ background: '#dfe6e9', border: 'none', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Sửa gói">✏️</button>
                                        <button className="btn btn-delete" onClick={() => { setPkgToDelete(pkg); setIsConfirmDeleteOpen(true); }} style={{ position: 'static' }}>🗑️</button>
                                    </div>
                                    <div className="pkg-icon-box">{pkg.duration_days > 365 ? '👑' : '💎'}</div>
                                    <h3>{pkg.name}</h3>
                                    <div className="pkg-price">{formatCurrency(pkg.price)}</div>
                                    <span className="pkg-duration">{pkg.duration_days} ngày</span>
                                    <p className="pkg-desc">{pkg.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/*  COUPON  */}
                {activeTab === 'coupons' && (
                    <div className="fadeIn">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                            <h1 className="page-title">Mã Giảm Giá</h1>
                            <button onClick={() => setIsCouponModalOpen(true)} className="btn-primary-admin">+ Tạo Mã</button>
                        </div>
                        <div className="table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Mã Code</th>
                                        <th>Giảm (%)</th>
                                        <th>Trạng thái</th>
                                        <th>Hết hạn</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {couponList.map(c => (
                                        <tr key={c.id}>
                                            {/* Cột 1: Mã Code */}
                                            <td>
                                                <span style={{background: '#dff9fb', color: '#130f40', padding: '5px 10px', borderRadius: 5, fontWeight: 'bold', fontFamily: 'monospace'}}>
                                                    {c.code}
                                                </span>
                                            </td>

                                            {/* Cột 2: Phần trăm */}
                                            <td style={{color: '#d63031', fontWeight: 'bold'}}>-{c.percent}%</td>

                                            {/* Cột 3: Trạng thái (Click để đổi) */}
                                            <td>
                                                <span 
                                                    className="role-badge" 
                                                    onClick={() => handleToggleCouponStatus(c)}
                                                    style={{ 
                                                        background: c.is_active ? '#00b894' : '#636e72', 
                                                        color: 'white', 
                                                        cursor: 'pointer', 
                                                        userSelect: 'none', 
                                                        transition: '0.2s', 
                                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                                        display: 'inline-block',
                                                        minWidth: '100px',
                                                        textAlign: 'center'
                                                    }}
                                                    title="Bấm để Bật/Tắt"
                                                    onMouseOver={(e) => e.target.style.opacity = '0.8'}
                                                    onMouseOut={(e) => e.target.style.opacity = '1'}
                                                >
                                                    {c.is_active ? '🟢 Đang bật' : '⚫ Đã tắt'}
                                                </span>
                                            </td>

                                            {/* Cột 4: Ngày hết hạn */}
                                            <td>{c.expiry_date ? formatDate(c.expiry_date).split(' ')[1] : 'Vô thời hạn'}</td>

                                            {/* Cột 5: Hành động Xóa */}
                                            <td>
                                                <button 
                                                    onClick={() => { setCouponToDelete(c); setIsDeleteCouponModalOpen(true); }}
                                                    className="btn btn-delete"
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    
                                    {couponList.length === 0 && (
                                        <tr><td colSpan="5" style={{textAlign: 'center', padding: 20, color: '#b2bec3'}}>Chưa có mã giảm giá nào</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/*   FEEDBACKS   */}
                {activeTab === 'feedbacks' && (
                    <div className='fadeIn'>
                        <h1 className='page-title'>Góp ý từ người dùng</h1>
                        <div className="table-container">
                            {feedbackList.length === 0 ? (
                                <div className="empty-state">Chưa có góp ý nào.</div>
                            ) : (
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Người gửi</th>
                                            <th>Loại</th>
                                            <th>Nội dung</th>
                                            <th>Thời gian</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feedbackList.map(item => (
                                            <tr key={item.id}>
                                                <td><b>{item.username || "Ẩn danh"}</b><br/><small>{item.email}</small></td>
                                                <td><span className={`role-badge ${item.type === 'bug' ? 'type-bug' : 'type-other'}`}>{item.type}</span></td>
                                                <td><div style={{maxWidth: '400px', lineHeight: '1.5'}}>{item.content}</div></td>
                                                <td>{new Date(item.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <button onClick={() => { setFeedbackToDelete(item); setIsDeleteFeedbackModalOpen(true); }} className="btn btn-delete">Xóa</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Modal thêm/sửa gói cước tách riêng */}
            <AdminPackageModal 
                isOpen={isPackageModalOpen} 
                onClose={() => setIsPackageModalOpen(false)} 
                onSubmit={handleSavePackage}
                initialData={currentPkg}
                isEditMode={isEditMode}
            />

            <ConfirmModal 
                isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDeleteRecipe}
                title="Xóa công thức" message={recipeToDelete ? <>Bạn có chắc muốn xóa món <b>{recipeToDelete.title}</b>?</> : ""}
            />
            <ConfirmModal 
                isOpen={isDeleteUserModalOpen} onClose={() => setIsDeleteUserModalOpen(false)} onConfirm={confirmDeleteUser}
                title="Xóa người dùng" message={userToDelete ? <>Xóa vĩnh viễn tài khoản <b>@{userToDelete.username}</b>?</> : ""}
            />
            <ConfirmModal 
                isOpen={isDeleteFeedbackModalOpen} onClose={() => setIsDeleteFeedbackModalOpen(false)} onConfirm={confirmDeleteFeedback}
                title="Xóa góp ý" message="Bạn muốn xóa phản hồi này?"
            />
            <ConfirmModal 
                isOpen={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} onConfirm={confirmApprove}
                title="Duyệt bài" message="Cho phép món ăn này hiển thị công khai?"
            />
            <ConfirmModal 
                isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} onConfirm={confirmReject}
                title="Từ chối bài viết" message="Bài viết sẽ bị xóa khỏi danh sách chờ duyệt."
            />
            <ConfirmModal 
                isOpen={isResetPassModalOpen} onClose={() => setIsResetPassModalOpen(false)} onConfirm={confirmResetPass}
                title="Reset mật khẩu" message="Mật khẩu sẽ về mặc định: 123456"
            />
            <ConfirmModal 
                isOpen={isPremiumModalOpen} onClose={() => setIsPremiumModalOpen(false)} onConfirm={confirmTogglePremium}
                title={userToToggleVIP?.is_premium === 1 ? "Hủy VIP ❌" : "Cấp VIP 👑"}
                message={userToToggleVIP ? <>Thay đổi trạng thái Premium cho <b>{userToToggleVIP.fullname}</b>?</> : ""}
            />
            <ConfirmModal 
                isOpen={isVerifyModalOpen} onClose={() => setIsVerifyModalOpen(false)} onConfirm={confirmToggleVerify}
                title={userToToggleVerify?.is_verified === 1 ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                message="Người dùng bị khóa sẽ không thể đăng nhập."
            />
            <ConfirmModal isOpen={isConfirmAddOpen} onClose={() => setIsConfirmAddOpen(false)} onConfirm={confirmAddPackage} title="Thêm gói" message="Tạo gói cước mới này?" />
            <ConfirmModal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} onConfirm={confirmDeletePackage} title="Xóa gói" message="Xóa gói cước này?" />
            <AdminCouponModal isOpen={isCouponModalOpen} onClose={() => setIsCouponModalOpen(false)} onSubmit={handleAddCoupon} />

            <ConfirmModal isOpen={isDeleteCouponModalOpen} onClose={()=>setIsDeleteCouponModalOpen(false)} onConfirm={handleDeleteCoupon} title="Xóa mã" message="Xóa vĩnh viễn mã giảm giá này?" />
            <RecipeDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} selectedRecipe={selectedRecipeForDetail} />
            <PaymentDetailModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} payment={selectedPayment} />
        </div>
    );
};

// Component Card được cập nhật để dùng nền trắng
const Card = ({ title, value, color, icon }) => (
    <div className="stat-card">
        <div className="stat-icon" style={{ 
            color: color, 
            background: `${color}15`, 
            fontSize: '28px',
            width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            {icon}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <b className="stat-value" style={{ color: '#2d3436', fontSize: '32px' }}>{value}</b>
            <span className="stat-title" style={{ color: '#a4b0be', fontSize: '13px' }}>{title}</span>
        </div>
    </div>
);

export default AdminPage;