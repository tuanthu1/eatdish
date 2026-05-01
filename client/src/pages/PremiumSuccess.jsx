import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import '../index.css'; 
import { CalendarFold, CircleX, PartyPopper, SquareCheck } from 'lucide-react';
const PremiumSuccess = () => {
    const [searchParams] = useSearchParams();
    
    // Khai báo các State 
    const [packageName, setPackageName] = useState('Premium');
    const [benefits, setBenefits] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [premiumInfo, setPremiumInfo] = useState({
            expireDate: null
    });
    const formatExpiryDate = (dateString) => {
        if (!dateString) return 'Vĩnh viễn (Trọn đời)';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    useEffect(() => {
        const fetchPackageDetails = async () => {
            try {
                const packageId = searchParams.get('packageId');
                const orderCode = searchParams.get('orderCode');
                const status = searchParams.get('status');

                // Nếu có orderCode và thanh toán thành công, gọi API verify để cập nhật (đặc biệt khi test localhost webhook không chạy)
                if (orderCode && (status === 'PAID' || status === 'SUCCESS')) {
                    try {
                        await axiosClient.post('/payment/verify-return', { orderCode });
                    } catch (e) {
                        console.error("Lỗi verify-return:", e);
                    }
                }

                // Lấy thông tin gói
                const resPkgs = await axiosClient.get('/packages');
                let boughtPackage = resPkgs.data.find(p => p.id == packageId);
                if (boughtPackage) {
                    setPackageName(boughtPackage.name);
                    setBenefits(typeof boughtPackage.benefits === 'string' ? JSON.parse(boughtPackage.benefits) : boughtPackage.benefits);
                }

                // Cập nhật lại trạng thái Premium từ Server
                try {
                    const resStatus = await axiosClient.get(`/status?t=${Date.now()}`);
                    const userStr = localStorage.getItem('user') || localStorage.getItem('eatdish_user');
                    if (userStr) {
                        const currentUser = JSON.parse(userStr);
                        const updatedUser = {
                            ...currentUser,
                            is_premium: resStatus.data.is_premium,
                            premium_until: resStatus.data.premium_until
                        };
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                        localStorage.setItem('eatdish_user', JSON.stringify(updatedUser));
                    }
                    setPremiumInfo({
                        expireDate: resStatus.data.premium_until
                    });
                } catch (statusErr) {
                    console.log("Khách chưa đăng nhập hoặc lỗi lấy trạng thái VIP");
                }
            } catch (err) {
                console.error("Lỗi cập nhật ngày thành công:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPackageDetails();
    }, [searchParams]);

    return (
        <div className="premium-success-container">
            <div className="premium-success-card fadeIn">
                <div className="premium-icon"><PartyPopper /></div>
                <h1 className="premium-title">THANH TOÁN THÀNH CÔNG!</h1>
                <p className="premium-desc">
                    Chào mừng Bếp Trưởng V.I.P. Tài khoản của bạn đã được nâng cấp <b>{packageName}</b>.
                </p>

                {/*  HẠN DÙNG */}
                <div style={{
                    backgroundColor: '#fff4e6', color: '#d35400', padding: '10px', 
                    borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold',
                    textAlign: 'center', border: '1px solid #ffe0b2'
                }}>
                    <CalendarFold /> Hạn dùng đến ngày: {formatExpiryDate(premiumInfo.expireDate) || 'Đang cập nhật...'}
                </div>
                
                <div className="premium-info-box">
                    {isLoading ? (
                        <p>Đang tải đặc quyền... </p>
                    ) : benefits && benefits.length > 0 ? (
                        benefits.map((item, index) => (
                            <p key={index}><SquareCheck /> {item}</p>
                        ))
                    ) : (
                        <>
                            <p><CircleX />Không có đặc quyền nào</p>
                        </>
                    )}
                </div>

                <button 
                    onClick={() => {
                        window.location.href = "/"; 
                    }} 
                    className="premium-btn"
                >
                    Bắt đầu trải nghiệm ngay
                </button>
            </div>
        </div>
    );
};

export default PremiumSuccess;