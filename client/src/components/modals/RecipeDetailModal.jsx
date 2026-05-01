import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../Modal'; 
import PremiumModal from './PremiumModal'; 
import ConfirmModal from './ConfirmModal';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { ShoppingCart, Lock, Crown, Trash2, MessageSquareWarning } from 'lucide-react';
const CustomMedal = ({ size = 20, color = "#000000" }) => (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 300 300"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path 
                fill={color} // Đổ màu cho icon
                d="M213.102,185.5H189.5v-22.995c0-0.09,0.405-0.177,0.402-0.265c4.652-6.007,8.892-12.613,12.19-19.24 c1.305-0.232,2.721-0.66,4.019-1.28c5.963-2.849,11.425-9.791,14.523-18.571c5.115-14.5,2.081-27.414-7.232-30.705 c-2.195-0.779-4.901-0.904-6.901-0.408V80.109c15-4.4,24.59-15.13,24.59-28.058c0-14.737-11.351-26.466-27.705-29.438 C197.584,9.189,176.408,0,149.32,0c-27.124,0-48.269,9.252-53.934,22.754C79.262,26.057,67.368,37.9,67.368,51.945 c0,12.796,9.132,23.186,23.132,27.659v12.488c-3-0.706-5.196-0.258-6.913,0.35c-9.313,3.293-12.2,16.205-7.087,30.707 c2.068,5.861,5.329,11.061,9.035,14.642c3.059,2.954,6.546,4.74,9.89,5.256c3.53,7.088,7.075,14.145,13.075,20.469V185.5H84.563 c-28.742,0-52.063,23.666-52.063,52.408v26.82c0,2.943,1.67,5.621,4.335,6.871c41.311,19.393,80.245,25.401,112.658,25.4 c17.062,0,32.307-1.666,45.132-3.92c40.39-7.101,65.313-21.14,66.371-21.734c2.392-1.344,3.504-3.874,3.504-6.617v-26.82 C264.5,209.166,241.844,185.5,213.102,185.5z M174.5,196.658l-15.038,15.131L123.5,189.41v-11.222 c7,5.429,15.819,8.807,24.992,8.807c9.579,0,18.008-3.681,26.008-9.542V196.658L174.5,196.658z M82.872,51.945 c0-7.597,8.26-13.973,19.215-14.83c3.798-0.297,6.788-3.366,6.987-7.172c0.314-6.02,16.15-14.762,40.249-14.762 c24.183,0,40.116,8.76,40.463,14.789c0.221,3.855,3.303,6.93,7.158,7.144c10.996,0.608,18.977,6.892,18.977,14.938 c0,6.942-7.228,12.769-18.103,14.502c-3.685,0.587-6.318,3.765-6.318,7.496V88.5h-86V73.633c0-3.688-2.24-6.844-5.873-7.479 C88.877,64.278,82.872,58.966,82.872,51.945z M200.122,103.549c1.561,2.689,4.604,4.211,7.621,3.785 c0.349,1.972,0.36,5.807-1.375,10.725c-2.041,5.785-4.989,8.859-6.334,9.742c-1.571-0.516-3.274-0.5-4.855,0.048 c-1.986,0.688-3.599,2.174-4.452,4.095c-8.172,18.391-24.049,39.867-41.896,39.867c-17.886,0-33.773-21.537-41.945-39.983 c-0.884-1.996-2.585-3.513-4.669-4.167c-1.627-0.51-3.364-0.452-4.938,0.136c-1.362-0.911-4.278-3.964-6.301-9.697 c-1.704-4.833-1.723-8.583-1.394-10.583c3.176,0.619,6.465-1.025,8.077-3.949L200.122,103.549z M47.5,259.858v-21.95 c0-20.371,16.693-36.408,37.063-36.408h28.78l57.156,35.078v44.291C137.5,283.766,94.5,280.888,47.5,259.858z M249.5,260.081 c-8,3.959-29.116,12.938-58.175,18.046c-1.846,0.325-3.825,0.633-5.825,0.929v-46.715c0-2.634-0.974-5.079-3.216-6.461 l-9.474-5.695l19.148-18.685h21.145c20.37,0,36.398,16.037,36.398,36.408V260.081z"
            />
        </svg>
    );
const RecipeDetailModal = ({ isOpen, onClose, selectedRecipe }) => {
    const navigate = useNavigate();
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');

    const buildCurrentUser = () => {
        const id = localStorage.getItem('eatdish_user_id');
        const role = localStorage.getItem('eatdish_user_role');
        const userStr = localStorage.getItem('user');
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
    const isOwner = currentUser && selectedRecipe && currentUser.id == selectedRecipe.author_id;
    const isPremiumUser = currentUser?.is_premium === 1;
    const canViewFullRecipe = isAdmin || isPremiumUser || isOwner;
    const isLocked = (selectedRecipe.is_premium == 1 || selectedRecipe.is_vip == 1) && !canViewFullRecipe;

    if (!currentUser && isLocked) return null;

    // Hàm Xử Lý
    const safeParseArray = (data) => {
        if (!data) return [];
        
        let rawData = data;
        if (Array.isArray(rawData) && rawData.length === 1 && typeof rawData[0] === 'string' && rawData[0].trim().startsWith('[')) {
            rawData = rawData[0];
        }

        if (Array.isArray(rawData)) return rawData;
        if (typeof rawData === 'string') {
            try {
                let parsed = JSON.parse(rawData);
                
                if (typeof parsed === 'string' && parsed.trim().startsWith('[')) {
                    parsed = JSON.parse(parsed);
                }
                
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch (error) {
                let text = rawData.trim();
                if (text.startsWith('[') && text.endsWith(']')) {
                    let stripped = text.slice(1, -1);
                    return stripped.split('","').map(item => item.replace(/^["']|["']$/g, '').trim());
                }
                return [rawData];
            }
        }
        return [];
    };

    // Mở modal xác nhận xóa
    const handleDeleteClick = () => {
        setIsDeleteConfirmOpen(true);
    };

    // Thực hiện xóa
    const executeDelete = async (e) => {
        if (e) e.preventDefault();
        try {
            await axiosClient.delete(`/recipes/${selectedRecipe.id}`);
            setIsDeleteConfirmOpen(false);
            toast.success("Xóa món thành công");
            onClose(); 
            window.location.reload(); 
        } catch (err) {
            toast.error(err.response?.data?.message || "Có lỗi xảy ra khi xóa!");
            setIsDeleteConfirmOpen(false);
        }
    };

    const handleReportRecipe = async () => {
        if (!currentUser) {
            return toast.error("Vui lòng đăng nhập để báo cáo!");
        }
        if (!reportReason.trim()) {
            return toast.warning("Vui lòng nhập lý do báo cáo!");
        }

        try {
            await axiosClient.post(`/recipes/report`, {
                reportedRecipeId: selectedRecipe.id || selectedRecipe._id,
                reason: reportReason
            });
            toast.success("Đã gửi báo cáo công thức thành công!");
            setIsReportModalOpen(false);
            setReportReason('');
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi khi báo cáo công thức!");
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={selectedRecipe.name || selectedRecipe.title}>
                <div className="rd-modal-content">
                    
                    {/* Lớp phủ khóa nếu chưa mua pre */}
                    {isLocked && (
                        <div className="rd-locked-overlay">
                            <div className="rd-locked-icon"><Lock /></div>
                            <h3 className="rd-locked-title">Nội dung Premium</h3>
                            <p className="rd-locked-desc">Nâng cấp tài khoản để xem công thức này.</p>
                            
                            <button className="rd-btn-unlock" onClick={() => setIsPremiumModalOpen(true)}>
                                <Crown /> Mở khóa ngay
                            </button>
                        </div>
                    )}
                    
                    <div className={isLocked ? "rd-content-blur" : ""}>
                        
                        {/* Ảnh */}
                        <img 
                            src={selectedRecipe.img || selectedRecipe.image || selectedRecipe.image_url} 
                            className="rd-image" 
                            alt={selectedRecipe.name} 
                        />
                        {selectedRecipe.trendingBadge && (
                            <div className="rd-trending-badge">
                                <span className="rd-trending-title">🔥 Tìm kiếm hàng đầu</span>
                                <span className="rd-trending-desc">
                                    Top {selectedRecipe.trendingBadge.rank} cho từ khóa <strong>"{selectedRecipe.trendingBadge.keyword}"</strong>
                                </span>
                            </div>
                        )}
                        {/* Nguyên liệu */}
                        <div className="rd-ing-box">
                            <h3 className="rd-ing-title"><ShoppingCart /> Nguyên liệu</h3>
                            
                            {!isLocked ? (
                                <ul className="rd-ing-list">
                                    {safeParseArray(selectedRecipe.ingredients).map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="rd-msg-hidden">Nội dung nguyên liệu đã bị ẩn do chưa mua premium</p>
                            )}
                        </div>

                        {/* Cách làm */}
                        <h3 className="rd-step-title"><CustomMedal /> Cách làm</h3>
                        {!isLocked ? (
                            safeParseArray(selectedRecipe.steps || selectedRecipe.instructions).map((step, i) => (
                                <div key={i} className="rd-step-row">
                                    <div className="rd-step-num">{i + 1}</div>
                                    <div className="rd-step-text">{step}</div>
                                </div>
                            ))
                        ) : (
                            <p className="rd-msg-hidden">Hướng dẫn chi tiết chỉ dành cho thành viên VIP</p>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                            <button className="rd-btn-view-full" style={{ margin: 0 }} onClick={() => { onClose(); navigate(`/recipe/${selectedRecipe.id}`); }}>
                                Xem chi tiết đầy đủ ➜
                            </button>
                            
                            {/* Nút Xóa */}
                            {isOwner && (
                                <button className="rd-btn-delete" style={{ margin: 0, padding: '12px 20px', background: '#ff7675', color: '#fff', borderRadius: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }} onClick={handleDeleteClick}>
                                    <Trash2 size={18}/> Xóa
                                </button>
                            )}
                            
                            {/* Nút Báo cáo */}
                            {!isOwner && currentUser && (
                                <button style={{ padding: '12px 20px', background: '#fff0f0', color: '#d63031', borderRadius: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }} onClick={() => setIsReportModalOpen(true)}>
                                    <MessageSquareWarning size={18}/> Báo cáo
                                </button>
                            )}
                        </div>
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

            {/* Modal Báo cáo */}
            <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Báo cáo công thức">
                <p style={{ marginBottom: '15px', color: '#666' }}>Vui lòng cho biết lý do bạn báo cáo công thức <b>{selectedRecipe.title || selectedRecipe.name}</b>:</p>
                <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Nhập lý do báo cáo..."
                    style={{ width: '100%', minHeight: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '15px' }}
                />
                <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button className="btn-confirm-no" onClick={() => setIsReportModalOpen(false)}>Hủy</button>
                    <button className="btn-confirm-yes" onClick={handleReportRecipe}>Gửi báo cáo</button>
                </div>
            </Modal>
        </>
    );
};

export default RecipeDetailModal;