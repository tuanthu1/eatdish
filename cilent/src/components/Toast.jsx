import React from 'react';

const Toast = ({ type = 'success', title, message, onClose }) => {
    // Chọn icon dựa theo type
    const icons = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };

    const titles = {
        success: 'Thành công!',
        error: 'Thất bại!',
        warning: 'Cảnh báo!',
        info: 'Thông báo'
    };

    return (
        <div className={`toast ${type}`}>
            {/* Đây là chỗ dùng Material Icons */}
            <span className="material-icons toast-icon">
                {icons[type]}
            </span>
            
            <div className="toast-body">
                <h3 className="toast-title">{title || titles[type]}</h3>
                <p className="toast-message">{message}</p>
            </div>

            {/* Nút tắt nhanh */}
            <span 
                className="material-icons" 
                style={{ cursor: 'pointer', color: '#ccc', marginLeft: 10 }}
                onClick={onClose}
            >
                close
            </span>
            <div className="toast-progress"></div>
        </div>
    );
};

export default Toast;