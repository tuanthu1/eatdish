import React from 'react';

const RecipeCard = ({ item, isFavorite, onToggleFavorite, onOpenModal, onViewProfile }) => {
    return (
    <div className="card" style={{ 
        background: '#fff', 
        borderRadius: '20px', 
        overflow: 'hidden', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)', 
        transition: 'transform 0.3s',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
    }}>
        {/*  Nút Tim Yêu Thích */}
        <div 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id, e); }}
            style={{ 
                position: 'absolute', top: '15px', right: '15px', 
                background: 'rgba(255,255,255,0.9)', borderRadius: '50%', 
                width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
        >
            {isFavorite ? '❤️' : '🤍'}
        </div>

        {/* Phần Ảnh món ăn */}
        <div 
            onClick={() => onOpenModal(item)} 
            style={{ 
                position: 'relative', 
                height: '180px', 
                overflow: 'hidden', 
                cursor: 'pointer' 
            }}
        >
            <img 
                src={item.img} 
                alt={item.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} 
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            />

            {/* NHÃN PREMIUM*/}
            {item.is_premium === 1 && (
                <div style={{
                    position: 'absolute', 
                    bottom: '2px',
                    right: '2px',
                    background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                    color: 'white', 
                    padding: '5px 12px', 
                    borderRadius: '15px',
                    fontWeight: 'bold', 
                    fontSize: '11px', 
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px',
                    zIndex: 5 
                }}>
                    👑 PREMIUM
                </div>
            )}
        </div>

        {/* Phần thông tin dưới chân */}
        <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            
            {/* Thông tin Calo và Thời gian */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>🔥</span> 
                    <span style={{ fontWeight: '600', color: '#ff9f1c' }}>{item.calories} calo</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>⏳</span> {item.time} phút
                </div>
            </div>

            {/* Tên món ăn */}
            <h3 onClick={() => onOpenModal(item)} style={{ fontSize: '17px', margin: '0 0 12px 0', cursor: 'pointer', color: '#333', fontWeight: 'bold', lineHeight: '1.4' }}>
                {item.name}
            </h3>

            {/* Tác giả */}
            <div 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    borderTop: '1px solid #f2f2f2', 
                    paddingTop: '10px', 
                    cursor: 'pointer' 
                }} 
                onClick={(e) => {
                    e.stopPropagation(); 
                    onViewProfile(item.user_id || item.author_id);
                }}
            >
                <img 
                    src={item.avatar || 'https://ui-avatars.com/api/?name=User'} 
                    style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }} 
                    alt="author" 
                />
                <span style={{ fontSize: '12px', color: '#777', fontWeight: '500' }}>
                    Đăng bởi <span style={{ color: '#333' }}>{item.fullname}</span>
                </span>
            </div>
        </div>
    </div>
);
};

export default RecipeCard;