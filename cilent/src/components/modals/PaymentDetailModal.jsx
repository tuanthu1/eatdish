import React from 'react';

//  STYLE 
const overlayStyle = { 
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    display: 'flex', justifyContent: 'center', alignItems: 'center', 
    zIndex: 1000, backdropFilter: 'blur(5px)' 
};

const modalContentStyle = { 
    background: '#fff', 
    width: '420px', 
    borderRadius: '30px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.1)', 
    overflow: 'hidden', 
    animation: 'fadeIn 0.3s',
    fontFamily: "'Poppins', sans-serif" 
};

const headerStyle = { 
    padding: '25px', 
    borderBottom: '1px dashed #eee', 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    background: '#fff' 
};

const bodyStyle = { padding: '25px' };

const rowStyle = { 
    display: 'flex', justifyContent: 'space-between', 
    marginBottom: '18px', alignItems: 'center',
    fontSize: '14px'
};

const labelStyle = { color: '#a4b0be', fontWeight: '500' };
const valueStyle = { fontWeight: '600', color: '#2d3436' };

const closeBtnStyle = { 
    background: '#f1f2f6', border: 'none', 
    width: '32px', height: '32px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px', cursor: 'pointer', color: '#636e72',
    transition: '0.2s'
};

const statusBadge = { 
    padding: '6px 14px', borderRadius: '20px', 
    color: '#fff', fontSize: '12px', fontWeight: '700' 
};

const dividerStyle = { height: '1px', background: '#f1f2f6', margin: '20px 0' };

const footerStyle = { 
    padding: '20px', textAlign: 'center', 
    background: '#fff' 
};

const btnStyle = { 
    padding: '12px 40px', 
    background: '#ff9f1c', 
    color: '#fff', border: 'none', 
    borderRadius: '15px', fontWeight: '600', 
    cursor: 'pointer',
    boxShadow: '0 5px 15px rgba(255, 159, 28, 0.3)',
    transition: 'transform 0.2s'
};

const PaymentDetailModal = ({ isOpen, onClose, payment }) => {
    if (!isOpen || !payment) return null;

    // Format tiền tệ
    const formatCurrency = (amount) => 
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    // Format ngày giờ
    const formatDate = (dateString) => 
        new Date(dateString).toLocaleString('vi-VN', { 
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' 
        });

    return (
        <div className="modal-overlay" style={overlayStyle}>
            <div className="modal-content" style={modalContentStyle}>
                <div style={headerStyle}>
                    <h2 style={{ margin: 0, color: '#2d3436', fontSize: '20px' }}>Chi tiết hóa đơn</h2>
                    <button 
                        onClick={onClose} 
                        style={closeBtnStyle}
                        onMouseOver={(e) => {e.currentTarget.style.background = '#ff7675'; e.currentTarget.style.color='white'}}
                        onMouseOut={(e) => {e.currentTarget.style.background = '#f1f2f6'; e.currentTarget.style.color='#636e72'}}
                    >
                        ✕
                    </button>
                </div>

                <div style={bodyStyle}>
                    <div style={rowStyle}>
                        <span style={labelStyle}>Mã giao dịch:</span>
                        <span style={{...valueStyle, fontFamily: 'monospace', background: '#f1f2f6', padding: '4px 8px', borderRadius: '6px'}}>
                            #{payment.order_id}
                        </span>
                    </div>
                    
                    <div style={rowStyle}>
                        <span style={labelStyle}>Khách hàng:</span>
                        <div style={{textAlign: 'right'}}>
                            <div style={{...valueStyle, fontSize: '15px'}}>{payment.fullname || payment.username}</div>
                            <small style={{color: '#a4b0be'}}>{payment.email}</small>
                        </div>
                    </div>

                    <div style={dividerStyle}></div>

                    <div style={rowStyle}>
                        <span style={labelStyle}>Tổng thanh toán:</span>
                        <span style={{...valueStyle, color: '#ff9f1c', fontSize: '22px', fontWeight: '800'}}>
                            {formatCurrency(payment.amount)}
                        </span>
                    </div>

                    <div style={rowStyle}>
                        <span style={labelStyle}>Trạng thái:</span>
                        <span style={{
                            ...statusBadge, 
                            background: payment.status === 'success' ? '#00b894' : '#ff7675',
                            boxShadow: payment.status === 'success' ? '0 4px 10px rgba(0, 184, 148, 0.3)' : '0 4px 10px rgba(255, 118, 117, 0.3)'
                        }}>
                            {payment.status === 'success' ? 'THÀNH CÔNG' : (payment.status || 'THẤT BẠI').toUpperCase()}
                        </span>
                    </div>

                    <div style={rowStyle}>
                        <span style={labelStyle}>Thời gian:</span>
                        <span style={valueStyle}>{formatDate(payment.created_at)}</span>
                    </div>

                    <div style={rowStyle}>
                        <span style={labelStyle}>Phương thức:</span>
                        <span style={{...valueStyle, display: 'flex', alignItems: 'center', gap: '5px'}}>
                            💳 PayOS (QR)
                        </span>
                    </div>
                </div>

                <div style={footerStyle}>
                    <button 
                        onClick={onClose} 
                        style={btnStyle}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetailModal;