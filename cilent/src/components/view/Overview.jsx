import React from 'react';

const Overview = ({ user, getGreetingTime }) => { 
    
    return (
        <div id="view-overview" className="fadeIn">
            <div className="banner" style={{ 
                background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)', 
                borderRadius: '25px', padding: '40px', color: 'white', marginBottom: '30px', 
                position: 'relative', overflow: 'hidden', boxShadow: '0 10px 20px rgba(108, 92, 231, 0.2)'
            }}>
                <div style={{ position: 'relative', zIndex: 5 }}>
                    <h1 >
                        {getGreetingTime ? getGreetingTime() : "Xin chào"}, {user?.fullname || user?.username}! 👋
                    </h1>
                    <p style={{ fontSize: '16px', opacity: 0.9 }}>Hôm nay bạn thế nào?</p>
                </div>
            </div>
            
            {/* Phần thống kê */}
            <div className="stats-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div className="stats-box" style={{ background: '#fff', padding: '20px', borderRadius: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px' }}>🔥</div>
                    <b>{user?.stats?.recipes || 0}</b> <br/><span style={{fontSize:'12px', color:'#999'}}>Công thức</span>
                </div>
                <div className="stats-box" style={{ background: '#fff', padding: '20px', borderRadius: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px' }}>👥</div>
                    <b>{user?.stats?.followers || 0}</b> <br/><span style={{fontSize:'12px', color:'#999'}}>Followers</span>
                </div>
                <div className="stats-box" style={{ background: '#fff', padding: '20px', borderRadius: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px' }}>❤️</div>
                    <b className='.stat-number'>{user?.stats?.following || 0}</b> <br/><span  style={{fontSize:'12px', color:'#999'}}>Following</span>
                </div>
            </div>
        </div>
    );
};

export default Overview;