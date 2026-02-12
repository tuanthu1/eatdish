import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../index.css';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <div className="icon-404">🍽️</div>
                <h1>404 - Ối! Không tìm thấy trang này</h1>
                <p>
                    Có vẻ như trang bạn tìm kiếm <b>không tồn tại</b>, 
                    hoặc bạn <b>không có quyền</b> truy cập vào bếp của người này.
                </p>
                
                <button onClick={() => navigate('/')} className="btn-home">
                    Quay về Trang chủ
                </button>
            </div>
        </div>
    );
};

export default NotFound;