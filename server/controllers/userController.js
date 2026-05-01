const mongoose = require('mongoose');
const User = require('../models/UserModel');
const Recipe = require('../models/RecipeModel');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLogModel');
const bcryptjs = require('bcryptjs');
const UserReport = require('../models/UserReportModel');

// Cập nhật thông tin hồ sơ 
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullname, bio, username } = req.body;
        let avatarUrl = req.body.avatar; 
        let coverUrl = req.body.cover_img;

        // Kiểm tra username có thay đổi hay không
        if (username && username.trim()) {
            const currentUser = await User.findById(userId).select('username');
            const newUsername = username.trim();
            
            // Nếu username thay đổi, kiểm tra xem có bị trùng không
            if (currentUser.username !== newUsername) {
                const existingUser = await User.findOne({ username: newUsername });
                if (existingUser) {
                    return res.status(400).json({ 
                        status: 'error',
                        message: "Tên đăng nhập này đã được sử dụng!" 
                    });
                }
            }
        }

        if (req.files && req.files['avatar']) {
            avatarUrl = req.files['avatar'][0].path;
        }
        if (req.files && req.files['cover_img']) {
            coverUrl = req.files['cover_img'][0].path;
        }

        const updateData = {
            fullname,
            bio,
            ...(avatarUrl && { avatar: avatarUrl }),
            ...(coverUrl && { cover_img: coverUrl }),
            ...(username && username.trim() && { username: username.trim() })
        };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { returnDocument: 'after' }
        );

        res.json({
            status: 'success',
            message: "Cập nhật thành công",
            user: updatedUser
        });

    } catch (err) {
        console.error("Update profile error:", err);
        // Xử lý lỗi unique violation
        if (err.code === 11000 && err.keyPattern && err.keyPattern.username) {
            return res.status(400).json({ 
                status: 'error',
                message: "Tên đăng nhập này đã được sử dụng!" 
            });
        }
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
};

//  Lấy thông tin User 
exports.getUserProfile = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const viewerId = req.query.viewerId;

        // 1. KIỂM TRA ID HỢP LỆ (Chặn lỗi Cast to ObjectId failed)
        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({ message: "ID người dùng không hợp lệ" });
        }

        // 2. KIỂM TRA CHẶN (Dùng optional chaining ?. để an toàn)
        if (viewerId && mongoose.Types.ObjectId.isValid(viewerId)) {
            const viewerData = await User.findById(viewerId).select('blocked_users');
            if (viewerData?.blocked_users?.includes(targetUserId)) {
                return res.status(403).json({ message: "Bị chặn truy cập" });
            }
        }

        // 3. LẤY THÔNG TIN USER (Dùng _id thay vì id trong select)
        const user = await User.findById(targetUserId).select(
            '_id username fullname avatar cover_img bio is_premium followers following'
        );
        
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

        // 4. FIX LỖI QUERY RECIPE (Đổi author_id thành author)
        const recipes = await Recipe.find({ author: targetUserId }).sort({ createdAt: -1 });

        // 5. KIỂM TRA FOLLOW AN TOÀN
        let isFollowing = false;
        if (viewerId && mongoose.Types.ObjectId.isValid(viewerId)) {
            const viewer = await User.findById(viewerId).select('following');
            isFollowing = viewer?.following?.includes(targetUserId) || false;
        }

        // 6. TRẢ VỀ DATA (Gán thêm id = _id để Frontend React không lỗi)
        const userObj = user.toObject();
        userObj.id = userObj._id; 

        res.json({
            ...userObj,
            fullname: user.fullname || user.username,
            stats: {
                recipes: recipes.length,
                // Dùng ?.length || 0 để phòng trường hợp mảng bị null/undefined
                followers: user.followers?.length || 0,
                following: user.following?.length || 0
            },
            is_following: isFollowing,
            recipes: recipes.map(r => ({ ...r.toObject(), id: r._id })) // Fix ID cho list recipe luôn
        });

    } catch (err) {
        console.error("Lỗi getUserProfile:", err);
        res.status(500).json({ message: "Lỗi Server: " + err.message });
    }
};
//  Xóa tài khoản
exports.deleteUser = async (req, res) => {
    const userId = req.params.id;
    try {
        // Delete user's recipes
        await Recipe.deleteMany({ author_id: userId });
        
        // Delete user's notifications
        await Notification.deleteMany({ user: userId });
        
        // Delete user
        await ActivityLog.create({
            admin: req.user ? req.user.id : null,
            action: "Tài khoản " + userId + " đã xóa tài khoản"
        });
        const result = await User.findByIdAndDelete(userId);
        
        if (!result) return res.status(404).json({ message: "Không tìm thấy user" });
        res.json({ status: 'success', message: "Xóa tài khoản thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi hệ thống khi xóa" });
    }
};

// Follow / Unfollow
exports.toggleFollow = async (req, res) => {
    try {
        const { followerId, followedId } = req.body;

        const follower = await User.findById(followerId);
        const followed = await User.findById(followedId);

        const isFollowing = follower.following.includes(followedId);

        if (isFollowing) {
            // Unfollow
            await User.findByIdAndUpdate(followerId, {
                $pull: { following: followedId }
            });
            await User.findByIdAndUpdate(followedId, {
                $pull: { followers: followerId }
            });

            return res.json({
                status: 'success',
                is_following: false
            });
        }

        // Follow
        await User.findByIdAndUpdate(followerId, {
            $addToSet: { following: followedId }
        });
        await User.findByIdAndUpdate(followedId, {
            $addToSet: { followers: followerId }
        });

        // Create notification
        const followerData = await User.findById(followerId).select('fullname');
        await Notification.create({
            user: followedId,
            message: `${followerData.fullname} đã theo dõi bạn`,
            type: 'follow'
        });

        return res.json({
            status: 'success',
            is_following: true
        });

    } catch (err) {
        console.error("Lỗi follow:", err);
        res.status(500).json({ message: "Lỗi Server" });
    }
};

// Lấy danh sách Top Chef 
exports.getTopChefs = async (req, res) => {
    try {
        const currentUserId = req.query.userId;

        let query = {};

        // Filter out blocked users
        if (currentUserId) {
            const currentUser = await User.findById(currentUserId).select('blocked_users');
            const blockedIds = currentUser ? currentUser.blocked_users : [];
            query._id = { $nin: blockedIds };
        }

        const data = await User.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'recipes',
                    let: { userId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$author', '$$userId'] } } } 
                    ],
                    as: 'userRecipes'
                }
            },
            {
                $project: {
                    id: '$_id',
                    username: 1,
                    fullname: 1,
                    avatar: 1,
                    recipe_count: { $size: '$userRecipes' }
                }
            },
            { $sort: { recipe_count: -1 } },
            { $limit: 3 }
        ]);

        res.status(200).json(data);
    } catch (err) {
        console.error("Lỗi API Top Chef:", err);
        res.status(500).json({ message: "Lỗi Server", error: err.message });
    }
};

exports.getBlockedUsers = async (req, res) => {
    try {
        const { userId } = req.query;
        const user = await User.findById(userId).populate({
            path: 'blocked_users',
            select: 'id username fullname avatar'
        });
        
        res.json(user.blocked_users || []);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.getMutualBlockIds = async (req, res) => {
    try {
        const { userId } = req.query;
        const user = await User.findById(userId).select('blocked_users');
        const blockedIds = user.blocked_users.map(id => id.toString());
        res.json(blockedIds);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

// Chặn người dùng
exports.blockUser = async (req, res) => {
    try {
        const { blockerId, blockedId } = req.body;
        await User.findByIdAndUpdate(blockerId, {
            $addToSet: { blocked_users: blockedId }
        });

        res.json({ message: "Đã chặn người dùng" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi chặn user" });
    }
};

// Bỏ chặn (Unblock)
exports.unblockUser = async (req, res) => {
    try {
        const { blockerId, blockedId } = req.body;
        await User.findByIdAndUpdate(blockerId, {
            $pull: { blocked_users: blockedId }
        });
        res.json({ message: "Đã bỏ chặn" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi bỏ chặn" });
    }
};

//đổi mật khẩu
exports.changePassword = async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại!" });
        }

        const isPasswordMatch = await bcryptjs.compare(oldPassword, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: "Mật khẩu cũ không chính xác!" });
        }

        const hashedPassword = await bcryptjs.hash(newPassword, 10);
        await User.findByIdAndUpdate(userId, { password: hashedPassword });

        res.json({ message: "Đổi mật khẩu thành công!" });

    } catch (err) {
        console.error("Lỗi đổi mật khẩu:", err);
        res.status(500).json({ message: "Lỗi Server khi đổi mật khẩu" });
    }
};

// Lấy danh sách Người quan tâm 
exports.getFollowers = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).populate({
            path: 'followers',
            select: 'id fullname username avatar bio'
        });

        res.status(200).json(user.followers || []);
    } catch (err) {
        console.error("Lỗi khi lấy danh sách Followers:", err);
        res.status(500).json({ message: "Lỗi server khi lấy danh sách người quan tâm." });
    }
};

// Lấy danh sách Bạn Bếp 
exports.getFollowing = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).populate({
            path: 'following',
            select: 'id fullname username avatar bio'
        });

        res.status(200).json(user.following || []);
    } catch (err) {
        console.error("Lỗi khi lấy danh sách Following:", err);
        res.status(500).json({ message: "Lỗi server khi lấy danh sách bạn bếp." });
    }
};

// Báo cáo người dùng vi phạm
exports.reportUser = async (req, res) => {
    try {
        const { reporterId, reportedUserId, reason } = req.body;
        
        if (!reason || reason.trim() === '') {
            return res.status(400).json({ message: "Vui lòng nhập lý do báo cáo" });
        }

        const newReport = await UserReport.create({
            reporter: reporterId,
            reportedUser: reportedUserId,
            reason: reason
        });

        res.json({ message: "Báo cáo thành công, quản trị viên sẽ xem xét" });
    } catch (err) {
        console.error("Lỗi báo cáo user:", err);
        res.status(500).json({ message: "Lỗi Server khi báo cáo người dùng" });
    }
};
