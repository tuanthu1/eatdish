
import InteractiveLogo from '../components/InteractiveLogo';

const Sidebar = ({ activeTab, setActiveTab, onOpenUpload, currentUser,}) => {
    const menuItems = [
        { id: 'overview', icon: '🔲', label: 'Tổng Quan' },
        { id: 'recipes', icon: '📄', label: 'Công Thức' },
        { id: 'favorites', icon: '❤️', label: 'Yêu Thích' },
        { id: 'community', icon: '👥', label: 'Cộng Đồng' },
        { id: 'settings', icon: '⚙️', label: 'Cài Đặt' }
    ];

    return (
        <aside className="sidebar-left">
            <div className="logo-wrapper" style={{ padding: '20px', textAlign: 'center' }}>
                <InteractiveLogo />
                
            </div>

            <nav>
                {menuItems.map(item => (
                    <div 
                        key={item.id}
                        className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                        style={{ cursor: 'pointer' }}
                    >
                        <span className="menu-icon">{item.icon}</span> 
                        {item.label}
                    </div>
                ))}
            </nav>
            
            <div className="promo-card" style={{ marginTop: 'auto' }}>
                <img 
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150" 
                    alt="Salad" 
                    style={{ width: '60px', height: '60px', borderRadius: '50%', border: '3px solid #fff', objectFit: 'cover', display: 'block', margin: '-40px auto 10px auto' }}
                />
                <h4 style={{ fontSize: '14px', marginBottom: '5px' }}>Chia sẻ ngay</h4>
                <p style={{ fontSize: '11px', opacity: 0.8, marginBottom: '10px' }}>Tải lên công thức của bạn</p>
                
                <button 
                    className="promo-btn" 
                    onClick={(e) => {
                        e.stopPropagation(); 
                        if (onOpenUpload) {
                            onOpenUpload(); 
                        } else {
                            console.log(e);
                        }
                    }}
                >
                    Tải Lên
                </button>
            </div>
            
        </aside>
    );
};

export default Sidebar;