import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient"; 
import '../../index.css'; 

export default function VerifyEmail() {
    const [params] = useSearchParams();
    const token = params.get("token");
    const navigate = useNavigate();
    const calledRef = useRef(false);
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Đang xác minh email của bạn...');

    useEffect(() => {
        if (!token || calledRef.current) return;

        calledRef.current = true;

        axiosClient.get(`/auth/verify-email?token=${token}`)
            .then(() => {
                setStatus('success');
                setMessage("Xác minh email thành công! Đang chuyển hướng về trang đăng nhập...");
                setTimeout(() => navigate('/login-register'), 3000);
            })
            .catch((err) => {
                setStatus('error');
                setMessage(
                    err.response?.data?.message || "Token không hợp lệ hoặc đã hết hạn."
                );
            });
    }, [token, navigate]);

    return (
        <div className="auth-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 }}></div>

            <div className="auth-container" style={{ 
                zIndex: 2, 
                width: '400px', 
                minHeight: '300px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '40px',
                textAlign: 'center',
                background: '#fff',
                borderRadius: '20px'
            }}>
                <div style={{ fontSize: '60px', marginBottom: '20px' }}>
                    {status === 'loading' && <div className="spinner">⏳</div>}
                    {status === 'success' && "✅"}
                    {status === 'error' && "❌"}
                </div>

                <h2 style={{ color: '#2d3436', marginBottom: '15px' }}>
                    {status === 'loading' ? "Vui lòng chờ" : status === 'success' ? "Thành Công!" : "Rất tiếc"}
                </h2>
                
                <p style={{ color: '#636e72', fontSize: '16px', lineHeight: '1.5' }}>
                    {message}
                </p>

                {status === 'error' && (
                    <button 
                        onClick={() => navigate('/login-register')}
                        style={{
                            marginTop: '25px',
                            padding: '10px 25px',
                            background: '#ff9f1c',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Quay lại Đăng nhập
                    </button>
                )}
            </div>
        </div>
    );
}