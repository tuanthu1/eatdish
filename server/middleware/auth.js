const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.cookies.accessToken || req.cookies.token; 

    if (!token) {
        return res.status(401).json({ message: "Thiếu token, vui lòng đăng nhập!" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Dịch token xong nhét vào req.user
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            res.clearCookie('accessToken');
            res.clearCookie('token');
            return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!" });
        }
        return res.status(401).json({ message: "Token không hợp lệ!" });
    }
};

const checkAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') { 
        next(); 
    } else {
        return res.status(403).json({ message: "Từ chối truy cập: Bạn không có quyền Admin!" });
    }
};
module.exports = { 
    verifyToken, 
    checkAdmin 
};