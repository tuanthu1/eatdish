const db = require('../config/db');


// 1. Cập nhật thông tin hồ sơ 
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullname, bio, username } = req.body;
        
        const files = req.files || {}; 

        let avatarUrl = null;
        let coverUrl = null;
        if (username !== undefined && username.trim() !== "") {
            files.push("username = ?");
            files.push(username.trim());
        }
        if (files.avatar && files.avatar[0]) {
            avatarUrl = `http://localhost:5000/uploads/${files.avatar[0].filename}`;
        }

        if (files.cover_img && files.cover_img[0]) {
            coverUrl = `http://localhost:5000/uploads/${files.cover_img[0].filename}`;
        }
        
        const sql = `
            UPDATE users
            SET fullname = ?, bio = ?,
                avatar = COALESCE(?, avatar),
                cover_img = COALESCE(?, cover_img)
            WHERE id = ?
        `;

        await db.query(sql, [
            fullname,
            bio,
            avatarUrl,
            coverUrl,
            userId
        ]);

        const [rows] = await db.query(
            "SELECT * FROM users WHERE id = ?",
            [userId]
        );

        res.json({
            status: 'success',
            message: "Cập nhật thành công",
            user: rows[0]
        });

    } catch (err) {
        console.error("Update profile error:", err);
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
};


// 2. Lấy thông tin User 
exports.getUserProfile = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const viewerId = req.query.viewerId;

        if (viewerId) {
            const [blockCheck] = await db.query(`
            SELECT 1 FROM user_blocks
            WHERE (blocker_id = ? AND blocked_id = ?)
                OR (blocker_id = ? AND blocked_id = ?)
            `, [viewerId, targetUserId, targetUserId, viewerId]);

            if (blockCheck.length > 0) {
                return res.status(403).json({ message: "Bị chặn truy cập" });
            }
        }

        const [users] = await db.query("SELECT id, username, fullname, avatar, cover_img, bio, is_premium FROM users WHERE id = ?", [targetUserId]);
        if (users.length === 0) return res.status(404).json({ message: "Không tìm thấy người dùng" });
        
        const user = users[0];

        const [stats] = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM recipes WHERE author_id = ?) as recipes_count,
                (SELECT COUNT(*) FROM user_follows WHERE followed_id = ?) as followers_count,
                (SELECT COUNT(*) FROM user_follows WHERE follower_id = ?) as following_count
        `, [targetUserId, targetUserId, targetUserId]);

        const [recipes] = await db.query(
            "SELECT * FROM recipes WHERE author_id = ? ORDER BY created_at DESC", 
            [targetUserId]
        );

        let isFollowing = false;
        if (viewerId) {
            const [check] = await db.query(
                "SELECT * FROM user_follows WHERE follower_id = ? AND followed_id = ?",
                [viewerId, targetUserId]
            );
            if (check.length > 0) isFollowing = true;
        }

        res.json({
            ...user,
            fullname: user.fullname || user.username,
            stats: {
                recipes: stats[0].recipes_count,
                followers: stats[0].followers_count,
                following: stats[0].following_count
            },
            is_following: isFollowing,
            recipes: recipes 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi Server" });
    }
};
//  Xóa tài khoản
exports.deleteUser = async (req, res) => {
    const userId = req.params.id;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query("DELETE FROM favorites WHERE user_id = ?", [userId]);
        await connection.query("DELETE FROM notifications WHERE user_id = ?", [userId]);
        await connection.query("DELETE FROM recipes WHERE author_id = ?", [userId]);
        const [result] = await connection.query("DELETE FROM users WHERE id = ?", [userId]);
        await connection.commit();
        
        if (result.affectedRows === 0) return res.status(404).json({ message: "Không tìm thấy user" });
        res.json({ status: 'success', message: "Xóa tài khoản thành công" });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ message: "Lỗi hệ thống khi xóa" });
    } finally {
        connection.release();
    }
};

// Follow / Unfollow
exports.toggleFollow = async (req, res) => {
    try {
        const { followerId, followedId } = req.body;

        const [existing] = await db.query(
            "SELECT * FROM user_follows WHERE follower_id = ? AND followed_id = ?",
            [followerId, followedId]
        );

        if (existing.length > 0) {
            await db.query(
                "DELETE FROM user_follows WHERE follower_id = ? AND followed_id = ?",
                [followerId, followedId]
            );

            return res.json({
                status: 'success',
                is_following: false
            });
        }

        await db.query(
            "INSERT INTO user_follows (follower_id, followed_id) VALUES (?, ?)",
            [followerId, followedId]
        );

        const [[follower]] = await db.query(
            "SELECT fullname FROM users WHERE id = ?",
            [followerId]
        );

        await db.query(
            `INSERT INTO notifications (user_id, message, type, is_read)
             VALUES (?, ?, 'follow', 0)`,
            [
                followedId,
                `${follower.fullname} đã theo dõi bạn`
            ]
        );

        return res.json({
            status: 'success',
            is_following: true
        });

    } catch (err) {
        console.error("Lỗi follow:", err);
        res.status(500).json({ message: "Lỗi Server" });
    }
};
// Lấy danh sách Top Chef (Người dùng có nhiều món được yêu thích nhất)
exports.getTopChefs = async (req, res) => {
    try {
        const q = `
            SELECT 
                u.id, u.username, u.fullname, u.avatar, 
                COUNT(f.recipe_id) as total_likes 
            FROM users u
            LEFT JOIN recipes r ON u.id = r.author_id
            LEFT JOIN favorites f ON r.id = f.recipe_id
            GROUP BY u.id, u.username, u.fullname, u.avatar
            ORDER BY total_likes DESC
            LIMIT 3
        `;

        const [data] = await db.query(q); 
        
        res.status(200).json(data);
    } catch (err) {
        console.error("Lỗi API Top Chef:", err);
        res.status(500).json({ message: "Lỗi Server", error: err.message });
    }
};

// Lấy danh sách người bị chặn
exports.getBlockedUsers = async (req, res) => {
    try {
        const { userId } = req.query; 
        const sql = `
            SELECT u.id, u.username, u.fullname, u.avatar 
            FROM user_blocks b
            JOIN users u ON b.blocked_id = u.id
            WHERE b.blocker_id = ?
        `;
        const [list] = await db.query(sql, [userId]);
        res.json(list);
    } catch (err) { res.status(500).json({ message: "Lỗi server" }); }
};

// Chặn người dùng
exports.blockUser = async (req, res) => {
    try {
        const { blockerId, blockedId } = req.body;
        // Kiểm tra xem đã chặn chưa để tránh trùng lặp
        const [exists] = await db.query("SELECT * FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?", [blockerId, blockedId]);
        
        if (exists.length === 0) {
            await db.query("INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (?, ?)", [blockerId, blockedId]);
        }
        res.json({ message: "Đã chặn người dùng" });
    } catch (err) { res.status(500).json({ message: "Lỗi chặn user" }); }
};

// Bỏ chặn (Unblock)
exports.unblockUser = async (req, res) => {
    try {
        const { blockerId, blockedId } = req.body;
        await db.query("DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?", [blockerId, blockedId]);
        res.json({ message: "Đã bỏ chặn" });
    } catch (err) { res.status(500).json({ message: "Lỗi bỏ chặn" }); }
};
//đổi mật khẩu
exports.changePassword = async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;

        const [users] = await db.query("SELECT password FROM users WHERE id = ?", [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: "Người dùng không tồn tại!" });
        }

        const currentPassword = users[0].password;

        if (oldPassword !== currentPassword) {
            return res.status(400).json({ message: "Mật khẩu cũ không chính xác!" });
        }

        await db.query("UPDATE users SET password = ? WHERE id = ?", [newPassword, userId]);

        res.json({ message: "Đổi mật khẩu thành công!" });

    } catch (err) {
        console.error("Lỗi đổi mật khẩu:", err);
        res.status(500).json({ message: "Lỗi Server khi đổi mật khẩu" });
    }
};