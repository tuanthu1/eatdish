const axios = require("axios");
const crypto = require("crypto");
const db = require("../config/db");

const PAYOS_API = "https://api-merchant.payos.vn/v2/payment-requests";

// KIỂM TRA MÃ GIẢM GIÁ 
exports.checkCoupon = async (req, res) => {
    const { code } = req.body;
    try {
        const [rows] = await db.query(
            "SELECT * FROM discount_codes WHERE code = ? AND is_active = 1 AND (expiry_date >= CURDATE() OR expiry_date IS NULL)", 
            [code]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Mã không hợp lệ hoặc đã hết hạn" });
        }

        res.json({ 
            success: true, 
            percent: rows[0].percent, 
            code: rows[0].code,
            message: `Áp dụng mã ${rows[0].code} thành công! Giảm ${rows[0].percent}%` 
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

        // A. Lấy giá gốc
        if (packageId) {
            const [pkg] = await db.query("SELECT * FROM premium_packages WHERE id = ?", [packageId]);
            if (pkg.length > 0) {
                amount = Number(pkg[0].price); // Đảm bảo là số
                packageName = pkg[0].name;
            }
        }

        // B. Tính giảm giá
        let description = `EATDISH ${packageName}`;
        if (discountCode) {
            const [codeRows] = await db.query(
                "SELECT * FROM discount_codes WHERE code = ? AND is_active = 1 AND (expiry_date >= CURDATE() OR expiry_date IS NULL)", 
                [discountCode]
            );
            
            if (codeRows.length > 0) {
                const percent = codeRows[0].percent;
                const discountAmount = (amount * percent) / 100;
                amount = Math.round(amount - discountAmount);
                description += ` KM ${discountCode}`;
            }
        }

        // --- C. XỬ LÝ ĐẶC BIỆT: NẾU GIÁ <= 0 (MIỄN PHÍ) ---
        if (amount <= 0) {
            // 1. Lưu lịch sử thanh toán (0đ)
            await db.query(
                "INSERT INTO payments (order_id, user_id, amount, status, created_at) VALUES (?, ?, 0, 'success', NOW())",
                [orderCode, userId]
            );
            // 2. Kích hoạt VIP luôn
            await db.query("UPDATE users SET is_premium = 1, premium_since = NOW() WHERE id = ?", [userId]);

            // 3. Trả về flag 'free' để frontend biết
            return res.json({ free: true, message: "Kích hoạt Premium thành công!" });
        }

        // --- D. XỬ LÝ ĐẶC BIỆT: PayOS yêu cầu tối thiểu 2000đ ---
        if (amount < 2000) amount = 2000;

        // E. Tạo link PayOS (như cũ)
        description = `${orderCode} VIP`.substring(0, 25);
        const data = {
            orderCode,
            amount,
            description,
            returnUrl: `${process.env.DOMAIN}/premium-success`,
            cancelUrl: `${process.env.DOMAIN}/premium-cancel`,
        };

        const rawSignature = `amount=${data.amount}&cancelUrl=${data.cancelUrl}&description=${data.description}&orderCode=${data.orderCode}&returnUrl=${data.returnUrl}`;
        const signature = crypto.createHmac("sha256", process.env.PAYOS_CHECKSUM_KEY).update(rawSignature).digest("hex");

        const response = await axios.post(
            PAYOS_API,
            { ...data, signature },
            { headers: { "Content-Type": "application/json", "x-client-id": process.env.PAYOS_CLIENT_ID, "x-api-key": process.env.PAYOS_API_KEY } }
        );

        if (response.data.code == "00") {
            await db.query(
                "INSERT INTO payments (order_id, user_id, amount, status, created_at) VALUES (?, ?, ?, 'pending', NOW())",
                [orderCode, userId, amount]
            );
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
        const { data, code } = req.body;
        const body = req.body; 

        if (!data) {
            console.log("PayOS Webhook Test Connection");
            return res.json({ success: true });
        }

        const rawSignature = `amount=${data.amount}&description=${data.description}&orderCode=${data.orderCode}&status=${data.status}`;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.PAYOS_CHECKSUM_KEY)
            .update(rawSignature)
            .digest("hex");

        if (expectedSignature !== body.signature) {
            console.error("⚠️ Chữ ký Webhook không khớp! Có thể là giả mạo.");
            return res.json({ success: true }); 
        }

        const isPaid = code === "00" || data.status === "PAID";

        if (isPaid) {
            const orderCode = data.orderCode;
            console.log(`✅ Thanh toán thành công đơn hàng: ${orderCode}`);

            await db.query(
                "UPDATE payments SET status = 'success' WHERE order_id = ?",
                [orderCode]
            );

            await db.query(
                `UPDATE users 
                 SET is_premium = 1, premium_since = NOW() 
                 WHERE id = (SELECT user_id FROM payments WHERE order_id = ?)`,
                [orderCode]
            );
        }

        return res.json({ success: true });
    } catch (error) {
        console.error("Lỗi Webhook:", error);
        res.status(500).json({ success: false });
    }
};