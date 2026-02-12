import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../Modal'; 
import PremiumModal from './PremiumModal'; 
import ConfirmModal from './ConfirmModal';
import axiosClient from '../../api/axiosClient';

const RecipeDetailModal = ({ isOpen, onClose, selectedRecipe }) => {
    const navigate = useNavigate();
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const buildCurrentUser = () => {
        const id = localStorage.getItem('eatdish_user_id');
        const role = localStorage.getItem('eatdish_user_role');
        const userStr = localStorage.getItem('eatdish_user');
        const parsedUser = userStr ? JSON.parse(userStr) : {};
        
        if(id && role) {
            return {
                id: Number(id),
                role: role,
                is_admin: role === 'admin',
                is_premium: parsedUser.is_premium || 0 
            }
        }
        return null;
    }

    const currentUser = buildCurrentUser();

    if (!selectedRecipe) { return null; }

    const isAdmin = currentUser?.is_admin === true;
    const canViewFullRecipe = isAdmin || currentUser?.is_premium === 1;
    const isLocked = (selectedRecipe.is_premium == 1 || selectedRecipe.is_vip == 1) && !canViewFullRecipe;
    
    // Check user hiện tại có phải chủ bài viết không
    const isOwner = currentUser && selectedRecipe && currentUser.id == selectedRecipe.author_id;

    if (!currentUser && isLocked) return null;

    // Hàm Xử Lý
    const safeParse = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        try { return JSON.parse(data); } catch (e) { return [data]; }
    };

    // Mở modal xác nhận xóa
    const handleDeleteClick = () => {
        setIsDeleteConfirmOpen(true);
    };

    // Thực hiện xóa
    const executeDelete = async () => {
        e.preventDefault();
        setSuccessMsg('');
        try {
            await axiosClient.delete(`/recipes/${selectedRecipe.id}`);
            setIsDeleteConfirmOpen(false);
            setSuccessMsg("Xóa món thành công");
            onClose(); 
            window.location.reload(); 
        } catch (err) {
            alert(err.response?.data?.message || "Có lỗi xảy ra khi xóa!");
            setIsDeleteConfirmOpen(false);
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={selectedRecipe.name || selectedRecipe.title}>
                <div className="recipe-detail-content" style={{ padding: '0 15px', maxHeight: '75vh', overflowY: 'auto', position: 'relative' }}>
                    
                    {/* Lớp phủ khóa nếu chưa mua pre */}
                    {isLocked && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(255, 255, 255, 0.85)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 50,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '10px', textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '50px', marginBottom: '10px' }}>🔒</div>
                            <h3 style={{ color: '#2d3436', margin: '0 0 10px 0' }}>Nội dung Premium</h3>
                            <p style={{ color: '#636e72', marginBottom: '20px' }}>Nâng cấp tài khoản để xem công thức này.</p>
                            
                            <button 
                                onClick={() => setIsPremiumModalOpen(true)}
                                style={{
                                    background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                                    border: 'none', padding: '10px 25px', color: '#fff',
                                    fontWeight: 'bold', borderRadius: '25px', cursor: 'pointer',
                                    boxShadow: '0 4px 10px rgba(255, 165, 0, 0.4)'
                                }}
                            >
                                👑 Mở khóa ngay
                            </button>
                        </div>
                    )}
                    
                    <div style={{ filter: isLocked ? 'blur(6px)' : 'none', pointerEvents: isLocked ? 'none' : 'auto', userSelect: isLocked ? 'none' : 'text' }}>
                        
                        {/* Ảnh */}
                        <img 
                            src={selectedRecipe.img || selectedRecipe.image || selectedRecipe.image_url} 
                            style={{ width: '100%', borderRadius: '15px', height: '250px', objectFit: 'cover', marginBottom: '20px' }} 
                            alt="" 
                        />

                        {/* Nguyên liệu */}
                        <div style={{ marginBottom: '20px', background: '#fff8e1', padding: '20px', borderRadius: '15px' }}>
                            <h3 style={{ color: '#ff9f1c', marginTop: 0 }}>🛒 Nguyên liệu</h3>
                            
                            {!isLocked ? (
                                <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                                    {safeParse(selectedRecipe.ingredients).map((ing, i) => <li key={i}>{ing}</li>)}
                                </ul>
                            ) : (
                                <p style={{ color: '#888', fontStyle: 'italic' }}>Nội dung nguyên liệu đã bị ẩn do chưa mua premium 🔒</p>
                            )}
                        </div>

                        {/* Cách làm */}
                        <h3 style={{ color: '#2d3436' }}>👨‍🍳 Cách làm</h3>
                        {!isLocked ? (
                            safeParse(selectedRecipe.steps || selectedRecipe.instructions).map((step, i) => (
                                <div key={i} style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                    <div style={{ flexShrink: 0, width: '25px', height: '25px', background: '#2d3436', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize:'12px' }}>{i + 1}</div>
                                    <div style={{ lineHeight: '1.6' }}>{step}</div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: '#888', fontStyle: 'italic' }}>Hướng dẫn chi tiết chỉ dành cho thành viên VIP 🔒</p>
                        )}

                        <button 
                            style={{ width: '100%', marginTop: '25px', padding: '15px', background: '#ff9f1c', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}
                            onClick={() => { onClose(); navigate(`/recipe/${selectedRecipe.id}`); }}
                        >
                            Xem chi tiết đầy đủ ➜
                        </button>
                        
                        {/* Nút Xóa */}
                        {isOwner && (
                            <button 
                                onClick={handleDeleteClick}
                                style={{ 
                                    padding: '15px 25px', 
                                    background: '#ff7675', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '15px', 
                                    fontWeight: 'bold', 
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    marginTop: '10px'
                                }}
                            >
                                🗑️ Xóa
                            </button>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Modal Thanh Toán */}
            <PremiumModal 
                isOpen={isPremiumModalOpen} 
                onClose={() => setIsPremiumModalOpen(false)}
                user={currentUser || {}}
                onUpgradeSuccess={() => window.location.reload()} 
            />

            {/* Modal Xác nhận xóa */}
            <ConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)} 
                onConfirm={executeDelete}
                title={'Xóa công thức'}
                message={
                    <span>
                        Bạn có chắc chắn muốn xóa công thức <b>{selectedRecipe.title || selectedRecipe.name}</b> không? 
                        <br/><br/>
                        <small style={{color: 'red'}}>Hành động này không thể hoàn tác.</small>
                    </span>
                }
            />
        </>
    );
};

export default RecipeDetailModal;