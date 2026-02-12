import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import '../../index.css';
import backgroundImage from '../../../../cilent/src/logo/background.jpeg';
import Toast from '../../components/Toast';

const AuthPage = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isForgot, setIsForgot] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // form data state for both login and register forms
    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        email: '',
        password: ''
    });
    const [resetEmail, setResetEmail] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    //đăng kí
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        
        if (formData.fullname.trim().length < 2) {
            setError('Họ và tên phải có ít nhất 2 ký tự');
            return;
        }
        if (formData.username.length < 6) {
            setError('Tên đăng nhập phải có ít nhất 6 ký tự');
            return;
        }
        try {
            const checkRes = await axiosClient.post('/auth/check-user', {
                username: formData.username,
                email: formData.email
            });
            const payload = checkRes.data || {};

            if (payload.exists || payload.status === 'exists' || payload.usernameExists || payload.emailExists) {
                if (payload.usernameExists) {
                    setError('Tên đăng nhập đã tồn tại');
                    return;
                }
                if (payload.emailExists) {
                    setError('Email đã được sử dụng');
                    return;
                }
                setError(payload.message || 'Người dùng đã tồn tại');
                return;
            }
        } catch (err) {
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Email không hợp lệ');
            return;
        }
        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }


        setIsLoading(true);

        try {
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullname)}&background=random&color=fff&size=128`;
            const dataToSubmit = { ...formData, avatar: avatarUrl };

            const res = await axiosClient.post('/auth/register', dataToSubmit);
            
            if (res.data.status === 'success') {
                setSuccessMsg('Đăng ký thành công! Đang chuyển sang đăng nhập...');
                setTimeout(() => {
                    setIsSignUp(false);
                }, 1500);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
        } finally {
            setIsLoading(false);
        }
    };
    // đăng nhập
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!formData.username?.trim()) {
            setError("Vui lòng nhập tên đăng nhập hoặc email");
            setIsLoading(false);
            return;
        }

        if (!formData.password) {
            setError("Vui lòng nhập mật khẩu");
            setIsLoading(false);
            return;
        }

        try {
            const res = await axiosClient.post('/auth/login', {
                username: formData.username.trim(),
                password: formData.password
            });

            if (res.data.status === 'success') {
                const user = res.data.user;

                localStorage.setItem('token', res.data.token);
                localStorage.setItem('refresh_token', res.data.refreshToken);
                localStorage.setItem('eatdish_user_id', user.id);
                localStorage.setItem('eatdish_user_role', user.role);

                if (user.role === 'admin') {
                    window.location.href = '/admin';
                } else {
                    setSuccessMsg("Đăng nhập thành công");
                    window.location.href = '/';
                }
            }

        } catch (err) {
            if (err.response) {
                const status = err.response.status;
                const message = err.response.data?.message;
                
                if (status === 404) {
                    setError("Sai tên đăng nhập hoặc email");
                } 
                else if (status === 400) {
                    setError("Sai mật khẩu");
                } 
                else if (status === 403) {
                    setError("Tài khoản bị vô hiệu hóa");
                } 
                else {
                    setError(message || "Đăng nhập thất bại");
                }
            } else {
                setError("Không thể kết nối tới server");
            }
        } finally {
            setIsLoading(false);
        }
    };
    // quên mật khẩu
    // --- XỬ LÝ QUÊN MẬT KHẨU (MỚI) ---
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!resetEmail) return setError("Vui lòng nhập email của bạn");

        setIsLoading(true);
        try {
            const res = await axiosClient.post('/auth/forgot-password', { email: resetEmail });
            setSuccessMsg(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || "Lỗi gửi yêu cầu. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };
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
        setError('');
        setSuccessMsg('');
    }, [isSignUp, isForgot]);

    return (
        <div className='login-page-wrapper' style={{ display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'}}
        >

            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,1,0.4)', zIndex: 1 }}></div>
            <div className={`auth-container ${isSignUp ? 'right-panel-active' : ''}`}>
                
                {/*  ĐĂNG KÝ */}
                <div className="form-container register-container">
                    <form onSubmit={handleRegister} style={formStyle}>
                        {/* Fullname */}
                        <div >
                            <label style={labelStyle}>Họ và tên</label>
                            <input type="text" name="fullname" value={formData.fullname} onChange={handleChange} placeholder="VD: Nguyễn Văn A" style={inputStyle} required />
                        </div>

                        {/* Username */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={labelStyle}>Tên đăng nhập</label>
                            <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="VD: user123" style={inputStyle} required />
                        </div>

                        {/*  Email */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={labelStyle}>Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" style={inputStyle} required />
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>Mật khẩu</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="********" style={inputStyle} required />
                        </div>

                        {error && <div style={{ color: '#ff7675', marginBottom: '20px', fontSize: '14px', background: '#fff0f0', padding: '10px', borderRadius: '10px' }}>⚠️ {error}</div>}
                        {successMsg && <div style={{ color: '#00b894', marginBottom: '20px', fontSize: '14px', background: '#e0fcf6', padding: '10px', borderRadius: '10px' }}>✅ {successMsg}</div>}

                        <button type="submit" disabled={isLoading} style={btnStyle}>
                            {isLoading ? 'Đang tạo tài khoản...' : 'Đăng Ký'}
                        </button>
                        
                    </form>
                </div>

                {/* ĐĂNG NHẬP */}
                <div className="form-container login-container">
                    {isForgot ? (
                        <form onSubmit={handleForgotPassword} style={formStyle}>
                            <h2>Quên Mật Khẩu 🔒</h2>
                            <p style={{fontSize: '13px', color: '#666', marginBottom: '20px'}}>Nhập email của bạn để nhận link đặt lại mật khẩu.</p>
                            
                            <div style={{ width: '100%', marginBottom: '15px' }}>
                                <label style={labelStyle}>Email đăng ký</label>
                                <input 
                                    type="email" 
                                    value={resetEmail} 
                                    onChange={(e) => setResetEmail(e.target.value)} 
                                    placeholder="email@example.com" 
                                    style={inputStyle} 
                                    required 
                                />
                            </div>

                            {error && <div style={{ color: '#ff7675', marginBottom: '15px', fontSize: '14px' }}>⚠️ {error}</div>}
                            {successMsg && <div style={{ color: '#00b894', marginBottom: '15px', fontSize: '14px' }}>✅ {successMsg}</div>}

                            <button type="submit" disabled={isLoading} style={btnStyle}>
                                {isLoading ? 'Đang gửi...' : 'Gửi Link Xác Nhận'}
                            </button>

                            <div style={{ marginTop: '20px', fontSize: '14px' }}>
                                <span 
                                    style={{ cursor: 'pointer', color: '#ff9f1c', fontWeight: 'bold' }} 
                                    onClick={() => { setIsForgot(false); setError(''); setSuccessMsg(''); }}
                                >
                                    ← Quay lại Đăng Nhập
                                </span>
                            </div>
                        </form>
                    ) : (
                        /* CASE 2: FORM ĐĂNG NHẬP (Mặc định) */
                        <form onSubmit={handleLogin} style={formStyle}>
                            <h2>Đăng Nhập</h2>
                            
                            <div style={{ width: '100%', marginBottom: '15px' }}>
                                <label style={labelStyle}>Tên đăng nhập / Email</label>
                                <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="VD: user123" style={inputStyle} required />
                            </div>
                            
                            <div style={{ width: '100%', marginBottom: '10px' }}>
                                <label style={labelStyle}>Mật khẩu</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="********" style={inputStyle} required />
                            </div>

                            {/* Link Quên mật khẩu */}
                            <div style={{ width: '100%', textAlign: 'right', marginBottom: '15px' }}>
                                <span 
                                    style={{ cursor: 'pointer', color: '#ff9f1c', fontSize: '13px', fontWeight: '500' }} 
                                    onClick={() => { setIsForgot(true); setError(''); setSuccessMsg(''); }}
                                >
                                    Quên Mật Khẩu?
                                </span>
                            </div>

                            {error && <div style={{ color: '#ff7675', marginBottom: '15px', fontSize: '14px' }}>⚠️ {error}</div>}
                            {successMsg && <div style={{ color: '#00b894', marginBottom: '15px', fontSize: '14px' }}>✅ {successMsg}</div>}

                            <button type="submit" disabled={isLoading} style={btnStyle}>
                                {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                            </button>

                            <div style={{ marginTop: '20px', fontSize: '14px' }}>
                                Bạn muốn trải nghiệm thử?
                                <span style={{ cursor: 'pointer', color: '#ff9f1c', fontWeight: '500', marginLeft: '5px' }} onClick={() => navigate('/')}> 
                                    Vào trang chủ
                                </span>
                            </div>
                        </form>
                    )}
                </div>
                <div className="overlay-container">
                    <div className="overlay">
                        {/* Khối nội dung hiện ra khi đang ở màn hình Đăng Ký (để chuyển sang Đăng Nhập) */}
                        <div style={overlayPanelLeft}>
                            <h1>Chào mừng trở lại!</h1>
                            <p>Để giữ kết nối với chúng tôi, vui lòng đăng nhập bằng thông tin cá nhân của bạn.</p>
                            <button 
                                className="ghost" 
                                onClick={() => setIsSignUp(false)}
                            >
                                Đăng Nhập
                            </button>
                            
                        </div>

                        {/* Khối nội dung hiện ra khi đang ở màn hình Đăng Nhập (để chuyển sang Đăng Ký) */}
                        <div style={overlayPanelRight}>
                            <h1>Xin chào, bạn mới!</h1>
                            <p>Nhập thông tin cá nhân của bạn và bắt đầu hành trình nấu nướng cùng chúng tôi.</p>
                            <button 
                                className="ghost" 
                                onClick={() => setIsSignUp(true)} 
                            >
                                Đăng Ký
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

// Inline Styles 
const formStyle = { display: 'flex', flexDirection: 'column', padding: '0 50px', height: '100%', justifyContent: 'center', alignItems: 'center', textAlign: 'center' };
const inputStyle = { background: '#eee', border: 'none', padding: '12px 15px', margin: '8px 0', width: '100%', borderRadius: '10px' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: '#555', textAlign: 'left', alignSelf: 'flex-start' };
const btnStyle = { borderRadius: '20px', border: 'none', background: '#ff9f1c', color: '#ffffff', fontSize: '12px', fontWeight: 'bold', padding: '12px 45px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', marginTop: '10px' };
const overlayPanelRight = { position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '0 40px', textAlign: 'center', top: 0, height: '100%', width: '50%', right: 0 };
const overlayPanelLeft = { position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '0 40px', textAlign: 'center', top: 0, height: '100%', width: '50%', left: 0 };

export default AuthPage;