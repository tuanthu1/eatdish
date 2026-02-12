import React, { useState, useEffect } from 'react';

const AdminPackageModal = ({ isOpen, onClose, onSubmit, initialData, isEditMode }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        duration_days: 30,
        description: '',
        benefits: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && initialData) {
                let benefitsText = '';
                if (initialData.benefits) {
                    try {
                        const bArray = typeof initialData.benefits === 'string' 
                            ? JSON.parse(initialData.benefits) 
                            : initialData.benefits;
                        
                        if (Array.isArray(bArray)) {
                            benefitsText = bArray.join('\n');
                        }
                    } catch (e) {
                        console.error("Lỗi parse benefits", e);
                    }
                }
                setFormData({
                    name: initialData.name,
                    price: initialData.price,
                    duration_days: initialData.duration_days,
                    description: initialData.description || '',
                    benefits: benefitsText
                });
            } else {
                setFormData({ 
                    name: '', price: '', duration_days: 30, description: '', 
                    benefits: "100+ công thức độc quyền\nAI Chat không giới hạn\nHuy hiệu Premium\nKhông quảng cáo" // Gợi ý mặc định
                });
            }
        }
    }, [isOpen, isEditMode, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const benefitsArray = formData.benefits
            .split('\n')                
            .map(line => line.trim())   
            .filter(line => line !== ''); 

        onSubmit({
            ...formData,
            benefits: JSON.stringify(benefitsArray) 
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal show">
            <div className="modal-content" style={{ width: 450 }}>
                <span className="close-btn" onClick={onClose}>&times;</span>
                <h2 style={{ marginBottom: 20, color: '#2d3436' }}>
                    {isEditMode ? "Sửa Gói Cước" : "Thêm Gói Mới"}
                </h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="admin-form-group">
                        <label className="admin-form-label">Tên gói</label>
                        <input 
                            className="admin-form-input" 
                            value={formData.name} 
                            onChange={e => setFormData({ ...formData, name: e.target.value })} 
                            required 
                            placeholder="VD: Gói Tháng"
                        />
                    </div>
                    
                    <div style={{display: 'flex', gap: 15}}>
                        <div className="admin-form-group" style={{flex: 1}}>
                            <label className="admin-form-label">Giá (VNĐ)</label>
                            <input 
                                className="admin-form-input" 
                                type="number" 
                                value={formData.price} 
                                onChange={e => setFormData({ ...formData, price: e.target.value })} 
                                required 
                                placeholder="50000"
                            />
                        </div>
                        <div className="admin-form-group" style={{flex: 1}}>
                            <label className="admin-form-label">Thời hạn (ngày)</label>
                            <input 
                                className="admin-form-input" 
                                type="number" 
                                value={formData.duration_days} 
                                onChange={e => setFormData({ ...formData, duration_days: e.target.value })} 
                                placeholder="30"
                            />
                        </div>
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Mô tả ngắn</label>
                        <input 
                            className="admin-form-input" 
                            value={formData.description} 
                            onChange={e => setFormData({ ...formData, description: e.target.value })} 
                            placeholder="Mô tả hiển thị bên dưới gói..."
                        />
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Danh sách quyền lợi (Mỗi dòng 1 ý)</label>
                        <textarea 
                            className="admin-form-input" 
                            rows="5" 
                            value={formData.benefits} 
                            onChange={e => setFormData({ ...formData, benefits: e.target.value })} 
                            placeholder="VD:&#10;Xem full công thức&#10;Tắt quảng cáo&#10;Hỗ trợ 24/7"
                            style={{lineHeight: '1.5', resize: 'vertical'}}
                        />
                    </div>

                    <button type="submit" className="btn-primary-admin" style={{ width: '100%', justifyContent: 'center' }}>
                        {isEditMode ? "Lưu thay đổi" : "Tạo gói ngay"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminPackageModal;