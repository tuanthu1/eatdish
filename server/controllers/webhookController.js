const crypto = require("crypto");
const Payment = require("../models/Payment");
const User = require("../models/UserModel");
const PremiumPackage = require("../models/PremiumPackage");

exports.handleWebhook = async (req, res) => {
    try {
        const body = req.body;
        // Trường hợp PayOS Test Connection ( data null hoặc rỗng)
        if (!body || !body.data) {
            console.log("✅ PayOS Test Connection OK");
            return res.json({ success: true });
        }

        const { data, signature } = body;
        const { amount, description, orderCode, status } = data;

        // Tạo chữ ký để kiểm tra 
        const rawSignature = `amount=${amount}&description=${description}&orderCode=${orderCode}&status=${status}`;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.PAYOS_CHECKSUM_KEY)
            .update(rawSignature)
            .digest("hex");

        if (expectedSignature !== signature) {
            console.error("LỖI: Chữ ký không khớp!");
            console.log("   - Chữ ký nhận được:", signature);
            console.log("   - Chữ ký tính toán:", expectedSignature);
            console.log("   - Raw String:", rawSignature);
            console.log("   - Checksum Key:", process.env.PAYOS_CHECKSUM_KEY ? "Đã có" : "CHƯA CÓ!");
            return res.json({ success: true });
        }

        // Nếu thanh toán thành công
        if (body.code == "00" || status === "PAID" || status === "success") {
            console.log(`✅ Đang xử lý đơn hàng: ${orderCode}`);

            const payment = await Payment.findOne({ order_id: orderCode });
            if (!payment) {
                console.log(`Không tìm thấy payment cho đơn ${orderCode}`);
                return res.json({ success: true });
            }

            if (payment.status === 'paid') {
                console.log(`Đơn ${orderCode} đã được xử lý trước đó`);
                return res.json({ success: true });
            }

            // Cập nhật trạng thái thanh toán
            await Payment.findOneAndUpdate(
                { order_id: orderCode },
                { status: 'paid' }
            );

            // Kích hoạt Premium cho User
            if (payment && payment.user) {
                const user = await User.findById(payment.user);
                const pkg = payment.package ? await PremiumPackage.findById(payment.package) : null;
                const durationDays = pkg?.duration_days || 30;

                const now = new Date();
                const currentPremiumUntil = user?.premium_until ? new Date(user.premium_until) : null;
                const startDate = currentPremiumUntil && currentPremiumUntil > now ? currentPremiumUntil : now;
                const premiumUntil = new Date(startDate);
                premiumUntil.setDate(premiumUntil.getDate() + durationDays);
                
                await User.findByIdAndUpdate(payment.user, {
                    is_premium: true,
                    premium_since: user?.is_premium && user?.premium_since ? user.premium_since : now,
                    premium_until: premiumUntil
                });
            }

            console.log(`🎉 User (Đơn ${orderCode}) đã lên Premium thành công!`);
        } else {
            await Payment.findOneAndUpdate(
                { order_id: orderCode, status: 'pending' },
                { status: 'failed' }
            );
        }

        return res.json({ success: true });

    } catch (error) {
        console.error("❌ Lỗi Webhook:", error);
        res.status(500).json({ success: false });
    }
};