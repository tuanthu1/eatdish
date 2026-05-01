import React from 'react';
import { useState } from 'react';
import '../index.css'
import { useNavigate } from 'react-router-dom';
import { Wrench, Heart } from 'lucide-react';
const MaintenancePage = () => {
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login-register');
    }
    return (
        <div style={{
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh', 
            backgroundColor: '#fff9f0',
            textAlign: 'center', 
            padding: '20px', 
            fontFamily: 'Arial, sans-serif'
        }}>
            <h1 style={{ fontSize: '80px', margin: '0', animation: 'bounce 2s infinite' }}><Wrench size={50}/></h1>
            <h2 style={{ color: '#d35400', fontSize: '32px', marginBottom: '10px' }}>
                EatDish Đang Bảo Trì!
            </h2>
            <p style={{ color: '#555', fontSize: '18px', maxWidth: '500px', lineHeight: '1.6' }}>
                Trang web của chúng tôi đang tạm đóng cửa để nâng cấp hệ thống công thức, nhằm mang lại trải nghiệm tuyệt vời hơn cho bạn. 
            </p>
            <p style={{ color: '#e67e22', fontSize: '16px', fontWeight: 'bold', marginTop: '20px', marginBottom: '20px'}}>
                Vui lòng quay lại sau ít phút nhé! Cảm ơn bạn rất nhiều! <Heart 
                                         
                                        color={"#ff4757"} 
                                        fill={ "#ff4757"} 
                                    />
            </p>
             <button onClick={() => {handleLogout()}} className="maintenace-btn-logout">Đăng Xuất</button>
            <style>
                {`
                    @keyframes bounce {
                        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                        40% { transform: translateY(-20px); }
                        60% { transform: translateY(-10px); }
                    }
                `}
            </style>
        </div>
    );
};

export default MaintenancePage;