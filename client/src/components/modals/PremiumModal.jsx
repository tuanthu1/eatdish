import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { Crown, Star, Gem, SquareCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
<svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6 inline-block mr-1" /* Bạn có thể đổi class Tailwind tuỳ ý */
>
    <defs>
        <linearGradient
            id="eatdish-grad"
            x1="0" y1="0" x2="24" y2="24"
            gradientUnits="userSpaceOnUse"
        >
            <stop stopColor="#F2B705" />
            <stop offset="1" stopColor="#E75926" />
        </linearGradient>
    </defs>

    {/* Phần thân vương miện (kiểu bo góc hiện đại) */}
    <path
        d="M2.25 7.125C2.25 6.29657 2.92157 5.625 3.75 5.625C4.57843 5.625 5.25 6.29657 5.25 7.125C5.25 7.64332 4.98687 8.10006 4.5746 8.36195L6.6853 13.6385L10.8711 7.36014C10.5898 7.02559 10.5 6.55627 10.5 6C10.5 5.17157 11.1716 4.5 12 4.5C12.8284 4.5 13.5 5.17157 13.5 6C13.5 6.55627 13.4102 7.02559 13.1289 7.36014L17.3147 13.6385L19.4254 8.36195C19.0131 8.10006 18.75 7.64332 18.75 7.125C18.75 6.29657 19.4216 5.625 20.25 5.625C21.0784 5.625 21.75 6.29657 21.75 7.125C21.75 7.95343 21.0784 8.625 20.25 8.625C20.1017 8.625 19.9584 8.60346 19.8236 8.56317L18.0649 16.9152C17.9157 17.6237 17.2917 18.125 16.5686 18.125H7.43135C6.70835 18.125 6.08427 17.6237 5.93512 16.9152L4.17645 8.56317C4.04159 8.60346 3.89832 8.625 3.75 8.625C2.92157 8.625 2.25 7.95343 2.25 7.125Z"
        fill="url(#eatdish-grad)"
    />

    {/* Phần đế vương miện */}
    <path
        d="M6.5 19.5C6.5 19.0858 6.83579 18.75 7.25 18.75H16.75C17.1642 18.75 17.5 19.0858 17.5 19.5C17.5 19.9142 17.1642 20.25 16.75 20.25H7.25C6.83579 20.25 6.5 19.9142 6.5 19.5Z"
        fill="url(#eatdish-grad)"
    />
</svg>
const PremiumModal = ({ isOpen, onClose }) => {
    // State
    const [isLoading, setIsLoading] = useState(false);

    const [packages, setPackages] = useState([]);
    const [selectedPkg, setSelectedPkg] = useState(null);
    const navigate = useNavigate();
    const [couponCode, setCouponCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [couponMsg, setCouponMsg] = useState('');

    const [premiumInfo, setPremiumInfo] = useState({
        isPremium: false,
        expireDate: null
    });

    const formatExpiryDate = (dateString) => {
        if (!dateString) return 'Vĩnh viễn (Trọn đời)';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Load danh sách gói cước và trạng thái VIP
    useEffect(() => {
        // Nếu modal chưa mở thì không làm gì cả
        if (!isOpen) return;

        const fetchData = async () => {
            try {
                // 🛑 BƯỚC BẢO VỆ CHÍNH: Kiểm tra thẻ ra vào (Token)
                const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                if (!token) {
                    toast.warning("Phòng VIP chỉ dành cho thành viên! Vui lòng đăng nhập!");
                    onClose(); // Đóng ngay cái Modal lại
                    navigate('/login-register'); // Bế thẳng ra ngoài trang đăng nhập
                    return; // Chặn không cho chạy xuống API bên dưới
                }

                // Chỗ API cũ của mày giữ nguyên
                const resPkgs = await axiosClient.get('/packages');
                if (resPkgs.data && resPkgs.data.length > 0) {
                    const activePackages = resPkgs.data.filter(p => p.is_active == 1);
                    setPackages(activePackages);
                    setSelectedPkg(activePackages[0]);
                }

                const resStatus = await axiosClient.get(`/status?t=${Date.now()}`);
                setPremiumInfo({
                    isPremium: resStatus.data.is_premium == 1,
                    expireDate: resStatus.data.premium_until
                });
            } catch (err) {
                console.error(err);
            }
        };

        fetchData();
    }, [isOpen, navigate, onClose]);
    if (!isOpen) return null;

    const handleSelectPackage = (pkg) => {
        setSelectedPkg(pkg);
        setAppliedDiscount(null);
        setCouponMsg('');
        setCouponCode('');
    };

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
        }
    };

    const handlePayOS = async () => {
        try {
            setIsLoading(true);
            const res = await axiosClient.post("/payment/create", {
                packageId: selectedPkg?.id,
                discountCode: appliedDiscount ? appliedDiscount.code : null
            });
            window.location.href = res.data.checkoutUrl;
        } catch (err) {
            toast.error("Không thể khởi tạo thanh toán");
        } finally {
            setIsLoading(false);
        }
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    const originalPrice = selectedPkg ? selectedPkg.price : 0;
    const finalPrice = appliedDiscount
        ? originalPrice - (originalPrice * appliedDiscount.percent / 100)
        : originalPrice;

    return (
        <div className="modal-overlay" style={overlayStyle}>
            <div className="modal-content" style={modalStyle}>
                <button onClick={onClose} style={closeBtnStyle}>✕</button>

                <div className="animate-fade-in">
                    <div style={{ fontSize: 40, marginBottom: 5 }}><Crown fill='#ff9f1c' color='#ff9f1c' /></div>
                    <h2 style={{ color: '#ff9f1c', margin: '0 0 5px 0' }}>NÂNG CẤP PREMIUM</h2>

                    {premiumInfo.isPremium && (
                        <div style={vipStatusBadgeStyle}>
                            < Star fill='#eeff00' color='#eeff00' /> Bạn đang là VIP. Hạn dùng: <strong>{formatExpiryDate(premiumInfo.expireDate)}</strong>
                            <br /><small>(Mua thêm sẽ được cộng dồn thời hạn cũ)</small>
                        </div>
                    )}

                    <p style={{ fontSize: '13px', color: '#636e72', marginBottom: '15px' }}>
                        {premiumInfo.isPremium ? 'Chọn gói để gia hạn thêm thời gian sử dụng:' : 'Chọn gói đăng ký phù hợp với bạn:'}
                    </p>

                    {/* DANH SÁCH GÓI CƯỚC  */}
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
                                {pkg.duration_days >= 365 && (
                                    <span style={badgeBestValue}>Tiết kiệm</span>
                                )}

                                <h3 style={{ fontSize: '13px', margin: '0 0 5px 0' }}>{pkg.name}</h3>
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#ff9f1c' }}>
                                    {formatPrice(pkg.price)}
                                </div>
                                <small style={{ color: '#a4b0be', fontSize: '11px' }}>
                                    {pkg.duration_days > 3650 ? 'Trọn đời' : `Dùng ${pkg.duration_days} ngày`}
                                </small>
                            </div>
                        ))}
                    </div>

                    {/* QUYỀN LỢI */}
                    {selectedPkg && (
                        <div style={benefitBoxStyle}>
                            <p style={{ fontWeight: 'bold', marginBottom: 5, color: '#2d3436', fontSize: '13px' }}>
                                <Gem color='#2092de' /> Đặc quyền {selectedPkg.name}:
                            </p>
                            {selectedPkg.benefits ? (
                                (typeof selectedPkg.benefits === 'string' ? JSON.parse(selectedPkg.benefits) : selectedPkg.benefits).slice(0, 3).map((item, i) => (
                                    <div key={i} style={{ marginBottom: 2, fontSize: '12px' }}><SquareCheck fill="#00b894" /> {item}</div>
                                ))
                            ) : (
                                <p style={{ fontSize: '12px' }}>Đang tải quyền lợi...</p>
                            )}
                        </div>
                    )}

                    {/* NHẬP MÃ GIẢM GIÁ */}
                    <div style={{ margin: '15px 0 10px 0', display: 'flex', gap: '8px' }}>
                        <input
                            type="text" placeholder="Mã giảm giá"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            style={inputStyle}
                        />
                        <button onClick={handleApplyCoupon} style={applyBtnStyle}>Áp dụng</button>
                    </div>
                    {couponMsg && (
                        <p style={{ color: couponMsg.startsWith(<SquareCheck color='#00b894' />) ? '#00b894' : '#ff7675', fontSize: '11px', margin: '0 0 10px 0', textAlign: 'left' }}>{couponMsg}</p>
                    )}

                    {/* TỔNG TIỀN & NÚT */}
                    <div style={totalSectionStyle}>
                        <div style={{ textAlign: 'left' }}>
                            <span style={{ fontSize: '12px', color: '#636e72' }}>Tổng cộng:</span><br />
                            <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#ff7675' }}>
                                {formatPrice(finalPrice)}
                            </span>
                        </div>

                        <button onClick={handlePayOS} style={btnPrimaryStyle} disabled={isLoading || !selectedPkg}>
                            {isLoading ? "Đang xử lý..." : (premiumInfo.isPremium ? "Gia hạn ngay" : "Thanh toán")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- STYLES BỔ SUNG ---
const vipStatusBadgeStyle = {
    background: '#fff9e6',
    border: '1px solid #ffe08a',
    borderRadius: '10px',
    padding: '10px',
    marginBottom: '15px',
    fontSize: '13px',
    color: '#856404'
};

const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '15px',
    overflowY: 'auto',
    zIndex: 10000
};
const modalStyle = { background: '#fff', padding: '20px', borderRadius: '20px', width: '100%', maxWidth: '480px', textAlign: 'center', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', margin: 'auto', maxHeight: '90vh', overflowY: 'auto' };
const closeBtnStyle = { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#b2bec3' };
const packageListStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '15px' };
const packageCardStyle = { padding: '12px 5px', borderRadius: '15px', cursor: 'pointer', position: 'relative', transition: '0.2s' };
const badgeBestValue = { position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', background: '#ff7675', color: '#fff', fontSize: '9px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' };
const benefitBoxStyle = { textAlign: 'left', background: '#f8f9fa', padding: '12px', borderRadius: '12px', border: '1px solid #e9ecef' };
const inputStyle = { flex: 1, padding: '8px 12px', borderRadius: '10px', border: '1px solid #dfe6e9', fontSize: '13px', outline: 'none' };
const applyBtnStyle = { padding: '8px 15px', borderRadius: '10px', border: 'none', background: '#2d3436', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '12px' };
const totalSectionStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', borderTop: '1px solid #f1f2f6', paddingTop: '15px' };
const btnPrimaryStyle = { padding: '10px 20px', background: 'linear-gradient(135deg, #ff9f1c, #e17055)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 5px 15px rgba(255, 159, 28, 0.3)' };

export default PremiumModal;