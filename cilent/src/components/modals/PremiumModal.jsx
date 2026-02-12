import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient'; 

const PremiumModal = ({ isOpen, onClose, user, onUpgradeSuccess }) => {
    // State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Lưu danh sách gói và gói đang chọn
    const [packages, setPackages] = useState([]); 
    const [selectedPkg, setSelectedPkg] = useState(null); 
    
    // State cho Coupon
    const [couponCode, setCouponCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null); 
    const [couponMsg, setCouponMsg] = useState(''); 

    // Load danh sách gói cước
    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const res = await axiosClient.get('/packages');
                if (res.data && res.data.length > 0) {
                    setPackages(res.data);
                    setSelectedPkg(res.data[0]);
                }
            } catch (err) { console.error(err); }
        };
        if (isOpen) fetchPackages();
    }, [isOpen]);

    if (!isOpen) return null;

    // Xử lý chọn gói
    const handleSelectPackage = (pkg) => {
        setSelectedPkg(pkg);
        setAppliedDiscount(null);
        setCouponMsg('');
        setCouponCode('');
    };

    // Kiểm tra mã giảm giá
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponMsg('');
        setAppliedDiscount(null);

        try {
            const res = await axiosClient.post('/payment/check-coupon', { code: couponCode });
            setAppliedDiscount({ percent: res.data.percent, code: res.data.code });
            setCouponMsg(`✅ ${res.data.message}`);
        } catch (err) {
            setCouponMsg('❌ Mã giảm giá không hợp lệ');
            setAppliedDiscount(null);
        }
    };

    // Thanh toán
    const handlePayOS = async () => {
        setError('');
        try {
            setIsLoading(true);
            const res = await axiosClient.post("/payment/create", { 
                packageId: selectedPkg?.id,
                discountCode: appliedDiscount ? appliedDiscount.code : null
            });
            window.location.href = res.data.checkoutUrl;
        } catch (err) {
            setError("Không thể khởi tạo thanh toán");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper format
    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    // Tính toán giá hiển thị
    const originalPrice = selectedPkg ? selectedPkg.price : 0;
    const finalPrice = appliedDiscount 
        ? originalPrice - (originalPrice * appliedDiscount.percent / 100) 
        : originalPrice;

    return (
        <div className="modal-overlay" style={overlayStyle}>
            <div className="modal-content" style={modalStyle}>
                <button onClick={onClose} style={closeBtnStyle}>✕</button>

                <div className="animate-fade-in">
                    <div style={{ fontSize: 40, marginBottom: 5 }}>👑</div>
                    <h2 style={{ color: '#ff9f1c', margin: '0 0 15px 0' }}>NÂNG CẤP PREMIUM</h2>

                    {/*  DANH SÁCH GÓI CƯỚC  */}
                    <div style={packageListStyle}>
                        {packages.map(pkg => (
                            <div 
                                key={pkg.id}
                                onClick={() => handleSelectPackage(pkg)}
                                style={{
                                    ...packageCardStyle,
                                    border: selectedPkg?.id === pkg.id ? '2px solid #ff9f1c' : '2px solid #f1f2f6',
                                    background: selectedPkg?.id === pkg.id ? '#fffbf5' : '#fff'
                                }}
                            >
                                {pkg.duration_days >= 90 && (
                                    <span style={badgeBestValue}>Tiết kiệm</span>
                                )}

                                <h3 style={{fontSize: '14px', margin: '0 0 5px 0'}}>{pkg.name}</h3>
                                <div style={{fontSize: '16px', fontWeight: 'bold', color: '#ff9f1c'}}>
                                    {formatPrice(pkg.price)}
                                </div>
                                <small style={{color: '#a4b0be'}}>
                                    {pkg.duration_days > 365 ? 'Trọn đời' : `${pkg.duration_days} ngày`}
                                </small>
                            </div>
                        ))}
                    </div>

                    {/* QUYỀN LỢI CỦA GÓI ĐANG CHỌN */}
                    {selectedPkg && (
                        <div style={benefitBoxStyle}>
                            <p style={{fontWeight: 'bold', marginBottom: 8, color: '#2d3436', borderBottom: '1px dashed #ffdca8', paddingBottom: 5}}>
                                Quyền lợi gói: {selectedPkg.name}
                            </p>
                            {selectedPkg.benefits ? (
                                (typeof selectedPkg.benefits === 'string' ? JSON.parse(selectedPkg.benefits) : selectedPkg.benefits).map((item, i) => (
                                    <p key={i} style={{marginBottom: 4, fontSize: '13px'}}>✅ {item}</p>
                                ))
                            ) : (
                                <p style={{fontSize: '13px'}}>Đang tải quyền lợi...</p>
                            )}
                            <p style={{marginTop: 8, fontStyle: 'italic', fontSize: '12px', color: '#636e72'}}>
                                {selectedPkg.description}
                            </p>
                        </div>
                    )}

                    {/* NHẬP MÃ GIẢM GIÁ */}
                    <div style={{ margin: '15px 0', display: 'flex', gap: '8px' }}>
                        <input 
                            type="text" placeholder="Mã giảm giá (VD: SALE20)" 
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            style={inputStyle}
                        />
                        <button onClick={handleApplyCoupon} style={applyBtnStyle}>Áp dụng</button>
                    </div>
                    {couponMsg && (
                        <p style={{ color: couponMsg.startsWith('✅') ? '#00b894' : '#ff7675', fontSize: '12px', margin: '-10px 0 10px 0', textAlign: 'left' }}>{couponMsg}</p>
                    )}

                    {/* TỔNG TIỀN & NÚT */}
                    <div style={totalSectionStyle}>
                        <div style={{textAlign: 'left'}}>
                            <span style={{fontSize: '13px', color: '#636e72'}}>Tổng thanh toán:</span><br/>
                            {appliedDiscount && (
                                <span style={{ textDecoration: 'line-through', color: '#b2bec3', fontSize: '14px', marginRight: 8 }}>
                                    {formatPrice(originalPrice)}
                                </span>
                            )}
                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff7675' }}>
                                {formatPrice(finalPrice)}
                            </span>
                        </div>
                        
                        <button onClick={handlePayOS} style={btnPrimaryStyle} disabled={isLoading || !selectedPkg}>
                            {isLoading ? "Đang xử lý..." : "Thanh toán ngay"}
                        </button>
                    </div>
                    
                    {error && <p style={{color: 'red', marginTop: '10px', fontSize: '13px'}}>{error}</p>}
                </div>
            </div>
        </div>
    );
};

// CSS Styles
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 };
const modalStyle = { background: '#fff', padding: '30px', borderRadius: '24px', width: '500px', textAlign: 'center', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', animation: 'fadeIn 0.3s', maxHeight: '90vh', overflowY: 'auto' };
const closeBtnStyle = { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#b2bec3' };

// Style danh sách gói
const packageListStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '15px' };
const packageCardStyle = { padding: '15px 10px', borderRadius: '15px', cursor: 'pointer', position: 'relative', transition: '0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const badgeBestValue = { position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#ff7675', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' };

const benefitBoxStyle = { textAlign: 'left', background: '#fff5e6', padding: '15px', borderRadius: '12px', border: '1px solid #ffcc80', fontSize: '14px' };
const inputStyle = { flex: 1, padding: '10px 15px', borderRadius: '10px', border: '1px solid #dfe6e9', fontSize: '14px', outline: 'none' };
const applyBtnStyle = { padding: '10px 15px', borderRadius: '10px', border: 'none', background: '#2d3436', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '13px' };

const totalSectionStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '15px', borderTop: '1px solid #f1f2f6', paddingTop: '15px' };
const btnPrimaryStyle = { padding: '12px 25px', background: 'linear-gradient(135deg, #ff9f1c, #e17055)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s', boxShadow: '0 5px 15px rgba(255, 159, 28, 0.4)' };

export default PremiumModal;