import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import '../../index.css';
import { toast } from 'react-toastify';
import { Crown, PartyPopper, SquareCheck } from 'lucide-react';
const PremiumView = () => {
    // STATE 
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    
    const [packages, setPackages] = useState([]);
    const [selectedPkg, setSelectedPkg] = useState(null);
    
    const [couponCode, setCouponCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);

    const [premiumInfo, setPremiumInfo] = useState({
        isPremium: false,
        expireDate: null
    });

    const formatExpiryDate = (dateString) => {
        if (!dateString) return 'Vĩnh viễn (Trọn đời)';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resPkgs = await axiosClient.get('/packages');
                const pkgData = Array.isArray(resPkgs.data) ? resPkgs.data : [];
                
                if (pkgData.length > 0) {
                    const activePackages = pkgData.filter(p => p.is_active == 1);
                    setPackages(activePackages);
                    if (activePackages.length > 0) {
                        setSelectedPkg(activePackages[0]);
                    }
                }
                try {
                    const resStatus = await axiosClient.get('/status');
                    if (resStatus.data) {
                        setPremiumInfo({
                            isPremium: resStatus.data.is_premium == 1,
                            expireDate: resStatus.data.premium_until
                        });
                    }
                } catch (statusErr) {
                    console.log("Khách chưa đăng nhập");
                }

            } catch (err) { 
                toast.error('Không thể tải dữ liệu lúc này.');
            } finally {
                setIsFetching(false);
            }
        };
        fetchData();
    }, []);

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + ' đ';

    const safeParseBenefits = (benefits) => {
        try {
            if (!benefits) return [];
            const parsed = typeof benefits === 'string' ? JSON.parse(benefits) : benefits;
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) { return []; }
    };

    const handleSelectPackage = (pkg) => {
        setSelectedPkg(pkg);
        setAppliedDiscount(null);
        setCouponCode('');
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setAppliedDiscount(null);
        try {
            const res = await axiosClient.post('/payment/check-coupon', { code: couponCode });
            setAppliedDiscount({ percent: res.data.percent, code: res.data.code });
            toast.success(` ${res.data.message}`);
        } catch (err) {
            toast.error(' Mã giảm giá không hợp lệ hoặc đã hết hạn');
        }
    };

    const handlePayOS = async () => {
        if (!selectedPkg) return;
        try {
            setIsLoading(true);
            const res = await axiosClient.post("/payment/create", { 
                packageId: selectedPkg.id, discountCode: appliedDiscount ? appliedDiscount.code : null
            });
            window.location.href = res.data.checkoutUrl;
        } catch (err) {
            toast.error("Không thể khởi tạo thanh toán. Vui lòng thử lại sau.");
        } finally {
            setIsLoading(false);
        }
    };

    const originalPrice = selectedPkg ? selectedPkg.price : 0;
    const finalPrice = appliedDiscount ? originalPrice - (originalPrice * appliedDiscount.percent / 100) : originalPrice;

    if (isFetching) return <div className="page-loading-msg">Đang tải dữ liệu các gói...</div>;

    return (
        <div id="view-premium" className="fadeIn premium-view-container">
            <div className="banner recipes-banner">
                <div className="banner-text">
                    <h1 style={{color: '#fff'}}>
                        {premiumInfo.isPremium ? (
                            <>
                                Đặc quyền Premium <Crown />
                            </>
                        ) : (
                            <>
                                Nâng cấp Premium <Crown />
                            </>
                        )}
                    </h1>
                    <p style={{color: '#fff'}}>Trở thành Đầu Bếp VIP để mở khóa toàn bộ công thức và tính năng độc quyền.</p>
                </div>
            </div>

            {premiumInfo.isPremium ? (
                <div className="premium-status-card">
                    <h2><PartyPopper /> Chào mừng Đầu Bếp VIP quay trở lại!</h2>
                    <p>Tài khoản của bạn đang sở hữu gói Premium. Hạn dùng đến: 
                        <strong> {formatExpiryDate(premiumInfo.expireDate)}</strong>
                    </p>
                </div>
            ) : (
                <div className="premium-status-card guest">
                    <p>Bạn chưa nâng cấp Premium. Hãy chọn gói bên dưới để bắt đầu!</p>
                </div>
            )}

            <div className="premium-split-container">
                <div className="premium-left-pane">
                    {selectedPkg ? (
                        <div className="fadeIn">
                            <h2 className="premium-left-title">Quyền lợi <span>{selectedPkg.name}</span></h2>
                            <p className="premium-left-desc">{selectedPkg.description || 'Nâng cấp để trải nghiệm tính năng đỉnh cao.'}</p>
                            <div className="premium-benefit-list">
                                {safeParseBenefits(selectedPkg.benefits).map((benefit, i) => (
                                    <div key={i} className="premium-benefit-item">
                                        <div className="premium-benefit-icon"><SquareCheck fill='#00b894'/></div>
                                        <div className="premium-benefit-text">{benefit}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="premium-benefit-empty">Vui lòng chọn một gói để xem quyền lợi.</div>
                    )}
                </div>

                <div className="premium-checkout-card">
                    <h3 className="premium-section-title">1. Chọn gói đăng ký</h3>
                    <div className="premium-package-list">
                        {packages.length > 0 ? (
                            packages.map(pkg => {
                                const isSelected = selectedPkg?.id === pkg.id;
                                return (
                                    <div 
                                        key={pkg.id} 
                                        onClick={() => handleSelectPackage(pkg)}
                                        className={`premium-package-item ${isSelected ? 'active' : ''}`}
                                    >
                                        <div>
                                            <div className="premium-pkg-name">{pkg.name}</div>
                                            <div className="premium-pkg-duration">Hạn dùng: {pkg.duration_days} ngày</div>
                                        </div>
                                        <div className="premium-pkg-price">{formatPrice(pkg.price)}</div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-muted">Hiện chưa có gói nào để hiển thị.</p>
                        )}
                    </div>

                    <h3 className="premium-section-title">2. Mã ưu đãi</h3>
                    <div className="premium-coupon-wrapper">
                        <input 
                            type="text" placeholder="Mã giảm giá..." 
                            value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className="premium-coupon-input"
                        />
                        <button onClick={handleApplyCoupon} className="premium-coupon-btn">Áp dụng</button>
                    </div>

                    <div className="premium-total-section">
                        <div className="premium-total-box">
                            <span className="premium-total-label">Tổng thanh toán</span>
                            <div className="premium-final-price">{formatPrice(finalPrice)}</div>
                        </div>
                        <button onClick={handlePayOS} disabled={isLoading || !selectedPkg} className="premium-pay-btn">
                            {isLoading ? "Đang kết nối..." : "Thanh Toán Ngay"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumView;