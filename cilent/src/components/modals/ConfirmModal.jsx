import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, setIsUploadModalOpen }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 11000
        }}>
            <div className="fadeIn" style={{
                background: 'white', padding: '30px', borderRadius: '20px',
                width: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ marginTop: 0, color: '#2d3436' }}>{title || "Xác nhận"}</h3>
                <p style={{ color: '#636e72', lineHeight: '1.6', marginBottom: '25px' }}>{message}</p>
                
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    <button 
                        onClick={() => { onConfirm(); onClose();}}
                        style={{
                            padding: '10px 25px', borderRadius: '12px', border: 'none',
                            background: '#ff9f1c', color: 'white', cursor: 'pointer', fontWeight: '600'
                        }}
                    >
                        Xác nhận
                    </button>
                    <button 
                        onClick={onClose}
                        style={{
                            padding: '10px 25px', borderRadius: '12px', border: '1px solid #eee',
                            background: '#f1f2f6', cursor: 'pointer', fontWeight: '600'
                        }}
                    >
                        Hủy
                    </button>
                    
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;