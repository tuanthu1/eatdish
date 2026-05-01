import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; 
import axiosClient from '../api/axiosClient';
import '../index.css';
import { X } from 'lucide-react';
const PremiumCancel = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        const orderCode = searchParams.get('orderCode');
        if (orderCode) {
            axiosClient.post('/payment/cancel-transaction', { orderCode })
                .catch(err => console.log("Không thể cập nhật trạng thái hủy", err));
        }
    }, [searchParams]);

    useEffect(() => {
        if (countdown <= 0) {
            navigate('/'); 
            return;
        }
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown, navigate]);

    return (
        <div className="premium-cancel-container">
            <div className="premium-cancel-card fadeIn">
                <div className="cancel-icon"><X /></div>
                <h1 className="cancel-title">THANH TOÁN BỊ HỦY</h1>
                <p className="cancel-desc">
                    Giao dịch chưa được hoàn tất.<br/>
                    Hệ thống sẽ tự động quay lại trang chủ trong <strong className="countdown-text">{countdown}</strong> giây...
                </p>
                <button onClick={() => navigate('/')} className="btn-return-home">
                    Quay lại ngay
                </button>
            </div>
        </div>
    );
};

export default PremiumCancel;