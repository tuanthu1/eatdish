import React, { useState } from 'react';
import Toast from '../../components/Toast';
const AdminCouponModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        code: '',
        percent: 10,
        expiry_date: ''
    });
    const [error, setError] = useState('');

    const today = new Date().toISOString().split('T')[0];

    // Hàm tạo mã ngẫu nhiên
    const generateRandomCode = () => {
        const randomStr = Math.random().toString(36).substring(3, 6).toUpperCase();
        
        const randomDays = Math.floor(Math.random() * (365 - 30 + 1)) + 30; 
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + randomDays);
        
        const dateStr = futureDate.toISOString().split('T')[0];

        const randomPercent = Math.floor(Math.random() * (5 - 1 + 1) + 1) * 10;

        setFormData({ 
            code: `SALE${randomPercent}-${randomStr}`,
            percent: randomPercent,
            expiry_date: dateStr
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (formData.expiry_date && formData.expiry_date < today) {
            setError("❌ Ngày hết hạn không được nhỏ hơn ngày hiện tại!");
            return;
        }

        if (formData.percent < 1 || formData.percent > 100) {
            setError("❌ Phần trăm giảm giá phải từ 1% đến 100%");
            return;
        }

        // 3. Validate mã code
        if (!formData.code.trim()) {
             generateRandomCode();
             setError("⚠️ Vui lòng nhập mã hoặc bấm nút Random");
             return;
        }

        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="modal show">
            <div className="modal-content" style={{ width: 400 }}>
                <span className="close-btn" onClick={onClose}>&times;</span>
                <h2 style={{ marginBottom: 20, color: '#2d3436' }}>Tạo Mã Giảm Giá</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="admin-form-group">
                        <label className="admin-form-label">Mã Code</label>
                        <div style={{display: 'flex', gap: 10}}>
                            <input 
                                className="admin-form-input" 
                                value={formData.code} 
                                onChange={e => {
                                    setFormData({ ...formData, code: e.target.value.toUpperCase() });
                                    setError(''); 
                                }} 
                                placeholder="VD: TET2024"
                            />
                            <button 
                                type="button" 
                                onClick={generateRandomCode}
                                style={{background: '#6c5ce7', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', padding: '0 15px', fontWeight: 'bold'}}
                                title="Tạo ngẫu nhiên"
                            >
                                🎲 Random
                            </button>
                        </div>
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Giảm giá (%)</label>
                        <input 
                            className="admin-form-input" 
                            type="number" 
                            min="1" max="100"
                            value={formData.percent} 
                            onChange={e => setFormData({ ...formData, percent: e.target.value })} 
                            required 
                        />
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Hết hạn ngày</label>
                        <input 
                            className="admin-form-input" 
                            type="date" 
                            min={today}
                            value={formData.expiry_date} 
                            onChange={e => {
                                setFormData({ ...formData, expiry_date: e.target.value });
                                setError('');
                            }} 
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            color: '#e74c3c', 
                            background: '#fadbd8', 
                            padding: '10px', 
                            borderRadius: '8px', 
                            fontSize: '13px', 
                            marginBottom: '15px',
                            textAlign: 'center',
                            border: '1px solid #e74c3c'
                        }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn-primary-admin" style={{ width: '100%', justifyContent: 'center' }}>
                        Tạo Mã Ngay
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminCouponModal;