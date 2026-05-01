import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import '../../index.css';
import backgroundImage from '../../logo/background.jpeg';
import { toast } from 'react-toastify';

const AuthPage = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isForgot, setIsForgot] = useState(false);
    const [searchParams] = useSearchParams();
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

    //  XỬ LÝ ĐĂNG NHẬP GOOGLE
    const handleGoogleSuccess = async (tokenResponse) => {
        setIsLoading(true);
        try {
            const res = await axiosClient.post('/auth/google', {
                token: tokenResponse.access_token
            });

            if (res.data.status === 'success') {
                const user = res.data.user;
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('eatdish_user_id', user.id);
                localStorage.setItem('eatdish_user_role', user.role || 'user');

                if (user.role === 'admin') window.location.href = '/admin';
                else {
                    toast.success("Đăng nhập Google thành công!");
                    window.location.href = '/';
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Đăng nhập Google thất bại tại Server!");
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => toast.error('Đăng nhập Google bị hủy hoặc gặp sự cố!'),
    });

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (formData.fullname.trim().length < 2) return toast.error('Họ và tên phải có ít nhất 2 ký tự');
        if (formData.username.length < 6) return toast.error('Tên đăng nhập phải có ít nhất 6 ký tự');
        
        try {
            const checkRes = await axiosClient.post('/auth/check-user', {
                username: formData.username,
                email: formData.email
            });
            const payload = checkRes.data || {};

            if (payload.exists || payload.status === 'exists' || payload.usernameExists || payload.emailExists) {
                if (payload.usernameExists) return toast.error('Tên đăng nhập đã tồn tại');
                if (payload.emailExists) return toast.error('Email đã được sử dụng');
                return toast.error(payload.message || 'Người dùng đã tồn tại');
            }
        } catch (err) {}
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return toast.error('Email không hợp lệ');
        if (formData.password.length < 6) return toast.error('Mật khẩu phải có ít nhất 6 ký tự');

        setIsLoading(true);
        try {
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullname)}&background=random&color=fff&size=128`;
            const dataToSubmit = { ...formData, avatar: avatarUrl };

            const res = await axiosClient.post('/auth/register', dataToSubmit);
            
            if (res.data.status === 'success') {
                toast.success('Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.');
                setTimeout(() => setIsSignUp(false), 1500);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!formData.username?.trim()) {
            toast.error("Vui lòng nhập tên đăng nhập hoặc email");
            setIsLoading(false);
            return;
        }
        if (!formData.password) {
            toast.error("Vui lòng nhập mật khẩu");
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
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', res.data.token);
                if (res.data.refreshToken) localStorage.setItem('refresh_token', res.data.refreshToken);
                localStorage.setItem('eatdish_user_id', user.id);
                localStorage.setItem('eatdish_user_role', user.role);

                if (user.role === 'admin') window.location.href = '/admin';
                else {
                    toast.success("Đăng nhập thành công");
                    window.location.href = '/';
                }
            }
        } catch (err) {
            if (err.response) {
                const status = err.response.status;
                const message = err.response.data?.message;
                
                if (status === 404) toast.error("Sai tên đăng nhập hoặc email");
                else if (status === 400) toast.error("Sai mật khẩu");
                else if (status === 403) toast.error("Tài khoản bị vô hiệu hóa");
                else toast.error(message || "Đăng nhập thất bại");
            } else {
                toast.error("Không thể kết nối tới server");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();

        if (!resetEmail) return toast.error("Vui lòng nhập email của bạn");

        setIsLoading(true);
        try {
            const res = await axiosClient.post('/auth/forgot-password', { email: resetEmail });
            toast.error(res.data.message);
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi gửi yêu cầu. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (searchParams.get('expired') === 'true') {
            toast.error('⏳ Phiên đăng nhập đã hết hạn để đảm bảo bảo mật. Vui lòng đăng nhập lại!');
            setIsSignUp(false);
        }
    }, [searchParams]);

    return (
        <div className="auth-page-wrapper" style={{ backgroundImage: `url(${backgroundImage})` }}>
            <div className="auth-overlay-dark"></div>

            <div className={`auth-container ${isSignUp ? 'right-panel-active' : ''}`}>
                
                {/* ĐĂNG KÝ */}
                <div className="form-container register-container">
                    <form onSubmit={handleRegister} className="auth-form-container">
                        <div className="auth-input-group">
                            <label className="auth-label">Họ và tên</label>
                            <input type="text" name="fullname" value={formData.fullname} onChange={handleChange} placeholder="VD: Nguyễn Văn A" className="auth-input-field" required />
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-label">Tên đăng nhập</label>
                            <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="VD: user123" className="auth-input-field" required />
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-label">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" className="auth-input-field" required />
                        </div>

                        <div className="auth-input-group mb-20">
                            <label className="auth-label">Mật khẩu</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="********" className="auth-input-field" required />
                        </div>

                        <button type="submit" disabled={isLoading} className="btn-auth-primary">
                            {isLoading ? 'Đang tạo tài khoản...' : 'Đăng Ký'}
                        </button>
                    </form>
                </div>

                {/* ĐĂNG NHẬP */}
                <div className="form-container login-container">
                    {isForgot ? (
                        <form onSubmit={handleForgotPassword} className="auth-form-container">
                            <h2>Quên Mật Khẩu 🔒</h2>
                            <p className="auth-subtitle">Nhập email của bạn để nhận link đặt lại mật khẩu.</p>
                            
                            <div className="auth-input-group mb-15">
                                <label className="auth-label">Email đăng ký</label>
                                <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="email@example.com" className="auth-input-field" required />
                            </div>

                            <button type="submit" disabled={isLoading} className="btn-auth-primary">
                                {isLoading ? 'Đang gửi...' : 'Gửi Link Xác Nhận'}
                            </button>

                            <div className="auth-link-bottom">
                                <span onClick={() => { setIsForgot(false); toast.error(''); toast.error(''); }}>
                                    ← Quay lại Đăng Nhập
                                </span>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="auth-form-container">
                            <h2>Đăng Nhập</h2>
                            
                            <div className="auth-input-group mb-15">
                                <label className="auth-label">Tên đăng nhập / Email</label>
                                <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="VD: user123" className="auth-input-field" required />
                            </div>
                            
                            <div className="auth-input-group mb-10">
                                <label className="auth-label">Mật khẩu</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="********" className="auth-input-field" required />
                            </div>

                            <div className="auth-forgot-link">
                                <span onClick={() => { setIsForgot(true); toast.error(''); toast.error(''); }}>
                                    Quên Mật Khẩu?
                                </span>
                            </div>


                            <button type="submit" disabled={isLoading} className="btn-auth-primary">
                                {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                            </button>

                            <div className="auth-divider">
                                <span>HOẶC</span>
                            </div>
                            <button type="button" onClick={() => loginWithGoogle()} className="btn-auth-google">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="google-icon"/>
                                Đăng nhập bằng Google
                            </button>

                            <div className="auth-link-bottom text-normal" style={{marginTop: '15px'}}>
                                Bạn muốn trải nghiệm thử?
                                <span onClick={() => navigate('/')}> Vào trang chủ</span>
                            </div>
                        </form>
                    )}
                </div>

                {/* OVERLAY PANEL DỊCH CHUYỂN */}
                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel-content overlay-panel-left">
                            <h1>Chào mừng trở lại!</h1>
                            <p>Để giữ kết nối với chúng tôi, vui lòng đăng nhập bằng thông tin cá nhân của bạn.</p>
                            <button className="ghost" onClick={() => setIsSignUp(false)}>Đăng Nhập</button>
                        </div>

                        <div className="overlay-panel-content overlay-panel-right">
                            <h1>Xin chào, bạn mới!</h1>
                            <p>Nhập thông tin cá nhân của bạn và bắt đầu hành trình nấu nướng cùng chúng tôi.</p>
                            <button className="ghost" onClick={() => setIsSignUp(true)}>Đăng Ký</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;