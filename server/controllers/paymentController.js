const axios = require("axios");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const DiscountCode = require("../models/DiscountCode");
const PremiumPackage = require("../models/PremiumPackage");
const User = require("../models/UserModel");
const ActivityLog = require('../models/ActivityLogModel');
const PAYOS_API = "https://api-merchant.payos.vn/v2/payment-requests";

// KIỂM TRA MÃ GIẢM GIÁ 
exports.checkCoupon = async (req, res) => {
    const { code } = req.body;
    try {
        const coupon = await DiscountCode.findOne({
            code,
            is_active: true,
            $or: [
                { expiry_date: { $gte: new Date() } },
                { expiry_date: null }
            ]
        });

        if (!coupon) {
            return res.status(404).json({ message: "Mã không hợp lệ hoặc đã hết hạn" });
        }
        await ActivityLog.create({
            admin: req.user ? req.user.id : null,
            action: "Tài khoản " + req.user.id + " đã áp dụng mã giảm giá: " + code
        });
        res.json({ 
            success: true, 
            percent: coupon.percent, 
            code: coupon.code,
            message: `Áp dụng mã ${coupon.code} thành công! Giảm ${coupon.percent}%` 
        });
    } catch (error) {
        console.error("Lỗi check coupon:", error);
        res.status(500).json({ message: "Lỗi kiểm tra mã" });
    }
};

//TẠO LINK THANH TOÁN 
exports.createPaymentLink = async (req, res) => {
    try {
        const userId = req.user.id;
        const { packageId, discountCode } = req.body;
        
        const orderCode = Number(Date.now().toString().slice(-6));
        let amount = 5000; 
        let packageName = "PREMIUM";
        
        if (packageId) {
            const pkg = await PremiumPackage.findById(packageId);
            if (pkg) {
                amount = Number(pkg.price); 
                packageName = pkg.name;
            }
        }

        let description = `EATDISH ${packageName}`;
        if (discountCode) {
            const codeDoc = await DiscountCode.findOne({
                code: discountCode,
                is_active: true,
                $or: [
                    { expiry_date: { $gte: new Date() } },
                    { expiry_date: null }
                ]
            });
            
            if (codeDoc) {
                const percent = codeDoc.percent;
                const discountAmount = (amount * percent) / 100;
                amount = Math.round(amount - discountAmount);
                description += ` KM ${discountCode}`;
            }
        }

        //  NẾU GIÁ <= 0 (MIỄN PHÍ)
        if (amount <= 0) {
            let durationDays = 30;
            if (packageId) {
                const pkg = await PremiumPackage.findById(packageId);
                if (pkg) durationDays = pkg.duration_days;
            }

            const currentUser = await User.findById(userId);
            let startDate = new Date();
            if (currentUser.is_premium && currentUser.premium_until && new Date(currentUser.premium_until) > new Date()) {
                startDate = new Date(currentUser.premium_until); 
            }

            if (discountCode) {
                await DiscountCode.findOneAndUpdate(
                    { code: discountCode },
                    { $inc: { used_count: 1 } }
                );
            }

            const premiumUntil = new Date(startDate);
            premiumUntil.setDate(premiumUntil.getDate() + durationDays);

            await Payment.create({
                order_id: orderCode,
                user: userId,
                amount,
                status: 'pending',
                coupon_code: discountCode || null,
                package: packageId || null
            });
            
            await User.findByIdAndUpdate(userId, {
                is_premium: true,
                premium_since: currentUser.premium_since || new Date(),
                premium_until: premiumUntil
            });

            return res.json({ 
                free: true, 
                message: "Cộng dồn Premium thành công!",
                checkoutUrl: `/premium-success?packageId=${packageId}`
            });
        }

        if (amount < 2000) amount = 2000;
        description = `${orderCode} VIP`.substring(0, 25);
        
        const data = {
            orderCode,
            amount,
            description,
            returnUrl: `${process.env.DOMAIN}/premium-success?packageId=${packageId || ''}`,
            cancelUrl: `${process.env.DOMAIN}/premium-cancel?packageId=${packageId || ''}`
        };

        const rawSignature = `amount=${data.amount}&cancelUrl=${data.cancelUrl}&description=${data.description}&orderCode=${data.orderCode}&returnUrl=${data.returnUrl}`;
        const signature = crypto.createHmac("sha256", process.env.PAYOS_CHECKSUM_KEY).update(rawSignature).digest("hex");

        const response = await axios.post(
            PAYOS_API,
            { ...data, signature },
            { headers: { "Content-Type": "application/json", "x-client-id": process.env.PAYOS_CLIENT_ID, "x-api-key": process.env.PAYOS_API_KEY } }
        );

        if (response.data.code == "00") {
            await Payment.create({
                order_id: orderCode,
                user: userId,
                amount,
                status: 'pending',
                coupon_code: discountCode || null,
                package: packageId || null
            });
            return res.json({ checkoutUrl: response.data.data.checkoutUrl });
        } else {
            console.error("Lỗi PayOS:", response.data);
            return res.status(400).json({ message: "Lỗi PayOS: " + response.data.desc });
        }

    } catch (error) {
        console.error("Lỗi tạo thanh toán:", error);
        res.status(500).json({ error: error.message });
    }
};

//WEBHOOK XỬ LÝ THANH TOÁN THÀNH CÔNG 
exports.handleWebhook = async (req, res) => {
    try {
        const body = req.body;
        console.log("=== BẮT ĐẦU NHẬN WEBHOOK TỪ PAYOS ===");

        if (!body || !body.data) {
            return res.json({ success: true });
        }

        const { data, signature, code } = body; 
        const signData = [];
        const sortedKeys = Object.keys(data).sort(); 
        
        for (const key of sortedKeys) {
            let value = data[key];
            if (value === null || value === undefined) value = "";
            
            if (typeof value !== "object") {
                signData.push(`${key}=${String(value)}`);
            }
        }
        
        const rawSignature = signData.join('&');
        const expectedSignature = crypto
            .createHmac("sha256", process.env.PAYOS_CHECKSUM_KEY)
            .update(rawSignature)
            .digest("hex");

        if (expectedSignature !== signature) {
            console.error("LỖI: Chữ ký không khớp! Giao dịch bị từ chối.");
            return res.json({ success: true }); 
        }

        const orderCode = data.orderCode;
        const status = data.status;

        if (code === "00" || status === "success") {
            console.log(`Đơn hàng ${orderCode} HỢP LỆ. Đang ghi vào DB...`);

            const payment = await Payment.findOne({ order_id: orderCode });
            
            if (payment) {
                const user_id = payment.user;
                const user = await User.findById(user_id);
                
                let startDate = new Date();
                if (user.premium_until) {
                    const currentUntil = new Date(user.premium_until);
                    const now = new Date();
                    if (currentUntil > now) {
                        startDate = new Date(user.premium_until);
                    }
                }

                // Tính số ngày VIP
                let durationDays = 30; 
                if (payment.package) {
                    const pkg = await PremiumPackage.findById(payment.package);
                    if (pkg) durationDays = pkg.duration_days;
                }

                // Cập nhật trạng thái thanh toán
                await Payment.findOneAndUpdate(
                    { order_id: orderCode },
                    { status: 'success' }
                );

                // Tính ngày hết hạn mới
                const premiumUntil = new Date(startDate);
                premiumUntil.setDate(premiumUntil.getDate() + durationDays);

                // Cập nhật VIP cho user
                await User.findByIdAndUpdate(user_id, {
                    is_premium: true,
                    premium_since: user.premium_since || new Date(),
                    premium_until: premiumUntil
                });
                
                console.log(`[THÀNH CÔNG] Đã cộng ${durationDays} ngày VIP cho User ID: ${user_id}`);
            } else {
                console.log(`Không tìm thấy đơn hàng ${orderCode} trong Database.`);
            }
        }
        else if (status === "CANCELLED" || code !== "00") {
            console.log(`Đơn hàng đã bị hủy hoặc thất bại: ${orderCode}`);
            await Payment.findOneAndUpdate(
                { order_id: orderCode },
                { status: 'failed' }
            );
        }

        await ActivityLog.create({
            admin: req.user ? req.user.id : null,
            action: "Tài khoản " + req.user.id + " đã hoàn thành giao dịch thanh toán với mã đơn hàng: " + orderCode
        });

        return res.json({ success: true });

    } catch (error) {
        console.error("LỖI NGHIÊM TRỌNG TRONG WEBHOOK:", error);
        res.status(500).json({ success: false });
    }
};

// XỬ LÝ KHI KHÁCH ẤN NÚT HỦY TỪ GIAO DIỆN PAYOS
exports.cancelTransaction = async (req, res) => {
    try {
        const { orderCode } = req.body;
        if (!orderCode) return res.status(400).json({ message: "Thiếu mã đơn hàng" });

        await Payment.findOneAndUpdate(
            { order_id: orderCode, status: 'pending' },
            { status: 'failed' }
        );
        await ActivityLog.create({
            admin: req.user ? req.user.id : null,
            action: "Tài khoản " + req.user.id + " đã hủy giao dịch với mã đơn hàng: " + orderCode
        });
        return res.json({ success: true, message: "Đã cập nhật trạng thái hủy" });
    } catch (error) {
        console.error("Lỗi hủy đơn hàng:", error);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

// XÁC NHẬN THANH TOÁN (CHO FRONTEND GỌI KHI QUAY LẠI TỪ PAYOS)
exports.verifyReturn = async (req, res) => {
    try {
        const { orderCode } = req.body;
        if (!orderCode) return res.status(400).json({ message: "Thiếu mã đơn hàng" });

        const payment = await Payment.findOne({ order_id: orderCode });
        if (!payment) return res.status(404).json({ message: "Không tìm thấy giao dịch" });

        if (payment.status === 'success') {
            return res.json({ success: true, message: "Giao dịch đã được cập nhật trước đó" });
        }

        // Fetch transaction status from PayOS
        const response = await axios.get(
            `${PAYOS_API}/${orderCode}`,
            { headers: { "Content-Type": "application/json", "x-client-id": process.env.PAYOS_CLIENT_ID, "x-api-key": process.env.PAYOS_API_KEY } }
        );

        if (response.data.code == "00" && response.data.data.status === "PAID") {
            const user_id = payment.user;
            const user = await User.findById(user_id);

            let startDate = new Date();
            if (user.premium_until) {
                const currentUntil = new Date(user.premium_until);
                const now = new Date();
                if (currentUntil > now) {
                    startDate = new Date(user.premium_until);
                }
            }

            let durationDays = 30; 
            if (payment.package) {
                const pkg = await PremiumPackage.findById(payment.package);
                if (pkg) durationDays = pkg.duration_days;
            }

            await Payment.findOneAndUpdate(
                { order_id: orderCode },
                { status: 'success' }
            );

            const premiumUntil = new Date(startDate);
            premiumUntil.setDate(premiumUntil.getDate() + durationDays);

            await User.findByIdAndUpdate(user_id, {
                is_premium: true,
                premium_since: user.premium_since || new Date(),
                premium_until: premiumUntil
            });

            await ActivityLog.create({
                admin: req.user ? req.user.id : null,
                action: "Tài khoản " + req.user.id + " đã hoàn thành giao dịch thanh toán (verify_return) với mã đơn hàng: " + orderCode
            });

            return res.json({ success: true, message: "Cập nhật trạng thái thành công" });
        } else {
            return res.json({ success: false, message: "Giao dịch chưa thành công" });
        }

    } catch (error) {
        console.error("Lỗi verify return:", error);
        res.status(500).json({ success: false });
    }
};
