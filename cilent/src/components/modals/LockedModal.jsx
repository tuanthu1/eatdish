import React, { useState } from 'react';
import Modal from '../Modal'; 
import PremiumModal from './PremiumModal'; 

const LockedModal = ({ isOpen, onClose, recipe, setIsUploadModalOpen }) => {
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

    if (!recipe) return null;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Nội dung giới hạn">
                <div style={{ padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    
                    {/* Ảnh món ăn */}
                    <div style={{ width: '100%', height: '200px', borderRadius: '15px', overflow: 'hidden', marginBottom: '20px', position: 'relative' }}>
                        <img 
                            src={recipe.img || recipe.image || recipe.image_url} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(4px)' }} 
                            alt="" 
                        />
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '60px' }}>
                            🔒
                        </div>
                    </div>

                    <h2 style={{ color: '#2d3436', margin: '10px 0' }}>{recipe.name || recipe.title}</h2>
                    <p style={{ color: '#636e72', marginBottom: '25px', fontSize: '16px', lineHeight: '1.5' }}>
                        Đây là công thức <b>Premium</b> dành riêng cho hội viên VIP.<br/>
                        Vui lòng nâng cấp tài khoản để xem chi tiết nguyên liệu và cách làm.
                    </p>

                    <button 
                        onClick={() => { setIsPremiumModalOpen(true); setIsUploadModalOpen(false); }}
                        style={{
                            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                            color: '#fff', border: 'none', padding: '12px 35px',
                            fontSize: '16px', fontWeight: 'bold', borderRadius: '30px',
                            cursor: 'pointer', boxShadow: '0 5px 15px rgba(255, 165, 0, 0.4)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                    >
                        👑 Mở khóa ngay
                    </button>

                    <button 
                        onClick={onClose}
                        style={{ marginTop: '15px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Để sau
                    </button>
                </div>
            </Modal>
            <PremiumModal 
                isOpen={isPremiumModalOpen} 
                onClose={() => setIsPremiumModalOpen(false)}
                user={{}} 
                onUpgradeSuccess={() => window.location.reload()} 
            />
        </>
    );
};

export default LockedModal;