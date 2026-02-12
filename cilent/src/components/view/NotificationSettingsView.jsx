import React from 'react';

const NotificationSettingsView = ({ setActiveTab }) => {
    const notificationItems = [
        { id: 'tutorial', label: 'Hướng dẫn', desc: 'Chúng tôi sẽ email cho bạn để hướng dẫn cách tận dụng tốt nhất các tính năng của Eatdish.' },
        { id: 'from_eatdish', label: 'Từ Eatdish', desc: 'Chúng tôi sẽ email cho bạn về những sự kiện theo mùa, khảo sát và bí quyết hay từ đội ngũ Admin.' },
        { id: 'newsletter', label: 'Bản tin', desc: 'Chúng tôi sẽ email cho bạn về những bản tin, gợi ý món ngon và sự kiện nổi bật về cộng đồng Eatdish.' }
    ];

    return (
        <div className="fadeIn" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
            <h1 style={{ fontSize: '32px', color: '#333', marginBottom: '30px', fontWeight: '600' }}>Điều chỉnh chức năng thông báo</h1>
            
            <div style={{ textAlign: 'left', marginBottom: '40px' }}>
                <h3 style={{ fontSize: '18px', color: '#444', marginBottom: '20px' }}>Email</h3>
                {notificationItems.map((item) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '25px' }}>
                        <input 
                            type="checkbox" 
                            defaultChecked 
                            id={item.id} 
                            style={{ width: '18px', height: '18px', marginTop: '4px', cursor: 'pointer', accentColor: '#ff9f1c' }} 
                        />
                        <label htmlFor={item.id} style={{ cursor: 'pointer' }}>
                            <div style={{ fontWeight: '600', color: '#333', fontSize: '16px' }}>{item.label}</div>
                            <div style={{ color: '#888', fontSize: '14px', marginTop: '4px', lineHeight: '1.5' }}>{item.desc}</div>
                        </label>
                    </div>
                ))}
            </div>

            <div style={{ textAlign: 'center' }}>
                <button 
                    onClick={() => { alert('Đã cập nhật!'); setActiveTab('settings'); }} 
                    style={{ padding: '12px 60px', background: '#ff9f1c', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    Cập nhật
                </button>
            </div>
        </div>
    );
};

export default NotificationSettingsView;