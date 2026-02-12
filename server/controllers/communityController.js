const db = require('../config/db');

// Lấy danh sách bài đăng 
exports.getAllPosts = async (req, res) => {
    try {
        const currentUserId = req.query.userId;
        const sql = `
            SELECT 
                cp.*, 
                u.fullname, 
                u.avatar, 
                u.username,
                (SELECT COUNT(*) FROM community_likes WHERE post_id = cp.id AND user_id = ?) > 0 AS is_liked
            FROM community_posts cp 
            JOIN users u ON cp.user_id = u.id 
            ORDER BY cp.created_at DESC
        `;

        const [posts] = await db.query(sql, [currentUserId || null]); 
        res.json(posts);
    } catch (err) {
        console.error("Lỗi lấy bài cộng đồng:", err);
        res.status(500).json({ message: "Lỗi Server" });
    }
};

// Đăng bài mới
exports.createPost = async (req, res) => {
    try {
        const { userId, content } = req.body;
        const imageUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

        await db.query(
            "INSERT INTO community_posts (user_id, content, image_url) VALUES (?, ?, ?)",
            [userId, content, imageUrl]
        );
        res.json({ status: 'success' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi đăng bài" });
    }
};
// Gửi bình luận / Trả lời 
exports.addComment = async (req, res) => {
    try {
        const { userId, postId, content, parentId } = req.body;

        await db.query(
            "INSERT INTO community_comments (user_id, post_id, parent_id, content) VALUES (?, ?, ?, ?)",
            [userId, postId, parentId || null, content]
        );

        // PHẦN XỬ LÝ THÔNG BÁO 
        const [userRows] = await db.query("SELECT fullname FROM users WHERE id = ?", [userId]);
        const senderName = userRows.length > 0 ? userRows[0].fullname : "Ai đó";

        if (parentId) {
            //  TRẢ LỜI BÌNH LUẬN
            const [parentCmt] = await db.query("SELECT user_id FROM community_comments WHERE id = ?", [parentId]);
            
            if (parentCmt.length > 0) {
                const receiverId = parentCmt[0].user_id;

                if (parseInt(receiverId) !== parseInt(userId)) {
                    const shortContent = content.length > 20 ? content.substring(0, 20) + '...' : content;
                    const msg = `${senderName} đã trả lời bạn: "${shortContent}"`;

                    await db.query(
                        "INSERT INTO notifications (user_id, message, type, is_read) VALUES (?, ?, 'reply', 0)",
                        [receiverId, msg]
                    );
                }
            }
        } else {
            //  BÌNH LUẬN MỚI VÀO BÀI VIẾT 
            const [post] = await db.query("SELECT user_id FROM community_posts WHERE id = ?", [postId]);
            
            if (post.length > 0) {
                const receiverId = post[0].user_id;

                if (parseInt(receiverId) !== parseInt(userId)) {
                    const msg = `${senderName} đã bình luận về bài viết của bạn.`;
                    
                    await db.query(
                        "INSERT INTO notifications (user_id, message, type, is_read) VALUES (?, ?, 'comment', 0)",
                        [receiverId, msg]
                    );
                }
            }
        }

        res.json({ status: 'success' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

//  Lấy danh sách bình luận của 1 bài viết
exports.getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const sql = `
            SELECT c.*, u.fullname, u.avatar, u.username 
            FROM community_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        `;
        const [comments] = await db.query(sql, [postId]);
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// Thả tim / Bỏ tim 
exports.toggleLike = async (req, res) => {
    try {
        const { userId, postId } = req.body;

        // Kiểm tra xem đã like chưa
        const [exists] = await db.query(
            "SELECT * FROM community_likes WHERE user_id = ? AND post_id = ?", 
            [userId, postId]
        );

        if (exists.length > 0) {
            // BỎ LIKE 
            await db.query("DELETE FROM community_likes WHERE user_id = ? AND post_id = ?", [userId, postId]);
            await db.query("UPDATE community_posts SET likes_count = likes_count - 1 WHERE id = ?", [postId]);
            res.json({ status: 'unliked' });

        } else {
            // THẢ LIKE MỚI 
            await db.query("INSERT INTO community_likes (user_id, post_id) VALUES (?, ?)", [userId, postId]);
            await db.query("UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ?", [postId]);
            const [posts] = await db.query("SELECT user_id FROM community_posts WHERE id = ?", [postId]);
            
            if (posts.length > 0) {
                const authorId = posts[0].user_id;

                if (parseInt(authorId) !== parseInt(userId)) {
                    
                    const [liker] = await db.query("SELECT fullname FROM users WHERE id = ?", [userId]);
                    const likerName = liker.length > 0 ? liker[0].fullname : "Ai đó";

                    const msg = `${likerName} đã thích bài viết của bạn. ❤️`;

                    await db.query(
                        "INSERT INTO notifications (user_id, message, type, is_read) VALUES (?, ?, 'like', 0)",
                        [authorId, msg]
                    );
                }
            }

            res.json({ status: 'liked' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Xóa bài viết
exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query; 

        const [post] = await db.query("SELECT * FROM community_posts WHERE id = ?", [id]);
        if (post.length === 0) return res.status(404).json({ message: "Không tìm thấy bài viết" });
        if (post[0].user_id != userId) return res.status(403).json({ message: "Bạn không có quyền xóa bài này" });

        await db.query("DELETE FROM community_posts WHERE id = ?", [id]);
        return res.status(200).json({ message: "Đã xóa bài viết" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

//  Sửa bài viết 
exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        const [post] = await db.query("SELECT * FROM community_posts WHERE id = ?", [id]);
        if (post.length === 0) return res.status(404).json({ message: "Không tìm thấy bài viết" });

        await db.query("UPDATE community_posts SET content = ? WHERE id = ?", [content, id]);
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};