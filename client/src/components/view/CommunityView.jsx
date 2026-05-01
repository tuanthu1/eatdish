import React from 'react';
import axiosClient from '../../api/axiosClient';
import { Camera } from 'lucide-react';
import { toast } from 'react-toastify';
const CommunityView = ({ 
    user, postContent, setPostContent, imagePreview, setImagePreview, 
    postImage, setPostImage, handleFileChange, handleSubmitPost, 
    communityPosts, handleLikePost, handleDeletePost, handleUpdatePost,
    editingPostId, setEditingPostId, editPostContent, setEditPostContent,
    toggleComments, activeCommentPostId, commentsList, setCommentsList,
    commentText, setCommentText, replyingTo, setReplyingTo,
    handleViewProfile , editPostImage, setEditPostImage,
    editImagePreview, setEditImagePreview, handleEditFileChange, setCommunityPosts
}) => {
    const getPostId = (post) => post?.id || post?._id;
    const getPostUserId = (post) => post?.user_id || post?.user?._id;
    const getCommentId = (comment) => comment?.id || comment?._id;
    const getCommentParentId = (comment) => comment?.parent_id || comment?.parent_comment || comment?.parent;
    const getCommentUserId = (comment) => comment?.user_id || comment?.user?._id;

    const handleSubmitComment = async (postId) => {
        if (!commentText.trim()) return;
        const normalizedPostId = String(postId || '');
        if (!normalizedPostId) return;
        const payload = {
            userId: user.id,
            postId: normalizedPostId,
            content: commentText,
            parentId: replyingTo ? (getCommentId(replyingTo) || null) : null
        };
        try {
            await axiosClient.post('/community/comment', payload);
            setCommentText(''); setReplyingTo(null);
            const res = await axiosClient.get(`/community/comments/${normalizedPostId}`);
            setCommentsList(res.data);
            toast.success("Đã gửi bình luận!");
            setCommunityPosts(prev => prev.map(p => 
                String(getPostId(p)) === normalizedPostId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
            ));
        } catch (err) { console.error("Lỗi gửi comment:", err); toast.error("Có lỗi xảy ra khi gửi bình luận."); }
    };
    const handleDeleteComment = async (commentId, postId) => {
        const normalizedPostId = String(postId || '');
        try {
            await axiosClient.delete(`/community/comment/${commentId}?userId=${user.id}`);
            const res = await axiosClient.get(`/community/comments/${normalizedPostId}`);
            setCommentsList(res.data);
            toast.success("Đã xóa bình luận!");
            setCommunityPosts(prev => prev.map(p => 
                String(getPostId(p)) === normalizedPostId ? { ...p, comments_count: Math.max((p.comments_count || 1) - 1, 0) } : p
            ));
        } catch (err) {
            console.error("Lỗi xóa comment:", err);
            toast.error("Không thể xóa bình luận. Vui lòng thử lại sau.");
        }
    };

    return (
        <div id="view-community" className="fadeIn community-view-container">
            <div className="section-header"><h2>Cộng đồng EatDish</h2></div>
            
            {/* Ô ĐĂNG BÀI */}
            <div className="community-post-box">
                <div className="community-post-input-wrapper">
                    <img src={user.avatar} className="community-comment-avt-large" alt="avt" />
                    <textarea 
                        placeholder={`Chia sẻ công thức hoặc mẹo nấu ăn đi, ${user.fullname}...`}
                        value={postContent} onChange={(e) => setPostContent(e.target.value)}
                        className="community-post-input"
                    />
                </div>
                {imagePreview && (
                    <div className="community-img-preview-box">
                        <img src={imagePreview} className="community-img-preview" alt="preview" />
                        <button onClick={() => { setPostImage(null); setImagePreview(null); }} className="btn-remove-preview">✕</button>
                    </div>
                )}
                <div className="community-post-actions">
                    <label className="community-add-img-label">
                        <span style={{ fontSize: '20px' }}><Camera /></span> Thêm ảnh
                        <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                    </label>
                    <button onClick={handleSubmitPost} className="btn-community-post">Đăng bài</button>
                </div>
            </div>

            {/* DANH SÁCH BÀI ĐĂNG */}
            {communityPosts.map(post => {
                const postId = getPostId(post);
                const postUserId = getPostUserId(post);
                return (
                <div key={postId} className="community-post-item">
                    <div className="community-post-header">
                        <div className="community-post-author">
                            <img src={post.avatar || post.user?.avatar} onClick={() => handleViewProfile(postUserId)} className="community-author-avt" alt="avt" />
                            <div>
                                <div onClick={() => handleViewProfile(postUserId)} className="community-author-name">{post.fullname || post.user?.fullname || post.user?.username}</div>
                                <div className="community-post-date">{new Date(post.created_at || post.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                        
                        {String(postUserId) === String(user.id) && (
                            <div className="community-post-manage">
                                <span onClick={() => { setEditingPostId(postId); setEditPostContent(post.content); setEditImagePreview(post.image_url); setEditPostImage(null); }} className="btn-post-manage">✏️ Sửa</span>
                                <span onClick={() => handleDeletePost(postId)} className="btn-post-manage delete">🗑️ Xóa</span>
                            </div>
                        )}
                    </div>

                    {String(editingPostId) === String(postId) ? (
                        <div className="community-edit-box">
                            <div className="community-edit-title">Đang chỉnh sửa:</div>
                            <textarea value={editPostContent} onChange={(e) => setEditPostContent(e.target.value)} className="community-post-input editing" />

                            <div className="mb-10">
                                {editImagePreview ? (
                                    <div className="community-img-preview-box inline">
                                        <img src={editImagePreview} className="community-img-preview small" alt="edit-preview" />
                                        <button onClick={() => { setEditPostImage(null); setEditImagePreview(null); }} className="btn-remove-preview small" title="Xóa ảnh">✕</button>
                                    </div>
                                ) : (
                                    <div className="community-empty-img-msg">Bài viết này chưa có ảnh</div>
                                )}
                                <div className="mt-10">
                                    <label className="btn-change-img">
                                        📷 Thay đổi ảnh <input type="file" accept="image/*" hidden onChange={handleEditFileChange} />
                                    </label>
                                </div>
                            </div>
                            <div className="community-edit-actions">
                                <button onClick={() => handleUpdatePost(postId)} className="btn-edit-save">Lưu lại</button>
                                <button onClick={() => setEditingPostId(null)} className="btn-edit-cancel">Hủy</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="community-post-content">{post.content}</p>
                            {post.image_url && <img src={post.image_url} className="community-post-image" alt="post" />}
                        </>
                    )}
                    
                    <div className="community-interact-row">
                        <button onClick={() => handleLikePost(postId)} className={`btn-interact ${post.is_liked ? 'liked' : ''}`}>
                            {post.is_liked ? '❤️' : '🤍'} {post.likes_count || 0} Thích
                        </button>
                        <button onClick={() => toggleComments(postId)} className="btn-interact">
                            💬 {post.comments_count || 0} Bình luận
                        </button>
                    </div>

                    {/* BÌNH LUẬN */}
                    {String(activeCommentPostId) === String(postId) && (
                        <div className="fadeIn community-comments-section">
                            <div className="community-comments-list">
                                {commentsList.length > 0 ? (
                                    commentsList.filter(c => !getCommentParentId(c)).map(parentCmt => {
                                        const parentId = getCommentId(parentCmt);
                                        return (
                                        <div key={parentId} className="community-comment-item">
                                            <div className="community-comment-parent">
                                                <img src={parentCmt.avatar || parentCmt.user?.avatar} className="community-comment-avt" alt="avt" />
                                                <div className="flex-1">
                                                    <div className="community-comment-bubble">
                                                        <strong>{parentCmt.fullname || parentCmt.user?.fullname || parentCmt.user?.username}</strong>
                                                        <span className="community-comment-meta">{new Date(parentCmt.created_at || parentCmt.createdAt).toLocaleDateString()}</span>
                                                        <div className="community-comment-text">{parentCmt.content}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '15px', marginTop: '4px' }}>
                                                        <div onClick={() => setReplyingTo(parentCmt)} className="btn-reply-comment">Trả lời</div>
                                                        {String(getCommentUserId(parentCmt)) === String(user.id) && (
                                                            <div onClick={() => handleDeleteComment(parentId, postId)} style={{ cursor: 'pointer', fontSize: '13px', color: '#e74c3c', fontWeight: '500' }}>Xóa</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {commentsList.filter(c => String(getCommentParentId(c)) === String(parentId)).map(childCmt => {
                                                const childId = getCommentId(childCmt);
                                                return (
                                                <div key={childId} className="community-comment-child">
                                                    <img src={childCmt.avatar || childCmt.user?.avatar} className="community-child-avt" alt="avt" />
                                                    <div className="community-child-bubble" style={{ width: '100%' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <strong>{childCmt.fullname || childCmt.user?.fullname || childCmt.user?.username}</strong>
                                                            {String(getCommentUserId(childCmt)) === String(user.id) && (
                                                                <span onClick={() => handleDeleteComment(childId, postId)} style={{ cursor: 'pointer', fontSize: '12px', color: '#e74c3c', fontWeight: '500' }}>Xóa</span>
                                                            )}
                                                        </div>
                                                        <div className="community-comment-text">{childCmt.content}</div>
                                                    </div>
                                                </div>
                                            )})}
                                        </div>
                                    )})
                                ) : (
                                    <p className="community-comment-empty">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                                )}
                            </div>
                            
                            <div className="community-comment-input-area">
                                {replyingTo && (
                                    <div className="community-reply-indicator">
                                        <span>Đang trả lời <b>{replyingTo.fullname}</b>...</span>
                                        <span onClick={() => setReplyingTo(null)} className="btn-cancel-reply">✕ Hủy</span>
                                    </div>
                                )}
                                <div className="community-input-row">
                                    <input 
                                        type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}
                                        placeholder={replyingTo ? `Trả lời ${replyingTo.fullname || replyingTo.user?.fullname || 'người dùng'}...` : "Viết bình luận..."}
                                        className="community-comment-input"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment(postId)}
                                    />
                                    <button onClick={() => handleSubmitComment(postId)} className="btn-send-comment">➤</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )})}
        </div>
    );
};

export default CommunityView;