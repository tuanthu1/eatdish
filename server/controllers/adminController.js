const express = require('express');
const User = require('../models/UserModel');
const Recipe = require('../models/RecipeModel');
const CommunityPost = require('../models/CommunityPost');
const Feedback = require('../models/Feedback');
const Payment = require('../models/Payment');
const DiscountCode = require('../models/DiscountCode');
const PremiumPackage = require('../models/PremiumPackage');
const ActivityLog = require('../models/ActivityLogModel');
const bcrypt = require('bcryptjs');
const UserReport = require('../models/UserReportModel');
const nodemailer = require('nodemailer');
require('dotenv').config();

//  Lấy thống kê tổng quan
exports.getStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const recipeCount = await Recipe.countDocuments();
        const postCount = await CommunityPost.countDocuments();
        
        res.json({
            users: userCount,
            recipes: recipeCount,
            posts: postCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi server" });
    }
};

//  Lấy danh sách tất cả User
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('_id username fullname email avatar role is_premium is_verified createdAt');
        
        const formattedUsers = users.map(u => {
            const userObj = u.toObject(); // Biến từ document Mongoose thành Object thường
            userObj.id = userObj._id;     // Gán thêm biến id cho React xài
            return userObj;
        });

        res.json(formattedUsers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi server" });
    }
};

//  Xóa User (Ban)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.json({ message: "Đã xóa người dùng thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi server" });
    }
};
// Lấy danh sách tất cả góp ý
exports.getAllFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Feedback.find().populate('user', 'fullname username');
        const formattedFeedbacks = feedbacks.map(f => {
            const fObj = f.toObject();
            fObj.id = fObj._id; // Gắn phao cứu sinh cho React
            return fObj;
        });
        res.json(formattedFeedbacks);
    } catch (err) {
        console.error("Lỗi Get Feedbacks:", err);
        return res.status(500).json({ message: "Lỗi lấy danh sách góp ý." });
    }
};
// Xóa góp ý (Sau khi đã đọc xong)
exports.deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        await Feedback.findByIdAndDelete(id);
        
        return res.status(200).json({ message: "Đã xóa góp ý thành công." });
    } catch (err) {
        console.error("Lỗi Delete Feedback:", err);
        return res.status(500).json({ message: "Không thể xóa góp ý này." });
    }
};

// lây tất cả công thức 
exports.getAllRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find({})
            .populate({
                path: 'author',
                select: 'fullname username _id' // Phải lấy cả _id để gắn link click
            })
            .sort({ createdAt: -1 });
        
        // FORMAT LẠI DỮ LIỆU ĐỂ ĐÁNH LỪA FRONTEND REACT
        const formattedRecipes = recipes.map(r => {
            const obj = r.toObject(); // Biến chuỗi Mongoose thành Object thường
            
            return {
                ...obj,
                id: obj._id,               // Chữa bệnh lỗi "unique key" và lỗi xóa món
                title: obj.name,           // React gọi "title" - MongoDB có "name"
                image_url: obj.img,        // React gọi "image_url" - MongoDB có "img"
                created_at: obj.createdAt, // React gọi "created_at" - MongoDB có "createdAt"
                
                // Trích xuất tên tác giả từ Object populate
                author_name: obj.author ? (obj.author.fullname || obj.author.username) : "Tài khoản đã xóa",
                author_id: obj.author ? obj.author._id : null,
                category: obj.category || 'Khac',
                meal_type: obj.meal_type || 'Khong_xac_dinh'
            };
        });

        res.json(formattedRecipes);
    } catch (err) {
        console.error("Lỗi Get All Recipes:", err);
        res.status(500).json({ message: "Lỗi Server" });
    }
};
//Lấy bài viết cộng đồng 
exports.getCommunityPosts = async (req, res) => {
    try {
        const currentUserId = req.query.userId;
        const posts = await CommunityPost.find({})
            .populate('user', 'fullname avatar username')
            .sort({ createdAt: -1 });

        // Thêm trường is_liked và normalize fields cho mỗi post
        const postsWithLikes = posts.map(post => ({
            ...post.toObject(),
            id: post._id,
            user_id: post.user?._id,
            fullname: post.user?.fullname || post.user?.username || 'Người dùng',
            avatar: post.user?.avatar || '',
            created_at: post.createdAt,
            is_liked: currentUserId && post.likes.includes(currentUserId)
        }));

        res.json(postsWithLikes);
    } catch (err) {
        console.error("Lỗi lấy bài cộng đồng:", err);
        res.status(500).json({ message: "Lỗi Server" });
    }
};
// Xóa bài viết cộng đồng
exports.deleteCommunityPost = async (req, res) => {
    try {
        const { id } = req.params;
        await CommunityPost.findByIdAndDelete(id);
        res.status(200).json({ message: "Đã xóa bài viết thành công", success: true });
    } catch (error) {
        console.error("Lỗi khi xóa bài viết:", error);
        res.status(500).json({ message: "Lỗi server khi xóa bài viết" });
    }
};

//thêm/xóa premium cho công thức
exports.toggleRecipePremium = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_premium } = req.body; 

        await Recipe.findByIdAndUpdate(id, { is_premium }, { returnDocument: 'after' });
        
        res.json({ 
            status: 'success', 
            message: is_premium === 1 ? "Đã đặt làm món ăn VIP 👑" : "Đã hủy trạng thái VIP" 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi cập nhật trạng thái món ăn" });
    }
};
// Xóa công thức
exports.deleteRecipe = async (req, res) => {
    try {
        const { id } = req.params;
        await Recipe.findByIdAndDelete(id);
        res.json({ message: "Đã xóa bài viết" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.importRecipes = async (req, res) => {
    try {
        const { recipes } = req.body;
        
        if (!Array.isArray(recipes) || recipes.length === 0) {
            return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
        }

        const userId = req.user.id; // Admin user ID
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy admin" });
        }

        const createdRecipes = [];
        const errors = [];

        for (let i = 0; i < recipes.length; i++) {
            try {
                const recipe = recipes[i];
                
                // Validate required fields
                if (!recipe.name || !recipe.name.trim()) {
                    errors.push(`Row ${i + 1}: Missing recipe name`);
                    continue;
                }

                const newRecipe = await Recipe.create({
                    title: recipe.name,
                    name: recipe.name,
                    description: recipe.description || '',
                    time: recipe.time || 0,
                    calories: recipe.calories || 0,
                    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
                    steps: Array.isArray(recipe.steps) ? recipe.steps : [],
                    img: recipe.img || '',
                    image_url: recipe.img || '',
                    category: recipe.category || 'Khac',
                    meal_type: recipe.meal_type || 'Khong_xac_dinh',
                    author_id: userId,
                    user_id: userId,
                    author_name: user.username,
                    username: user.username,
                    fullname: user.fullname,
                    created_at: new Date(),
                    createdAt: new Date()
                });

                // Log activity
                await ActivityLog.create({
                    user_id: userId,
                    action: 'import_recipe',
                    details: `Imported recipe: ${recipe.name}`,
                    timestamp: new Date()
                });

                createdRecipes.push(newRecipe);
            } catch (itemErr) {
                errors.push(`Row ${i + 1}: ${itemErr.message}`);
            }
        }

        res.json({ 
            message: `Import hoàn tất: ${createdRecipes.length} công thức thành công`,
            count: createdRecipes.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        console.error('Import error:', err);
        res.status(500).json({ message: "Lỗi import công thức: " + err.message });
    }
};

// kích hoạt / vô hiệu hóa người dùng
exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        const { is_verified } = req.body; 
        const updatedUser = await User.findByIdAndUpdate(
            id, 
            { is_verified: is_verified },
            { returnDocument: 'after' }
        );

        // await ActivityLog.create({
        //     admin: req.user.id,
        //     action: `Đã ${is_verified === 1 ? 'mở khóa' : 'khóa'} tài khoản ${updatedUser.email || updatedUser.fullname}`
        // });

        res.json({ message: "Cập nhật trạng thái thành công" });
    } catch (err) {
        console.error("Lỗi cập nhật User:", err);
        res.status(500).json({ message: "Lỗi server" });
    }
};
// Lấy dữ liệu tổng quan cho biểu đồ
exports.getDashboardStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const recipeCount = await Recipe.countDocuments();
        const feedbackCount = await Feedback.countDocuments();

        const stats = [
            { name: 'Người dùng', count: userCount },
            { name: 'Công thức', count: recipeCount },
            { name: 'Góp ý', count: feedbackCount }
        ];

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy thống kê" });
    }
};

// Thống kê món ăn yêu thích
exports.getFavoriteStats = async (req, res) => {
    try {
        const { category, limit } = req.query;
        let recipeMatch = {};
        if (category && category !== 'all') {
            recipeMatch["recipe.category"] = category;
        }
        
        const topN = parseInt(limit) || 10;

        const favoriteStats = await User.aggregate([
            { $unwind: "$favorites" },
            { $group: { _id: "$favorites", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $lookup: { from: "recipes", localField: "_id", foreignField: "_id", as: "recipe" } },
            { $unwind: "$recipe" },
            { $match: recipeMatch },
            { $limit: topN },
            { $project: { _id: 1, title: "$recipe.name", count: 1 } }
        ]);
        res.json(favoriteStats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy thống kê món ăn yêu thích" });
    }
};
// Admin cập nhật trạng thái Premium (Cấp hoặc Xóa)
exports.updateUserPremium = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_premium } = req.body; 
        const foreverDate = new Date('3636-06-03 23:59:59');
        
        const updateData = {
            is_premium,
            premium_since: is_premium ? new Date() : null,
            premium_until: is_premium ? foreverDate : null
        };

        await User.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
        
        res.json({ 
            status: 'success', 
            message: is_premium === 1 
                ? "Đã cấp Premium thành công " 
                : "Đã hủy quyền Premium của người dùng",
            userId: id 
        });
    } catch (err) {
        console.error("Lỗi cập nhật Premium Admin:", err);
        res.status(500).json({ message: "Lỗi server khi cập nhật trạng thái Premium" });
    }
};
//
exports.toggleVerify = async (req, res) => {
    try {
        const userId = req.params.id;
        const { is_verified } = req.body; 

        await User.findByIdAndUpdate(userId, { is_verified }, { returnDocument: 'after' });

        res.json({ 
            status: 'success', 
            message: is_verified === 1 ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản" 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi cập nhật trạng thái xác minh" });
    }
};
// hàm lịch sử giao dịch
exports.getAllPayments = async (req, res) => {
    try {
        const rows = await Payment.find({})
            .populate({
                path: 'user',
                select: 'username email'
            })
            .sort({ createdAt: -1 })
            .then(payments => payments.map(p => ({
                order_id: p.order_id,
                amount: p.amount,
                status: p.status,
                created_at: p.createdAt,
                username: p.user?.username || 'Tài khoản đã xóa',
                email: p.user?.email || 'Không có dữ liệu'
            })));

        res.json(rows);
    } catch (error) {
        console.error("Lỗi lấy lịch sử giao dịch:", error);
        res.status(500).json({ message: "Lỗi Server" });
    }
};
// reset mật khẩu
exports.resetPass = async (req, res) => {
    const userId = req.params.id;
    const { password } = req.body;
    if (!password) {
        return res.status(400).json("Thiếu mật khẩu mới!");
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await User.findByIdAndUpdate(userId, { password: hashedPassword }, { returnDocument: 'after' });
        
        return res.status(200).json("Reset thành công!");
    } catch (err) {
        console.error("Lỗi Server:", err);
        return res.status(500).json(err);
    }
};
// TẠO GÓI VIP MỚI
exports.createPackage = async (req, res) => {
    try {
        const { name, price, duration_days, duration, description, benefits } = req.body;
        const finalDuration = duration_days || duration;

        if (!name || !price || !finalDuration) {
            return res.status(400).json({ message: "Vui lòng nhập đủ Tên gói, Giá và Số ngày!" });
        }
        let benefitsArray = [];
        if (typeof benefits === 'string') {
            try {
                benefitsArray = JSON.parse(benefits); 
            } catch (e) {
                benefitsArray = benefits.split(',').map(b => b.trim());
            }
        } else if (Array.isArray(benefits)) {
            benefitsArray = benefits;
        }
        const newPackage = await PremiumPackage.create({
            name: name,
            price: price,
            duration_days: finalDuration,
            description: description,
            benefits: benefitsArray,
            is_active: true
        });
        const packageData = newPackage.toObject();
        packageData.id = packageData._id;

        res.json({ 
            status: 'success', 
            message: "Tạo gói VIP thành công!", 
            package: packageData 
        });

    } catch (err) {
        console.error("Lỗi tạo gói VIP:", err);
        res.status(500).json({ message: "Lỗi server: " + err.message });
    }
};

// Xóa gói premium
exports.deletePackage = async (req, res) => {
    try {
        await PremiumPackage.findByIdAndUpdate(req.params.id, { is_active: false });
        res.json({ message: "Đã xóa gói cước" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi xóa gói" });
    }
};

// Cập nhật gói cước 
exports.updatePackage = async (req, res) => {
    const { id } = req.params;
    if (!id || id === 'undefined') {
        return res.status(400).json({ message: "Lỗi ID: Vui lòng tải lại trang web (F5) và thử lại!" });
    }

    const { name, price, duration_days, duration, description, benefits } = req.body;
    
    try {
        const finalDuration = duration_days || duration;

        let benefitsArray = [];
        if (typeof benefits === 'string') {
            try {
                benefitsArray = JSON.parse(benefits);
            } catch (e) {
                benefitsArray = benefits.split(',').map(b => b.trim());
            }
        } else if (Array.isArray(benefits)) {
            benefitsArray = benefits;
        }

        const updatedPackage = await PremiumPackage.findByIdAndUpdate(id, {
            name, price, duration_days: finalDuration, benefits: benefitsArray, description
        }, { returnDocument: 'after' });

        if (!updatedPackage) return res.status(404).json({ message: "Không tìm thấy gói cước" });

        res.json({ message: "Cập nhật thành công", package: updatedPackage });
    } catch (err) {
        console.error("Lỗi update package:", err);
        res.status(500).json({ message: "Lỗi cập nhật gói cước" });
    }
};
// Lấy danh sách mã giảm giá (Gộp luôn đếm lượt sử dụng và fix lỗi React)
exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await DiscountCode.find({}).sort({ createdAt: -1 });
        
        // Đếm số lượt dùng từ bảng Payment và map _id thành id cho React
        const couponsWithUsage = await Promise.all(
            coupons.map(async (coupon) => {
                const usedCount = await Payment.countDocuments({
                    coupon_code: coupon.code,
                    status: 'paid'
                });
                
                const obj = coupon.toObject();
                return {
                    ...obj,
                    id: obj._id,             // Chữa lỗi unique key và undefined ở Frontend
                    used_count: usedCount    // Cập nhật số lượt dùng thực tế
                };
            })
        );
        
        res.json(couponsWithUsage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi lấy danh sách mã" });
    }
};

// Tạo mã giảm giá
// Tạo mã giảm giá (Đã fix lỗi thông báo trống trơn cho React)
exports.createCoupon = async (req, res) => {
    try {
        let { code, percent, expiry_date } = req.body;

        // Trả về CẢ 'message' VÀ 'error' để Frontend kiểu gì cũng đọc được
        if (percent === undefined || percent === null || isNaN(Number(percent))) {
            return res.status(400).json({ 
                message: "Lỗi: Phần trăm giảm giá bắt buộc phải là số!",
                error: "Lỗi: Phần trăm giảm giá bắt buộc phải là số!"
            });
        }

        const numericPercent = Number(percent); // Ép chuẩn về số

        // Nếu không nhập code -> Tự Random
        if (!code) {
            const randomStr = Math.random().toString(36).substring(3, 6).toUpperCase();
            code = `SALE${numericPercent}-${randomStr}`;
        }

        const newCoupon = await DiscountCode.create({
            code: code.toUpperCase(),
            percent: numericPercent,
            expiry_date: expiry_date || null,
            is_active: true
        });

        const couponData = newCoupon.toObject();
        couponData.id = couponData._id;

        res.status(201).json({ message: "Tạo mã thành công", code: code.toUpperCase(), coupon: couponData });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ 
                message: "Mã giảm giá này đã tồn tại!", 
                error: "Mã giảm giá này đã tồn tại!" 
            });
        }
        console.error(err);
        res.status(500).json({ message: "Lỗi tạo mã", error: "Lỗi tạo mã" });
    }
};

// Sửa mã giảm giá (Đã fix lỗi thông báo trống trơn cho React)
exports.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || id === 'undefined') {
            return res.status(400).json({ message: "Lỗi ID: Vui lòng tải lại trang (F5)!", error: "Lỗi ID: Vui lòng tải lại trang (F5)!" });
        }

        const { code, percent, expiry_date } = req.body;
        
        if (!code) {
            return res.status(400).json({ message: "Thiếu thông tin mã code", error: "Thiếu thông tin mã code" });
        }

        if (percent === undefined || percent === null || isNaN(Number(percent))) {
            return res.status(400).json({ 
                message: "Lỗi: Phần trăm giảm giá bắt buộc phải là số!",
                error: "Lỗi: Phần trăm giảm giá bắt buộc phải là số!"
            });
        }

        await DiscountCode.findByIdAndUpdate(id, {
            code,
            percent: Number(percent),
            expiry_date: expiry_date || null
        }, { returnDocument: 'after' });

        res.json({ message: "Cập nhật mã giảm giá thành công!" });
    } catch (error) {
        console.error("Lỗi update coupon:", error);
        res.status(500).json({ message: "Lỗi server khi cập nhật mã", error: "Lỗi server khi cập nhật mã" });
    }
};

// Xóa mã giảm giá
exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || id === 'undefined') return res.status(400).json({ message: "Lỗi ID: Vui lòng tải lại trang (F5)!" });

        await DiscountCode.findByIdAndDelete(id);
        res.json({ message: "Đã xóa mã giảm giá" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi xóa mã" });
    }
};


// Đổi trạng thái mã giảm giá (Bật/Tắt)
exports.toggleCouponStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || id === 'undefined') return res.status(400).json({ message: "Lỗi ID: Vui lòng tải lại trang (F5)!" });

        const coupon = await DiscountCode.findById(id);
        if (!coupon) return res.status(404).json({ message: "Mã không tồn tại" });
        
        await DiscountCode.findByIdAndUpdate(id, { is_active: !coupon.is_active });
        res.json({ message: "Đã cập nhật trạng thái mã giảm giá" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi cập nhật trạng thái" });
    }
};
//S Gửi Bản tin (Newsletter) cho những người đã đăng ký
exports.sendNewsletter = async (req, res) => {
    try {
        const { subject, htmlContent } = req.body;

        if (!subject || !htmlContent) {
            return res.status(400).json({ message: "Vui lòng nhập tiêu đề và nội dung Email" });
        }

        const users = await User.find({
            email_newsletter: true,
            email: { $exists: true, $ne: null },
            is_verified: true
        }).select('email');
        
        if (users.length === 0) {
            return res.status(400).json({ message: "Hiện chưa có ai đăng ký nhận bản tin." });
        }

        const emailList = users.map(u => u.email);
        const transporter = nodemailer.createTransport({
            service: 'gmail', 
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS 
            }
        });

        const mailOptions = {
            from: `"EatDish - Khám phá món ngon" <${process.env.EMAIL_USER}>`,
            bcc: emailList, 
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #ff9f43; text-align: center;">Thư từ Bếp trưởng EatDish 👨‍🍳</h2>
                    <div style="color: #444; font-size: 16px; line-height: 1.6;">
                        ${htmlContent}
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999; text-align: center;">
                        Bạn nhận được email này vì đã đăng ký nhận "Bản tin EatDish". <br/>
                        Để hủy đăng ký, vui lòng truy cập phần <b>Cài đặt -> Thông báo</b> trên website.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({ 
            success: true, 
            message: ` Gửi bản tin thành công tới ${emailList.length} Đầu Bếp EatDish!` 
        });

    } catch (err) {
        console.error("Lỗi gửi Newsletter:", err);
        res.status(500).json({ message: "Lỗi Server khi gửi email" });
    }
};
exports.getActivityLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.find()
            .populate('admin', 'fullname username') // Lấy tên thật và username của thằng Admin
            .sort({ createdAt: -1 }) // Xếp mới nhất lên đầu
            .limit(50); // Lấy 50 cái thôi cho nhẹ web
            
        res.json(logs);
    } catch (err) {
        console.error("Lỗi lấy lịch sử:", err);
        res.status(500).json({ message: "Lỗi server" });
    }
};

exports.deleteActivityLog = async (req, res) => {
    try {
        const { id } = req.params;
        await ActivityLog.findByIdAndDelete(id);
        res.json({ message: "Đã xóa lịch sử hoạt động thành công" });
    } catch (err) {
        console.error("Lỗi xóa lịch sử hoạt động:", err);
        res.status(500).json({ message: "Lỗi server khi xóa lịch sử" });
    }
};

exports.updateRecipeClassification = async (req, res) => {
    try {
        const { id } = req.params;
        const { category, meal_type } = req.body;

        const updatePayload = {
            category: category ? String(category).trim() : 'Khac',
            meal_type: meal_type ? String(meal_type).trim() : 'Khong_xac_dinh'
        };

        const updatedRecipe = await Recipe.findByIdAndUpdate(id, updatePayload, { new: true })
            .populate({ path: 'author', select: 'fullname username _id' });

        if (!updatedRecipe) {
            return res.status(404).json({ message: 'Không tìm thấy công thức' });
        }

        res.json({
            message: 'Cập nhật phân loại thành công',
            recipe: {
                id: updatedRecipe._id,
                category: updatedRecipe.category,
                meal_type: updatedRecipe.meal_type,
            }
        });
    } catch (err) {
        console.error('Lỗi cập nhật phân loại công thức:', err);
        res.status(500).json({ message: 'Lỗi cập nhật phân loại món ăn' });
    }
};

// Lấy danh sách báo cáo
exports.getUserReports = async (req, res) => {
    try {
        const reports = await UserReport.find()
            .populate('reporter', 'fullname username avatar')
            .populate('reportedUser', 'fullname username avatar')
            .sort({ createdAt: -1 });

        const formattedReports = reports.map(r => {
            const obj = r.toObject();
            obj.id = obj._id;
            return obj;
        });

        res.json(formattedReports);
    } catch (err) {
        console.error("Lỗi lấy báo cáo:", err);
        res.status(500).json({ message: "Lỗi Server khi lấy danh sách báo cáo" });
    }
};

// Cập nhật trạng thái báo cáo
exports.updateUserReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const updatedReport = await UserReport.findByIdAndUpdate(id, { status }, { new: true });
        res.json({ message: "Cập nhật trạng thái báo cáo thành công", report: updatedReport });
    } catch (err) {
        console.error("Lỗi cập nhật báo cáo:", err);
        res.status(500).json({ message: "Lỗi Server khi cập nhật trạng thái báo cáo" });
    }
};

// Xóa báo cáo
exports.deleteUserReport = async (req, res) => {
    try {
        const { id } = req.params;
        await UserReport.findByIdAndDelete(id);
        res.json({ message: "Xóa báo cáo thành công" });
    } catch (err) {
        console.error("Lỗi xóa báo cáo:", err);
        res.status(500).json({ message: "Lỗi Server khi xóa báo cáo" });
    }
};

const RecipeReport = require('../models/RecipeReportModel');

// Lấy danh sách báo cáo công thức
exports.getRecipeReports = async (req, res) => {
    try {
        const reports = await RecipeReport.find()
            .populate('reporter', 'username fullname avatar')
            .populate('reportedRecipe', 'name title image img author_id')
            .sort({ createdAt: -1 });
        
        // Populate author of recipe
        const populatedReports = await Promise.all(reports.map(async (report) => {
            const r = report.toObject();
            if (r.reportedRecipe && r.reportedRecipe.author_id) {
                const author = await User.findById(r.reportedRecipe.author_id).select('username fullname avatar');
                r.reportedRecipe.author = author;
            }
            return r;
        }));

        res.json(populatedReports);
    } catch (err) {
        console.error("Lỗi lấy danh sách báo cáo công thức:", err);
        res.status(500).json({ message: "Lỗi Server" });
    }
};

// Cập nhật trạng thái báo cáo công thức
exports.updateRecipeReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const updatedReport = await RecipeReport.findByIdAndUpdate(id, { status }, { new: true });
        res.json({ message: "Cập nhật trạng thái báo cáo thành công", report: updatedReport });
    } catch (err) {
        console.error("Lỗi cập nhật báo cáo công thức:", err);
        res.status(500).json({ message: "Lỗi Server khi cập nhật trạng thái báo cáo" });
    }
};

// Xóa báo cáo công thức
exports.deleteRecipeReport = async (req, res) => {
    try {
        const { id } = req.params;
        await RecipeReport.findByIdAndDelete(id);
        res.json({ message: "Xóa báo cáo thành công" });
    } catch (err) {
        console.error("Lỗi xóa báo cáo công thức:", err);
        res.status(500).json({ message: "Lỗi Server khi xóa báo cáo" });
    }
};