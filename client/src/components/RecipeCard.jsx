import React, { useState } from 'react';
import '../index.css';
import { Flame, Clock, Heart, MoreVertical, MessageSquareWarning } from 'lucide-react';
import Modal from './Modal';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';

const DEFAULT_RECIPE_IMAGE = '/logo.png';

const getFullImageUrl = (url) => {
    if (!url) return DEFAULT_RECIPE_IMAGE;
    if (url.startsWith('http')) return url; 
    if (url.startsWith('undefined/')) return `https://eatdish.net/${url.replace('undefined/', '')}`;
    if (url.startsWith('/')) return `https://eatdish.net${url}`;
    return `https://eatdish.net/${url}`;
};

const formatClassification = (value, fallback) => {
    if (!value) return fallback;
    return String(value).replace(/_/g, ' ');
};

const RecipeCard = ({ item, isFavorite, onToggleFavorite, onOpenModal, onViewProfile }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');

    const displayTitle = item.name || item.title || 'Món ăn ngon';
    const displayImg = getFullImageUrl(item.img || item.image || item.image_url);
    const displayDescription = item.description || item.desc || '';
    const displayAuthorName = item.fullname || item.author_name || item.username || 'Đầu bếp EatDish';
    
    let displayAvatar = item.avatar || item.author_avatar;
    displayAvatar = displayAvatar ? getFullImageUrl(displayAvatar) : `https://ui-avatars.com/api/?name=${displayAuthorName}&background=random`;

    const targetId = item._id || item.id;
    const authorId = item.author?._id || item.user_id || item.author_id;
    const categoryLabel = item.category_label || formatClassification(item.category, 'Khác');
    const mealTypeLabel = item.meal_type_label || formatClassification(item.meal_type, 'Không xác định');
    
    return (
        <div className="recipe-card-wrapper">
            <div className="recipe-card-fav-btn" onClick={(e) => { e.stopPropagation(); onToggleFavorite(targetId, e); }}>
                <Heart 
                    size={20} 
                    color={isFavorite ? "#ff4757" : "#555"} 
                    fill={isFavorite ? "#ff4757" : "none"} 
                    style={{ transition: 'all 0.2s ease-in-out' }}
                />
            </div>

            <div className="recipe-card-main">
                <div className="recipe-card-body">
                    <div className="recipe-card-author-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onViewProfile(authorId); }}>
                            <img src={displayAvatar} alt="author" className="recipe-card-author-avt" style={{ margin: 0 }} />
                            <span className="author-name-text">
                                {displayAuthorName}
                            </span>
                        </div>

                        {/* Dấu 3 chấm */}
                        <div style={{ position: 'relative' }} onMouseLeave={() => setIsMenuOpen(false)}>
                            <button 
                                className="recipe-card-menu-btn"
                                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                            >
                                <MoreVertical size={18} />
                            </button>
                            {isMenuOpen && (
                                <div className="dropdown-menu-container" >
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setIsMenuOpen(false);
                                            setIsReportModalOpen(true);
                                        }}
                                        className="dropdown-item report-btn"
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fff0f0'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <MessageSquareWarning size={16} /> Báo cáo món
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <h3 onClick={() => onOpenModal(item)} className="recipe-card-title">{displayTitle}</h3>

                    {displayDescription ? (
                        <p className="recipe-card-description" onClick={() => onOpenModal(item)}>
                            {displayDescription}
                        </p>
                    ) : null}

                    <div className="recipe-card-meta-row">
                        <div className="meta-item"><Clock size={15} /> <span>{item.time || 0} phút</span></div>
                        <div className="meta-item"><span><Flame fill='#ff9f1c' color='#ff9f1c'/></span> <span className="highlight-calo">{item.calories || 0} calo</span></div>
                    </div>

                    <div className="recipe-card-classify-row">
                        <span className="recipe-card-classify-pill">{categoryLabel}</span>
                        <span className="recipe-card-classify-pill muted">{mealTypeLabel}</span>
                    </div>
                </div>

                <div className="recipe-card-img-wrapper" onClick={() => onOpenModal(item)}>
                    <img
                        src={displayImg}
                        alt={displayTitle}
                        className="recipe-card-img"
                        onError={(e) => {
                            if (e.currentTarget.src.endsWith(DEFAULT_RECIPE_IMAGE)) return;
                            e.currentTarget.src = DEFAULT_RECIPE_IMAGE;
                        }}
                    />
                    {(item.is_premium === 1 || item.is_vip === 1) && <div className="recipe-card-premium-badge">👑 PREMIUM</div>}
                </div>
            </div>

            {/* Modal Báo cáo */}
            <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Báo cáo công thức">
                <div onClick={(e) => e.stopPropagation()}>
                    <p style={{ marginBottom: '15px', color: '#666' }}>Vui lòng cho biết lý do bạn báo cáo công thức <b>{displayTitle}</b>:</p>
                    <textarea
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        placeholder="Nhập lý do báo cáo..."
                        style={{ width: '100%', minHeight: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '15px' }}
                    />
                    <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button className="btn-confirm-no" onClick={() => setIsReportModalOpen(false)}>Hủy</button>
                        <button className="btn-confirm-yes"  onClick={async () => {
                            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                            if (!token) return toast.error("Vui lòng đăng nhập để báo cáo!");
                            if (!reportReason.trim()) return toast.warning("Vui lòng nhập lý do báo cáo!");

                            try {
                                await axiosClient.post(`/recipes/report`, {
                                    reportedRecipeId: targetId,
                                    reason: reportReason
                                });
                                toast.success("Đã gửi báo cáo công thức thành công!");
                                setIsReportModalOpen(false);
                                setReportReason('');
                            } catch (err) {
                                toast.error(err.response?.data?.message || "Lỗi khi báo cáo công thức!");
                            }
                        }}>Gửi báo cáo</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default RecipeCard;