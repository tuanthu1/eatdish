import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import Modal from '../Modal'; 

const EditProfileModal = ({ isOpen, onClose, currentUser, onUpdateSuccess }) => {
    // State lưu dữ liệu chỉnh sửa
    const [fullname, setFullname] = useState('');
    const [bio, setBio] = useState('');
    const [username, setUsername] = useState('');
    // State lưu file ảnh thực tế để gửi lên server
    const [avatarFile, setAvatarFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);

    // State lưu link ảnh để xem trước 
    const [previewAvatar, setPreviewAvatar] = useState('');
    const [previewCover, setPreviewCover] = useState('');
    
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // khi mở modal, điền sẵn thông tin cũ của user vào form
    useEffect(() => {
        if (isOpen && currentUser) {
            setFullname(currentUser.fullname || '');
            setBio(currentUser.bio || '');
            
            // Xử lý hiển thị ảnh cũ
            setPreviewAvatar(currentUser.avatar || '');
            setPreviewCover(currentUser.cover_img || ''); 

            // Reset file đã chọn
            setAvatarFile(null);
            setCoverFile(null);
        }
    }, [isOpen, currentUser]);

    // Hàm xử lý khi chọn file ảnh
    const handleFileChange = (e, setFile, setPreview) => {
        const file = e.target.files[0];
        if (file) {
            setFile(file);
            setPreview(URL.createObjectURL(file)); 
        }
    };

    // Hàm lưu thay đổi
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('fullname', fullname);
            formData.append('bio', bio);
            formData.append('username', username); 
            if (avatarFile) formData.append('avatar', avatarFile);
            if (coverFile) formData.append('cover_img', coverFile); 

            
            const token = localStorage.getItem('token') || localStorage.getItem('ACCESS_TOKEN');

            if (!token) {
                setError("Bạn chưa đăng nhập hoặc phiên đăng nhập hết hạn!");
                setIsLoading(false);
                return;
            }

            const res = await axiosClient.put('/users/update', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.data.status === 'success') {
                setSuccessMsg("Cập nhật thành công! ");
                onUpdateSuccess(res.data.user);
                onClose();
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 401) {
                setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
            } else {
                setError("Lỗi cập nhật: " + (err.response?.data?.message || err.message));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="✏️ Chỉnh sửa thông tin">
            <form onSubmit={handleSaveProfile} style={{ padding: '0 15px', maxHeight: '75vh', overflowY: 'auto' }}>
                
                {/* Ảnh Bìa */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>Ảnh bìa</label>
                    <div style={{ position: 'relative', height: '120px', borderRadius: '15px', overflow: 'hidden', border: '1px dashed #ccc', background: '#f9fafc' }}>
                        {previewCover ? (
                            <img src={previewCover} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>Chưa có ảnh bìa</div>
                        )}
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, setCoverFile, setPreviewCover)}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                        />
                    </div>
                </div>

                {/* Avatar (Ảnh đại diện) */}
                <div className="form-group" style={{ marginBottom: '20px', textAlign: 'center' }}>
                    <label style={{...labelStyle, textAlign: 'left'}}>Avatar</label>
                    <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
                        <img 
                            src={previewAvatar || 'https://via.placeholder.com/100'} 
                            alt="Avatar Preview" 
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ff9f1c' }} 
                        />
                        <div style={{ position: 'absolute', bottom: '0', right: '0', background: '#fff', border: '1px solid #ddd', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>📷</div>
                        
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, setAvatarFile, setPreviewAvatar)}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', borderRadius: '50%' }} 
                        />
                    </div>
                </div>

                {/* Tên hiển thị */}
                <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={labelStyle}>Tên hiển thị</label>
                    <input 
                        type="text" 
                        value={fullname} 
                        onChange={(e) => setFullname(e.target.value)} 
                        style={inputStyle} 
                        placeholder="Nhập tên hiển thị của bạn"
                    />
                </div>

                {/*  Bio */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>Giới thiệu bản thân (Bio)</label>
                    <textarea 
                        value={bio} 
                        onChange={(e) => setBio(e.target.value)} 
                        style={{ ...inputStyle, minHeight: '80px', fontFamily: 'inherit' }}
                        placeholder="Hãy viết gì đó về bạn..."
                    ></textarea>
                </div>

                {/* Nút Lưu */}
                <button 
                    type="submit" 
                    disabled={isLoading}
                    style={{ 
                        width: '100%', padding: '15px', background: '#ff9f1c', 
                        color: 'white', border: 'none', borderRadius: '15px', 
                        fontWeight: 'bold', fontSize: '16px', cursor: 'pointer',
                        opacity: isLoading ? 0.7 : 1
                    }}
                >
                    {isLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
            </form>
        </Modal>
    );
};

// CSS Styles 
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#555' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eee', background: '#f9fafc', outline: 'none' };

export default EditProfileModal;