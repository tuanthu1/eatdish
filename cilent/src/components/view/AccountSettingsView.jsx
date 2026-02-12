import React from 'react';

const AccountSettingsView = ({ 
    setActiveTab, 
    accountSubView, 
    setAccountSubView, 
    passwordData, 
    setPasswordData, 
    handleChangePassword, 
    handleDeleteAccount,
    styles 
}) => {
    // Các style mặc định 
    const rowStyle = styles?.rowStyle || { display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer' };
    const inputStyle = styles?.inputStyle || { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #ddd' };
    const btnOrange = styles?.btnOrange || { width: '100%', padding: '12px', background: '#ff9f1c', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' };

    return (
        <div className="fadeIn" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <button 
                    onClick={() => accountSubView === 'main' ? setActiveTab('settings') : setAccountSubView('main')} 
                    style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}
                >
                    ←
                </button>
                <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Tài khoản</h2>
            </div>

            <div style={{ background: '#fff', borderRadius: '25px', padding: '10px' }}>
                {accountSubView === 'main' && (
                    <div>
                        <div className="setting-row" onClick={() => setAccountSubView('blocked')} style={rowStyle}>
                            <span>Danh sách các bếp đã bị chặn</span><span>〉</span>
                        </div>
                        <div className="setting-row" onClick={() => setAccountSubView('password')} style={rowStyle}>
                            <span>Thay đổi mật khẩu của bạn</span><span>〉</span>
                        </div>
                        <div className="setting-row" onClick={() => setAccountSubView('delete')} style={{ ...rowStyle, borderBottom: 'none' }}>
                            <span>Xóa tài khoản của bạn</span><span>〉</span>
                        </div>
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
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <p style={{ color: '#999' }}>Bạn chưa chặn bất kỳ bếp nào.</p>
                    </div>
                )}

                {accountSubView === 'delete' && (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <p style={{ color: '#e74c3c', fontWeight: '600', marginBottom: '20px' }}>Lưu ý: Hành động này không thể hoàn tác.</p>
                        <button onClick={handleDeleteAccount} style={{ ...btnOrange, background: '#e74c3c' }}>Xác nhận xóa tài khoản</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountSettingsView;