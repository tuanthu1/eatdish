const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
   

    if (!authHeader) {
        return res.status(401).json({ message: "Thiếu token" });
    }
     const token = authHeader && authHeader.split(' ')[1]; 
    if (!token) return res.status(401).json({ message: 'Vui lòng đăng nhập!' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eatdish_secret_key');
        req.user = decoded; 
        next(); 
    } catch (err) {
        console.log(err);
        return res.status(403).json({ message: 'Token không hợp lệ hoặc hết hạn' });
    }
};

module.exports = verifyToken;