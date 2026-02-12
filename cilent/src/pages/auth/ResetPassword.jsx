import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import backgroundImage from '../../../../cilent/src/logo/background.jpeg';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token'); 
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [msg, setMsg] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg('');
        if (password !== confirmPass) return setMsg("Mật khẩu xác nhận không khớp!");
        if (password.length < 6) return setMsg("Mật khẩu phải có ít nhất 6 ký tự");
        

        try {
            await axiosClient.post('/auth/reset-password', { token, newPassword: password });
            setIsSuccess(true);
            setMsg("Đổi mật khẩu thành công!");
            
            setTimeout(() => {
                navigate('/login-register');
            }, 2000);
        } catch (err) {
            setMsg(err.response?.data?.message || "Link đã hết hạn hoặc không hợp lệ");
            setIsSuccess(false);
        }
    };

    if (!token) return (
        <div style={wrapperStyle}>
            <div style={cardStyle}>
                <h3>⚠️ Link không hợp lệ hoặc đã hết hạn</h3>
                <button onClick={() => navigate('/login-register')} style={btnStyle}>Quay lại trang chủ</button>
            </div>
        </div>
    );

    return (
        <div style={wrapperStyle}>
            {/* Lớp phủ màu tối giống Auth.jsx */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 }}></div>

            <div style={cardStyle}>
                <h2 style={{ textAlign: 'center', marginBottom: 20, color: '#333' }}>Đặt Lại Mật Khẩu </h2>
                
                {msg && <div style={{
                    color: isSuccess ? '#00b894' : '#ff7675', 
                    background: isSuccess ? '#e0fcf6' : '#fff0f0',
                    padding: '10px', borderRadius: '10px',
                    textAlign: 'center', marginBottom: 15, fontSize: '14px'
                }}>
                    {isSuccess ? '✅ ' : '⚠️ '}{msg}
                </div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={labelStyle}>Mật khẩu mới</label>
                        <input 
                            type="password" 
                            placeholder="********" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={inputStyle}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label style={labelStyle}>Xác nhận mật khẩu</label>
                        <input 
                            type="password" 
                            placeholder="********" 
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                            required
                            style={inputStyle}
                        />
                    </div>

                    <button type="submit" style={btnStyle}>
                        Lưu Mật Khẩu
                    </button>

                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                        <span 
                            style={{ cursor: 'pointer', color: '#ff9f1c', fontWeight: 'bold' }} 
                            onClick={() => navigate('/login-register')}
                        >
                            ← Quay lại Đăng Nhập
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Styles
const wrapperStyle = {
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh', 
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative'
};

const cardStyle = {
    background: '#fff', 
    padding: '40px 50px', 
    borderRadius: '15px', 
    boxShadow: '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)', 
    width: '400px',
    zIndex: 2,
    position: 'relative'
};

const inputStyle = {
    background: '#eee', 
    border: 'none', 
    padding: '12px 15px', 
    width: '100%', 
    borderRadius: '10px',
    fontSize: '14px',
    boxSizing: 'border-box'
};

const labelStyle = {
    display: 'block', 
    marginBottom: '5px', 
    fontWeight: '600', 
    fontSize: '13px',
    color: '#333',
    textAlign: 'left'
};

const btnStyle = {
    width: '100%',
    borderRadius: '25px', 
    border: 'none', 
    background: '#ff9f1c', 
    color: '#ffffff', 
    fontSize: '12px', 
    fontWeight: 'bold', 
    padding: '12px 45px', 
    letterSpacing: '1px', 
    textTransform: 'uppercase', 
    cursor: 'pointer', 
    marginTop: '10px',
    transition: 'transform 80ms ease-in',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
};

export default ResetPassword;