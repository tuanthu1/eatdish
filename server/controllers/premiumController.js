const PremiumPackage = require('../models/PremiumPackage');
const User = require('../models/UserModel');

// Lấy danh sách gói 
exports.getAllPackages = async (req, res) => {
    try {
        const packages = await PremiumPackage.find({ is_active: true });
        
        const formattedPackages = packages.map(p => {
            const obj = p.toObject();
            obj.id = obj._id;
            return obj;
        });

        res.json(formattedPackages);
    } catch (err) { 
        console.error("Lỗi lấy danh sách gói:", err);
        res.status(500).json({ message: "Lỗi server" }); 
    }
};

// lấy thông tin trạng thái VIP của user
exports.getUserPremiumStatus = async (req, res) => {
    try {
        const userId = req.user?.id; 
        
        if (!userId) {
            return res.status(401).json({ message: "Vui lòng đăng nhập!" });
        }
        const user = await User.findById(userId).select('is_premium premium_until');
        
        if (user) {
            res.json(user); 
        } else {
            res.status(404).json({ message: "Không tìm thấy người dùng" });
        }
    } catch (err) { 
        console.error("Lỗi lấy thông tin VIP:", err);
        res.status(500).json({ message: "Lỗi server" }); 
    }
};