import React, { useState, useEffect } from 'react'; 
import ConfirmModal from '../modals/ConfirmModal';
import axiosClient from '../../api/axiosClient';
import '../../index.css';
import { 
    TERMS_OF_SERVICE, PRIVACY_POLICY, COOKIE_POLICY, 
    COMMUNITY_GUIDELINES, FAQ_CONTENT 
} from '../../data/policyContent';
const SettingView = ({ user }) => {
    // STATES QUẢN LÝ TAB
    const getUserId = () => {
        if (user && user.id) return user.id;
        return localStorage.getItem('eatdish_user_id');
    };
    const currentUserId = getUserId();
    const [activeTab, setActiveTab] = useState('main'); 
    const [accountSubView, setAccountSubView] = useState('main'); 
    const [blockedList, setBlockedList] = useState([]);
    // State form dữ liệu
    const [passwordData, setPasswordData] = useState({ old: '', new: '', confirm: '' });
    const [feedbackData, setFeedbackData] = useState({ type: 'Lỗi ứng dụng', content: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isGuest, setIsGuest] = useState(false);

    // kiểm tra user có phải khách không
    useEffect(() => {
        if (!user || !user.id) {
            setIsGuest(true);
        } else {
            setIsGuest(false);
        }
    }, [user]);

    // (FAQ, CHÍNH SÁCH)
    const renderPageContent = (title, content, backTo = 'main') => (
        <div className="fadeIn" style={{ maxWidth: '100%', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <button onClick={() => setActiveTab(backTo)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#666' }}>←</button>
                <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>{title}</h2>
            </div>
            <div style={{ background: '#fff', borderRadius: '25px', padding: '30px', lineHeight: '1.6', color: '#444', maxHeight: '70vh', overflowY: 'auto', textAlign: 'justify', boxShadow: '0 5px 20px rgba(0,0,0,0.02)' }}>
                {content}
            </div>
        </div>
    );
    useEffect(() => {
        if (accountSubView === 'blocked') {
            fetchBlockedList();
        }
    }, [accountSubView]);
    //  BẮT LỖI & MỞ MODAL 
    const handleChangePassword = () => {
        if (!passwordData.old || !passwordData.new || !passwordData.confirm) {
            return setError("Vui lòng nhập đầy đủ thông tin!");
        }
        if (passwordData.new !== passwordData.confirm) {
            return setError("Mật khẩu xác nhận không khớp!");
        }
        if (passwordData.new.length < 6) {
            return setError("Mật khẩu mới phải có ít nhất 6 ký tự!");
        }

        setIsConfirmModalOpen(true);
    };

    // GỌI API 
    const submitChangePassword = async () => {
        // Lấy user từ localStorage
        const userStr = localStorage.getItem('user') || localStorage.getItem('eatdish_user');
        const currentUser = userStr ? JSON.parse(userStr) : null;

        if (!currentUser) return setError("Lỗi user!");

        try {
            await axiosClient.put('/users/change-password', { 
                userId: currentUser.id, 
                oldPassword: passwordData.old, 
                newPassword: passwordData.new 
            });

            setIsConfirmModalOpen(false);
            setSuccessMsg("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
            setPasswordData({ old: '', new: '', confirm: '' });
            
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/login';
            }, 2000);

        } catch (err) {
            setIsConfirmModalOpen(false); 
            setError(err.response?.data?.message || "Đổi mật khẩu thất bại.");
        }
    };
    // xóa accout
    const handleDeleteAccount = async () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa tài khoản vĩnh viễn?")) {
            try {
                await axiosClient.delete(`/users/${user.id}`);
                localStorage.clear();
                window.location.href = '/login';
            } catch (err) { setError("Lỗi khi xóa tài khoản."); }
        }
    };
    // Gửi góp ý
    const handleSubmitFeedback = async () => {
        if (!feedbackData.content.trim()) return setError("Vui lòng nhập nội dung góp ý!");
        if (!currentUserId) return setError("Phiên đăng nhập hết hạn. Hãy đăng nhập lại!");

        setIsSubmitting(true);
        try {
            const res = await axiosClient.post('/feedback', { 
                userId: currentUserId, 
                type: feedbackData.type, 
                content: feedbackData.content 
            });

            console.log(" Kết quả từ Server:", res);
            
            setSuccessMsg("Cảm ơn bạn! Góp ý đã được gửi thành công. ❤️");
            setFeedbackData({ type: 'Lỗi ứng dụng', content: '' });
            setActiveTab('main');

        } catch (err) { 
            console.error(" Lỗi chi tiết:", err);
            if (err.response) {
                setError(`Lỗi Server (${err.response.status}): ${err.response.data?.message || 'Không rõ lỗi'}`);
            } else if (err.request) {
                setError("Không thể kết nối đến Server! Hãy kiểm tra xem Backend đã bật chưa.");
            } else {
                setError("Lỗi lạ: " + err.message);
            }
        } finally { 
            setIsSubmitting(false); 
        }
    };
    // Hàm lấy danh sách chặn
    const fetchBlockedList = async () => {
        try {
            const res = await axiosClient.get(`/users/blocked?userId=${currentUserId}`);
            setBlockedList(res.data);
        } catch (e) { console.error(e); }
    };
    // Hàm bỏ chặn
    const handleUnblock = async (blockedId) => {
        if(!window.confirm("Bạn muốn bỏ chặn người này?")) return;
        try {
            await axiosClient.post('/users/unblock', { blockerId: currentUserId, blockedId });
            fetchBlockedList(); // Load lại danh sách sau khi bỏ chặn
        } catch (e) { setError("Lỗi khi bỏ chặn"); }
    };
    // hàm kiểm tra khách
    const handleGuestAction = () => {
        if (isGuest)
        {
            setError("Vui lòng đăng nhập để thực hiện hành động này!");
            setActiveTab('main');
        }
        else {
            return;
        }
    };

    useEffect(() => {
        if (error || successMsg) {
            const timer = setTimeout(() => {
                setError('');
                setSuccessMsg('');
            }, 3000); // Hiện trong 3 giây
    
             return () => clearTimeout(timer); 
        }
    }, [error, successMsg]);
    const rowStyle = { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: '15px', color: '#333', transition: 'background 0.2s' };
    const inputStyle = { width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #eee', background: '#f9fafc', marginBottom: '15px', outline: 'none' };
    const btnOrange = { width: '100%', padding: '15px', background: '#ff9f1c', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' };

    return (
        <div id="view-settings" className="fadeIn">
            {(error || successMsg) && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 9999,
                    padding: '15px 25px',
                    borderRadius: '12px',
                    background: error ? '#ff4757' : '#2ed573',
                    color: '#fff',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    animation: 'slideIn 0.3s ease-out',
                    maxWidth: '300px',
                    wordWrap: 'break-word',
                    overflow: 'hidden',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                }}>
                    <span>{error ? '⚠️' : '✅'}</span>
                    <span>{error || successMsg}</span>
                </div>
            )}
            {activeTab === 'main' && (
                <>
                    <div className="banner" style={{ background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)', marginBottom: '30px', borderRadius: '20px', padding: '40px', color: 'white' }}>
                        <div className="banner-text"><h1>Cài đặt</h1><p>Quản lý bếp và trải nghiệm cá nhân.</p></div>
                    </div>
                    <div style={{ maxWidth: '100%', margin: '0 auto', background: '#fff', borderRadius: '25px', padding: '10px', boxShadow: '0 5px 20px rgba(0,0,0,0.02)' }}>
                        <div className="setting-row" onClick={() => {setActiveTab('account_settings'); handleGuestAction();}} style={rowStyle}><span>🛡️ Tài khoản & Bảo mật</span><span>〉</span></div>
                        <div className="setting-row" onClick={() => {setActiveTab('notifications_settings'); handleGuestAction();}} style={rowStyle}><span>🔔 Cài đặt thông báo</span><span>〉</span></div>
                        <div className="setting-row" onClick={() => {setActiveTab('faq');}} style={rowStyle}><span>❓ Câu hỏi thường gặp (FAQ)</span><span>〉</span></div>
                        <div className="setting-row" onClick={() => {setActiveTab('feedback');}} style={rowStyle}><span>💌 Góp ý & Phản hồi</span><span>〉</span></div>
                        <div className="setting-row" onClick={() => {setActiveTab('policies_menu');}} style={rowStyle}><span>⚖️ Pháp lý & Chính sách</span><span>〉</span></div>
                        
                    </div>
                </>
            )}

            {/*  TÀI KHOẢN & BẢO MẬT*/}
            {activeTab === 'account_settings' && (
                <div className="fadeIn" style={{ maxWidth: '100%', margin: '0 auto', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                        <button onClick={() => accountSubView === 'main' ? setActiveTab('main') : setAccountSubView('main')} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>←</button>
                        <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Tài khoản</h2>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '25px', padding: '10px' }}>
                        {accountSubView === 'main' && (
                            <div>
                                <div className="setting-row" onClick={() => setAccountSubView('blocked')} style={rowStyle}><span>Danh sách chặn</span><span>〉</span></div>
                                <div className="setting-row" onClick={() => setAccountSubView('password')} style={rowStyle}><span>Đổi mật khẩu</span><span>〉</span></div>
                                <div className="setting-row" onClick={() => setAccountSubView('delete')} style={{ ...rowStyle, borderBottom: 'none' }}><span style={{ color: '#e74c3c' }}>Xóa tài khoản</span><span>〉</span></div>
                            </div>
                        )}
                        {accountSubView === 'password' && (
                            <div style={{ padding: '20px' }}>
                                <h3 style={{ marginBottom: '20px' }}>Đổi mật khẩu</h3>
                                <input type="password" placeholder="Mật khẩu cũ" style={inputStyle} value={passwordData.old} onChange={(e) => setPasswordData({...passwordData, old: e.target.value})} />
                                <input type="password" placeholder="Mật khẩu mới" style={inputStyle} value={passwordData.new} onChange={(e) => setPasswordData({...passwordData, new: e.target.value})} />
                                <input type="password" placeholder="Xác nhận mật khẩu mới" style={inputStyle} value={passwordData.confirm} onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})} />
                                <button onClick={handleChangePassword} style={btnOrange}>Lưu mật khẩu mới</button>
                            </div>
                        )}
                        {accountSubView === 'blocked' && (
                            <div style={{ padding: '20px' }}>
                                <h3 style={{ marginBottom: '20px' }}>Danh sách chặn ({blockedList.length})</h3>
                                
                                {blockedList.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#999', padding: '30px' }}>
                                        Bạn chưa chặn ai.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {blockedList.map(u => (
                                            <div key={u.id} style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center',
                                                padding: '10px',
                                                background: '#f9f9f9',
                                                borderRadius: '10px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <img src={u.avatar || "https://via.placeholder.com/40"} alt="avt" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    <div>
                                                        <div style={{ fontWeight: 'bold' }}>{u.fullname}</div>
                                                        <div style={{ fontSize: '12px', color: '#888' }}>@{u.username}</div>
                                                    </div>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => handleUnblock(u.id)}
                                                    style={{
                                                        padding: '8px 15px',
                                                        background: '#fff',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    🔓 Bỏ chặn
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {accountSubView === 'delete' && (
                            <div style={{ padding: '20px', textAlign: 'center' }}>
                                <p style={{ color: '#e74c3c', marginBottom: '20px', background: '#ffecec', padding: '15px', borderRadius: '10px' }}>⚠️ Hành động này không thể hoàn tác.</p>
                                <button onClick={handleDeleteAccount} style={{ ...btnOrange, background: '#e74c3c' }}>Xác nhận xóa</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* CÀI ĐẶT THÔNG BÁO*/}
            {activeTab === 'notifications_settings' && (
                <div className="fadeIn" style={{ maxWidth: '100%', margin: '0 auto', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                        <button onClick={() => setActiveTab('main')} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>←</button>
                        <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Thông báo</h2>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '25px', padding: '30px' }}>
                        <h3 style={{marginBottom: '20px'}}>Email</h3>
                        {[
                            { id: 'tutorial', label: 'Hướng dẫn sử dụng', desc: 'Email hướng dẫn tính năng mới.' },
                            { id: 'newsletter', label: 'Bản tin EatDish', desc: 'Gợi ý món ngon và sự kiện cộng đồng.' }
                        ].map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                                <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: '#ff9f1c' }} />
                                <div><div style={{ fontWeight: 'bold' }}>{item.label}</div><div style={{ fontSize: '13px', color: '#888' }}>{item.desc}</div></div>
                            </div>
                        ))}
                        <button onClick={() => { alert('Đã lưu!'); setActiveTab('main'); }} style={btnOrange}>Lưu cài đặt</button>
                    </div>
                </div>
            )}

            {/*GÓP Ý & PHẢN HỒI */}
            {activeTab === 'feedback' && (
                <div className="fadeIn" style={{ maxWidth: '100%', margin: '0 auto', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                        <button onClick={() => setActiveTab('main')} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>←</button>
                        <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Góp ý & Phản hồi</h2>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '25px', padding: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Vấn đề của bạn:</label>
                        <select 
                            value={feedbackData.type} 
                            onChange={(e) => setFeedbackData({...feedbackData, type: e.target.value})} 
                            style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                            <option>Lỗi ứng dụng</option>
                            <option>Đóng góp tính năng</option>
                            <option>Giao diện</option>
                            <option>Khác</option>
                        </select>
                        
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Nội dung chi tiết:</label>
                        <textarea 
                            placeholder="Nhập ý kiến đóng góp của bạn..." 
                            value={feedbackData.content} 
                            onChange={(e) => setFeedbackData({...feedbackData, content: e.target.value})} 
                            style={{ ...inputStyle, minHeight: '150px', resize: 'none' }}
                        ></textarea>
                        
                        <button 
                            onClick={handleSubmitFeedback} 
                            disabled={isSubmitting} 
                            style={{ ...btnOrange, opacity: isSubmitting ? 0.7 : 1, transition: '0.3s' }}
                        >
                            {isSubmitting ? 'Đang gửi... ⏳' : 'Gửi góp ý 🚀'}
                        </button>
                    </div>
                </div>
            )}

            {/*MENU CHÍNH SÁCH*/}
            {activeTab === 'policies_menu' && (
                <div className="fadeIn" style={{ maxWidth: '100%', margin: '0 auto', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                        <button onClick={() => setActiveTab('main')} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>←</button>
                        <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Pháp lý & Chính sách</h2>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '25px', padding: '10px' }}>
                        <div className="setting-row" onClick={() => setActiveTab('policy_terms')} style={rowStyle}><span>📄 Điều khoản dịch vụ</span><span>〉</span></div>
                        <div className="setting-row" onClick={() => setActiveTab('policy_privacy')} style={rowStyle}><span>🔒 Chính sách bảo mật</span><span>〉</span></div>
                        <div className="setting-row" onClick={() => setActiveTab('policy_cookie')} style={rowStyle}><span>🍪 Chính sách Cookie</span><span>〉</span></div>
                        <div className="setting-row" onClick={() => setActiveTab('policy_community')} style={{...rowStyle, borderBottom: 'none'}}><span>🤝 Nguyên tắc cộng đồng</span><span>〉</span></div>
                    </div>
                </div>
            )}

            {/* RENDER NỘI DUNG VĂN BẢN (FAQ & POLICY)*/}
            {activeTab === 'faq' && renderPageContent("Câu hỏi thường gặp", FAQ_CONTENT)}
            {activeTab === 'policy_terms' && renderPageContent("Điều khoản dịch vụ", TERMS_OF_SERVICE, 'policies_menu')}
            {activeTab === 'policy_privacy' && renderPageContent("Chính sách bảo mật", PRIVACY_POLICY, 'policies_menu')}
            {activeTab === 'policy_cookie' && renderPageContent("Chính sách Cookie", COOKIE_POLICY, 'policies_menu')}
            {activeTab === 'policy_community' && renderPageContent("Nguyên tắc cộng đồng", COMMUNITY_GUIDELINES, 'policies_menu')}
            <ConfirmModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)} 
                onConfirm={submitChangePassword}            
                title="Xác nhận đổi mật khẩu"
                message="Bạn có chắc chắn muốn thay đổi mật khẩu không? Bạn sẽ cần đăng nhập lại sau khi đổi."
            />
        </div>
    );
};

export default SettingView;