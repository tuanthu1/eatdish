import React from 'react';
import axiosClient from '../../api/axiosClient'; // Đảm bảo đường dẫn này đúng với dự án của bạn

const CommunityView = ({ 
    user, 
    postContent, setPostContent, 
    imagePreview, setImagePreview, 
    postImage, setPostImage, 
    handleFileChange, handleSubmitPost, 
    communityPosts, 
    handleLikePost, handleDeletePost, handleUpdatePost,
    editingPostId, setEditingPostId, 
    editPostContent, setEditPostContent,
    toggleComments, activeCommentPostId, 
    commentsList, setCommentsList,
    commentText, setCommentText,
    replyingTo, setReplyingTo,
    handleViewProfile ,
    editPostImage, setEditPostImage,
    editImagePreview, setEditImagePreview,
    handleEditFileChange
}) => {

    // Hàm xử lý gửi comment 
    const handleSubmitComment = async (postId) => {
        if (!commentText.trim()) return;
        
        const payload = { 
            userId: user.id, 
            postId: postId, 
            content: commentText,
            parentId: replyingTo ? replyingTo.id : null 
        };

        try {
            await axiosClient.post('/community/comment', payload);
            setCommentText('');
            setReplyingTo(null);
            // Load lại comment mới nhất
            const res = await axiosClient.get(`/community/comments/${postId}`);
            setCommentsList(res.data);
        } catch (err) {
            console.error("Lỗi gửi comment:", err);
        }
    };

    return (
        <div id="view-community" className="fadeIn" style={{ maxWidth: '700px', margin: '0 auto', paddingBottom: '50px' }}>
            <div className="section-header"><h2>Cộng đồng EatDish 👥</h2></div>
            
            {/* Ô ĐĂNG BÀI */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '25px', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                    <img src={user.avatar} style={{ width: '45px', height: '45px', borderRadius: '50%' }} alt="avt" />
                    <textarea 
                        placeholder={`Chia sẻ công thức hoặc mẹo nấu ăn đi, ${user.fullname}...`}
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        style={{ flex: 1, border: 'none', background: '#f9f9f9', borderRadius: '15px', padding: '15px', outline: 'none', minHeight: '80px', resize: 'none' }}
                    />
                </div>
                {/* Ảnh xem trước */}
                {imagePreview && (
                    <div style={{ position: 'relative', marginBottom: '15px' }}>
                        <img src={imagePreview} style={{ width: '100%', borderRadius: '15px', maxHeight: '300px', objectFit: 'cover' }} alt="preview" />
                        <button 
                            onClick={() => { setPostImage(null); setImagePreview(null); }}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}
                        >✕</button>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f2f2f2', paddingTop: '15px' }}>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#555', fontSize: '14px' }}>
                        <span style={{ fontSize: '20px' }}>🖼️</span> Thêm ảnh
                        <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                    </label>
                    <button 
                        onClick={handleSubmitPost}
                        style={{ background: '#ff9f1c', color: '#fff', border: 'none', padding: '10px 30px', borderRadius: '20px', fontWeight: '600', cursor: 'pointer' }}
                    >Đăng bài</button>
                </div>
            </div>

            {/* DANH SÁCH BÀI ĐĂNG */}
            {communityPosts.map(post => (
                <div key={post.id} style={{ background: '#fff', borderRadius: '25px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    {/* Header bài đăng */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img 
                                src={post.avatar} 
                                onClick={() => handleViewProfile(post.user_id)}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', border: '2px solid transparent', transition: '0.2s' }} 
                                onMouseOver={e => e.currentTarget.style.borderColor = '#ff9f1c'}
                                onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
                                alt="avt" 
                            />
                            <div>
                                <div 
                                    onClick={() => handleViewProfile(post.user_id)}
                                    style={{ fontWeight: '600', cursor: 'pointer' }}
                                    onMouseOver={e => e.currentTarget.style.color = '#ff9f1c'}
                                    onMouseOut={e => e.currentTarget.style.color = '#000'}
                                >
                                    {post.fullname}
                                </div>
                                <div style={{ fontSize: '12px', color: '#999' }}>{new Date(post.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                        
                        {/* NÚT SỬA/XÓA */}
                        {post.user_id == user.id && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <span 
                                onClick={() => { 
                                    setEditingPostId(post.id); 
                                    setEditPostContent(post.content);
                                    setEditImagePreview(post.image_url);
                                    setEditPostImage(null); 
                                }} 
                                style={{ cursor: 'pointer', fontSize: '12px', color: '#666' }}
                            >
                                ✏️ Sửa
                            </span>
                            <span 
                                onClick={() => handleDeletePost(post.id)} 
                                style={{ cursor: 'pointer', fontSize: '12px', color: '#ff4757' }}
                            >
                                🗑️ Xóa
                            </span>
                        </div>
                    )}
                    </div>

                    {/* Nội dung bài đăng */}
                    {editingPostId === post.id ? (
                    // --- GIAO DIỆN LÚC ĐANG SỬA
                    <div style={{ marginBottom: '15px', border: '1px solid #ff9f1c', padding: '15px', borderRadius: '15px' }}>
                        <div style={{fontWeight:'bold', marginBottom:'10px', color:'#ff9f1c'}}>Đang chỉnh sửa:</div>
                        
                        {/* Sửa nội dung chữ */}
                        <textarea 
                            value={editPostContent} 
                            onChange={(e) => setEditPostContent(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ddd', background: '#fff', outline: 'none', minHeight: '80px', marginBottom:'10px' }}
                        />

                        {/* Sửa ảnh (Preview & Nút chọn) */}
                        <div style={{ marginBottom: '10px' }}>
                            {editImagePreview ? (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <img src={editImagePreview} style={{ width: '100%', maxWidth: '200px', borderRadius: '10px', border: '1px solid #ddd' }} alt="edit-preview" />
                                    <button 
                                        onClick={() => { setEditPostImage(null); setEditImagePreview(null); }}
                                        style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'red', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontWeight:'bold' }}
                                        title="Xóa ảnh"
                                    >✕</button>
                                </div>
                            ) : (
                                <div style={{ fontSize: '13px', color: '#999', fontStyle: 'italic' }}>Bài viết này chưa có ảnh</div>
                            )}

                            <div style={{ marginTop: '10px' }}>
                                <label style={{ cursor: 'pointer', background: '#eee', padding: '5px 15px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'inline-block' }}>
                                    📷 Thay đổi ảnh
                                    <input type="file" accept="image/*" hidden onChange={handleEditFileChange} />
                                </label>
                            </div>
                        </div>

                        {/* Nút Lưu / Hủy */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button onClick={() => handleUpdatePost(post.id)} style={{ padding: '8px 20px', background: '#ff9f1c', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight:'bold' }}>Lưu lại</button>
                            <button onClick={() => setEditingPostId(null)} style={{ padding: '8px 20px', background: '#f1f2f6', color: '#333', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Hủy</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p style={{ fontSize: '15px', color: '#333', marginBottom: '15px' }}>{post.content}</p>
                        {post.image_url && (
                            <img src={post.image_url} style={{ width: '100%', borderRadius: '15px', marginBottom: '15px', maxHeight: '400px', objectFit: 'cover' }} alt="post" />
                        )}
                    </>
                )}
                    

                    {/* Nút Like & Comment */}
                    <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid #f2f2f2', paddingTop: '15px' }}>
                        <button 
                            onClick={() => handleLikePost(post.id)}
                            style={{ 
                                background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', 
                                color: post.is_liked ? '#ff4757' : '#666', fontWeight: '600', fontSize: '15px'
                            }}
                        >
                            {post.is_liked ? '❤️' : '🤍'} {post.likes_count || 0} Thích
                        </button>
                        <button 
                            onClick={() => toggleComments(post.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: '#666' }}
                        >
                            💬 Bình luận
                        </button>
                    </div>

                    {/* Bình luận */}
                    {activeCommentPostId === post.id && (
                        <div className="fadeIn" style={{ marginTop: '15px', background: '#f9f9f9', padding: '15px', borderRadius: '15px' }}>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px', paddingRight: '5px' }}>
                                {commentsList.length > 0 ? (
                                    commentsList.filter(c => !c.parent_id).map(parentCmt => (
                                        <div key={parentCmt.id} style={{ marginBottom: '15px' }}>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <img src={parentCmt.avatar} style={{ width: '30px', height: '30px', borderRadius: '50%' }} alt="avt" />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '12px', display: 'inline-block' }}>
                                                        <strong>{parentCmt.fullname}</strong>
                                                        <span style={{fontSize:'11px', color:'#999', marginLeft:'5px'}}>{new Date(parentCmt.created_at).toLocaleDateString()}</span>
                                                        <div style={{marginTop:'2px', color:'#333'}}>{parentCmt.content}</div>
                                                    </div>
                                                    <div 
                                                        onClick={() => setReplyingTo(parentCmt)}
                                                        style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginTop: '3px', marginLeft: '5px', cursor: 'pointer' }}
                                                    >
                                                        Trả lời
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Comment con (khi người dùng haowjc người khác trả lời)*/}
                                            {commentsList.filter(c => c.parent_id === parentCmt.id).map(childCmt => (
                                                <div key={childCmt.id} style={{ display: 'flex', gap: '10px', marginTop: '10px', marginLeft: '40px' }}>
                                                    <img src={childCmt.avatar} style={{ width: '25px', height: '25px', borderRadius: '50%' }} alt="avt" />
                                                    <div style={{ background: '#eef2f5', padding: '8px 12px', borderRadius: '12px', fontSize: '14px' }}>
                                                        <strong>{childCmt.fullname}</strong>
                                                        <div style={{marginTop:'2px', color:'#333'}}>{childCmt.content}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                ) : (
                                    <p style={{color:'#999', fontSize:'13px', textAlign:'center'}}>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                                )}
                            </div>
                            
                            {/* Ô nhập bình luận */}
                            <div style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                {replyingTo && (
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Đang trả lời <b>{replyingTo.fullname}</b>...</span>
                                        <span onClick={() => setReplyingTo(null)} style={{ cursor: 'pointer', color: 'red' }}>✕ Hủy</span>
                                    </div>
                                )}
                                
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input 
                                        type="text" 
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder={replyingTo ? `Trả lời ${replyingTo.fullname}...` : "Viết bình luận..."}
                                        style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid #ddd', outline: 'none' }}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                                    />
                                    <button 
                                        onClick={() => handleSubmitComment(post.id)}
                                        style={{ background: '#ff9f1c', color: '#fff', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                                    >➤</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default CommunityView;