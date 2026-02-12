import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PremiumSuccess = () => {
    const navigate = useNavigate();

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎉</div>
                <h1 style={{ color: '#ff9f1c' }}>THANH TOÁN THÀNH CÔNG!</h1>
                <p style={{ fontSize: '18px', color: '#636e72' }}>
                    Chào mừng Bếp Trưởng V.I.P. Tài khoản của bạn đã được nâng cấp Premium.
                </p>
                <div style={infoBoxStyle}>
                    <p>✅ Đã mở khóa 100+ công thức độc quyền</p>
                    <p>✅ AI Chat không giới hạn đã sẵn sàng</p>
                    <p>✅ Huy hiệu Premium đã được kích hoạt</p>
                </div>
                <button 
                    onClick={() => navigate('/')} 
                    style={btnStyle}
                >
                    Bắt đầu trải nghiệm ngay
                </button>
            </div>
        </div>
    );
};

// CSS 
const containerStyle = { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fff5e6' };
const cardStyle = { background: '#fff', padding: '50px', borderRadius: '32px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', maxWidth: '500px' };
const infoBoxStyle = { textAlign: 'left', background: '#f8f9fa', padding: '20px', borderRadius: '15px', margin: '25px 0' };
const btnStyle = { width: '100%', padding: '15px', background: 'linear-gradient(135deg, #ff9f1c, #e17055)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' };

export default PremiumSuccess;