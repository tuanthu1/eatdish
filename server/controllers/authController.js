const User = require('../models/UserModel');
const ActivityLog = require('../models/ActivityLogModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const sendVerifyEmail = require('../utils/sendVerifyEmail');
const sendResetEmail = require('../utils/sendResetEmail');
// ĐĂNG KÝ TÀI KHOẢN MỚI 
exports.register = async (req, res) => {
    try {
        const { username, email, password, fullname, avatar } = req.body;

        if (!username || !email || !password || !fullname) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Email không hợp lệ" });
        }

        const userExist = await User.findOne({
            $or: [{ username }, { email }]
        });
        if (userExist) {
            return res.status(400).json({ message: "Username hoặc Email đã tồn tại" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const finalAvatar =
            avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}`;

        const verifyToken = crypto.randomBytes(32).toString('hex');

        await User.create({
            username,
            email,
            password: hashedPassword,
            fullname,
            avatar: finalAvatar,
            is_verified: false,
            email_verify_token: verifyToken
        });

        await sendVerifyEmail(email, fullname, verifyToken);
        await ActivityLog.create({
            username: username,
            action: "Tài khoản " + email + " đã đăng ký và cần xác minh email."
        });
        return res.json({
            status: 'success',
            message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.'
        });

    } catch (err) {
        console.error("Lỗi đăng ký:", err);
        res.status(500).json({ message: "Lỗi Server" });
    }
};


// ĐĂNG NHẬP 
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });
        if (!user) return res.status(404).json({ message: "Sai tên đăng nhập hoặc mật khẩu" });

        if (!user.is_verified) {
            return res.status(403).json({ message: "Tài khoản chưa xác minh email." });
        }
        if (user.is_disabled) {
            return res.status(403).json({ message: "Tài khoản bị vô hiệu hóa!" });
        }
        let hasJustExpired = false;
        if (user.is_premium && user.premium_until) {
            const now = new Date();
            const expiry = new Date(user.premium_until);
            
            if (now > expiry) {
                hasJustExpired = true; 
                await User.findByIdAndUpdate(user._id, { is_premium: false });
                
                user.is_premium = false; 
            }
        }

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ message: "Sai mật khẩu" });

        const accessToken = jwt.sign(
            { id: user.id, role: user.role, is_premium: user.is_premium },
            process.env.JWT_SECRET || 'eatdish_secret_key',
            { expiresIn: '1d' }
        );

        const refreshToken = jwt.sign(
            { id: user.id }, 
            process.env.JWT_REFRESH_SECRET || 'eatdish_refresh_secret_key', 
            { expiresIn: '7d' }
        );

        await User.findByIdAndUpdate(user._id, { refresh_token: refreshToken });
        const userData = user.toObject ? user.toObject() : user;
        delete userData.password;
        await ActivityLog.create({
            username: user.username,
            action: "Tài khoản " + user.email + " đã đăng nhập."
        });
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 ngày
        });
        return res.json({
            status: 'success',
            message: "Đăng nhập thành công",
            user: {
                ...userData,
                id: user._id, // Cấp sẵn ID chuẩn cho Frontend
                is_premium: user.is_premium,
                premium_expired: hasJustExpired 
            }
        });
        
    } catch (err) {
        console.error("Login Error:", err);
        if (!res.headersSent) {
            res.status(500).json({ message: "Lỗi Đăng nhập server" });
        }
    }
};
// XỬ LÝ ĐĂNG NHẬP GOOGLE
exports.googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ message: "Không tìm thấy token từ Google." });
        }
        const googleResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const { email, name } = googleResponse.data;
        let user = await User.findOne({ email });
        if (!user) {
            const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
            
            // TẠO USERNAME: Eatdish_ + 6 số ngẫu nhiên (VD: Eatdish_482910)
            const randomNumber = Math.floor(100000 + Math.random() * 900000);
            const username = `Eatdish_${randomNumber}`;
            const randomAvatar = `https://ui-avatars.com/api/?name=${name}&background=random&color=fff&size=128`;
            
            user = await User.create({
                fullname: name,
                username,
                email,
                password: randomPassword,
                avatar: randomAvatar,
                role: 'user',
                is_premium: false
            });
        }
        const jwtSecret = process.env.JWT_SECRET || 'SECRET_KEY'; 
        const accessToken = jwt.sign(
            { id: user.id, role: user.role }, 
            jwtSecret, 
            { expiresIn: '1d' }
        );

        const userData = user.toObject ? user.toObject() : user;
        delete userData.password;
        await ActivityLog.create({
            username: user.username,
            action: "Tài khoản " + user.email + " đã đăng nhập bằng Google."
            });
        res.status(200).json({
            status: 'success',
            user: userData,
            token: accessToken
        });

    } catch (error) {
        console.error("Lỗi Google Auth:", error.message);
        res.status(500).json({ message: "Xác thực Google thất bại." });
    }
};
// hàm đổi mật khẩu
exports.changePassword = async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Tài khoản không tồn tại." });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Mật khẩu cũ không chính xác!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.findByIdAndUpdate(userId, { password: hashedPassword });
        await ActivityLog.create({
            username: user.username,
            action: "Tài khoản " + user.email + " đã đổi mật khẩu thành công."
        });
        res.json({ status: 'success', message: "Đổi mật khẩu thành công!" });

    } catch (err) {
        console.error("Lỗi đổi pass:", err);
        res.status(500).json({ message: "Lỗi Server: " + err.message });
    }
};

// hàm check 
exports.checkUser = async (req, res) => {
    const { username, email } = req.body;
    const userExists = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (userExists) {
        return res.status(400).json({ message: "Username hoặc email đã tồn tại" });
    }
    res.json({ status: 'ok' });
};
// hàm xác thực
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Thiếu token" });
    }

    const user = await User.findOne({ email_verify_token: token });

    if (!user) {
      return res.status(400).json({
        message: "Token không hợp lệ hoặc đã được sử dụng"
      });
    }

    await User.findByIdAndUpdate(user._id, {
      is_verified: true,
      email_verify_token: null
    });
    await ActivityLog.create({
        username: user.username,
        action: "Tài khoản " + user.email + " đã xác minh email thành công."
    });
    return res.json({ message: "Xác minh email thành công" });

  } catch (err) {
    console.error("VERIFY EMAIL ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
// chức năng quên mật khảu
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Kiểm tra email tồn tại
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Email không tồn tại trong hệ thống" });
        }

        // Tạo token reset
        const token = crypto.randomBytes(20).toString('hex');
        const expireTime = new Date(Date.now() + 3600000); // Hết hạn sau 1 tiếng 

        // Lưu token vào DB
        await User.findByIdAndUpdate(user._id, {
            reset_token: token,
            reset_expires: expireTime
        });

        // Link reset 
        const resetUrl = `${process.env.DOMAIN}/reset-password?token=${token}`;

        // Gửi mail
        await sendResetEmail(email, resetUrl);
        await ActivityLog.create({
            username: user.username,
            action: "Tài khoản" + user.email + " đã yêu cầu đặt lại mật khẩu."
        });
        res.json({ message: "Đã gửi link đặt lại mật khẩu vào email của bạn!" });   

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Lỗi gửi mail: " + error.message });
    }
};
// hàm đổi mật khẩu
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await User.findOne({
            reset_token: token,
            reset_expires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: "Link không hợp lệ hoặc đã hết hạn" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.findByIdAndUpdate(user._id, {
            password: hashedPassword,
            reset_token: null,
            reset_expires: null
        });
        await ActivityLog.create({
            username: user.username,
            action: "Tài khoản" + user.email + " đã đặt lại mật khẩu thành công qua chức năng quên mật khẩu."
        });
        res.json({ message: "Đặt lại mật khẩu thành công! Hãy đăng nhập ngay." });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "Lỗi server: " + error.message });
    }
};
// Trả về thông tin thật sự dựa vào Token
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('id username fullname avatar role is_premium');
        
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy" });
        }
        
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: "Lỗi Server" });
    }
};
// ĐĂNG XUẤT (Xóa sạch Cookie)
exports.logout = (req, res) => {
    res.clearCookie('accessToken');
    res.json({ message: "Đã đăng xuất" });
};