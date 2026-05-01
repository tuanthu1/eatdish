const CommunityPost = require('../models/CommunityPost');
const CommunityComment = require('../models/CommunityComment');
const User = require('../models/UserModel');
const ActivityLog = require('../models/ActivityLogModel');
const Notification = require('../models/Notification');

// Lấy danh sách bài đăng 
exports.getAllPosts = async (req, res) => {
    try {
        const currentUserId = req.query.userId || (req.user ? req.user.id : null);
        
        let query = {};
        if (currentUserId) {
            // Loại trừ những người bị block hoặc đang block người này
            const blockedUsers = await User.findById(currentUserId).select('blocked_users');
            const blockedIds = blockedUsers?.blocked_users || [];
            query.user = { $nin: blockedIds };
        }

        const posts = await CommunityPost.find(query)
            .populate('user', 'fullname username avatar')
            .sort({ createdAt: -1 });

        const postsWithCount = await Promise.all(
            posts.map(async (post) => {
                const commentsCount = await CommunityComment.countDocuments({ post: post._id });
                const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
                const isLiked = currentUserId
                    ? post.likes?.some((likedUserId) => String(likedUserId) === String(currentUserId))
                    : false;

                return {
                    ...post.toObject(),
                    id: post._id,
                    user_id: post.user?._id,
                    fullname: post.user?.fullname || post.user?.username || 'Người dùng',
                    avatar: post.user?.avatar || '',
                    created_at: post.createdAt,
                    comments_count: commentsCount,
                    likes_count: likesCount,
                    is_liked: isLiked,
                };
            })
        );
        
        res.json(postsWithCount);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Lỗi lấy danh sách bài viết" });
    }
};

// Đăng bài mới
exports.createPost = async (req, res) => {
    try {
        const { userId, content } = req.body;
        const image_url = req.file ? req.file.path : null;

        await CommunityPost.create({
            user: userId,
            content,
            image_url
        });
        await ActivityLog.create({
            admin: req.user ? req.user.id : null,
            action: "Tài khoản " + userId + " đã tạo một bài viết mới trên cộng đồng với nội dung: " + content
        });
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

        const newComment = await CommunityComment.create({
            user: userId,
            post: postId,
            parent: parentId || null,
            content
        });

        await CommunityPost.findByIdAndUpdate(postId, {
            $addToSet: { comments: newComment._id }
        });

        await ActivityLog.create({
            admin: req.user ? req.user.id : null,
            action: "Tài khoản " + userId + " đã tạo một bình luận mới trên cộng đồng với nội dung: " + content
        });
        
        const userData = await User.findById(userId).select('fullname');
        const senderName = userData?.fullname || "Ai đó";

        if (parentId) {
            const parentCmt = await CommunityComment.findById(parentId);
            
            if (parentCmt && parentCmt.user.toString() !== userId) {
                const shortContent = content.length > 20 ? content.substring(0, 20) + '...' : content;
                const msg = `${senderName} đã trả lời bạn: "${shortContent}"`;

                await Notification.create({
                    user: parentCmt.user,
                    message: msg,
                    type: 'reply'
                });
            }
        } else {
            const post = await CommunityPost.findById(postId);
            
            if (post && post.user.toString() !== userId) {
                const msg = `${senderName} đã bình luận về bài viết của bạn.`;
                
                await Notification.create({
                    user: post.user,
                    message: msg,
                    type: 'comment'
                });
            }
        }

        res.json({ status: 'success' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Lấy danh sách bình luận của 1 bài viết
exports.getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const comments = await CommunityComment.find({ post: postId })
            .populate('user', 'fullname avatar username')
            .sort({ createdAt: 1 });

        const formattedComments = comments.map((comment) => ({
            ...comment.toObject(),
            id: comment._id,
            user_id: comment.user?._id,
            fullname: comment.user?.fullname || comment.user?.username || 'Người dùng',
            avatar: comment.user?.avatar || '',
            parent_id: comment.parent_comment || comment.parent || null,
            created_at: comment.createdAt,
        }));

        res.json(formattedComments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Thả tim / Bỏ tim 
exports.toggleLike = async (req, res) => {
    try {
        const { userId, postId } = req.body;

        if (!userId || !postId) {
            return res.status(400).json({ message: 'Thiếu userId hoặc postId' });
        }

        const post = await CommunityPost.findById(postId);
        if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

        const liked = post.likes?.some((likedUserId) => String(likedUserId) === String(userId));

        if (liked) {
            // Unlike
            post.likes = post.likes.filter((likedUserId) => String(likedUserId) !== String(userId));
            await post.save();
            res.json({ status: 'unliked', likes_count: post.likes.length, is_liked: false });

        } else {
            // Like
            post.likes.push(userId);
            await post.save();

            if (post.user.toString() !== userId) {
                const likerData = await User.findById(userId).select('fullname');
                const likerName = likerData?.fullname || "Ai đó";
                const msg = `${likerName} đã thích bài viết của bạn. ❤️`;

                await Notification.create({
                    user: post.user,
                    message: msg,
                    type: 'like'
                });
            }

            res.json({ status: 'liked', likes_count: post.likes.length, is_liked: true });
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

        const post = await CommunityPost.findById(id);
        if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });
        if (post.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền xóa bài này" });
        }

        await CommunityPost.findByIdAndDelete(id);
        return res.status(200).json({ message: "Đã xóa bài viết" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Sửa bài viết 
exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        const post = await CommunityPost.findByIdAndUpdate(id, { content }, { returnDocument: 'after' });
        if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });
        await ActivityLog.create({
            admin: req.user ? req.user.id : null,
            action: "Tài khoản " + post.user + " đã cập nhật bài viết trên cộng đồng với nội dung mới: " + content
        });
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Xóa bình luận
exports.deleteComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.query.userId;

        const comment = await CommunityComment.findById(commentId);
        
        if (!comment) return res.status(404).json({ message: "Không tìm thấy bình luận" });
        if (comment.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền xóa bình luận này" });
        }

        await CommunityComment.findByIdAndDelete(commentId);
        await CommunityPost.findByIdAndUpdate(comment.post, {
            $pull: { comments: comment._id }
        });
        
        res.status(200).json({ message: "Đã xóa bình luận" });
    } catch (err) {
        console.error("Lỗi khi xóa bình luận:", err);
        res.status(500).json({ error: err.message });
    }
};
