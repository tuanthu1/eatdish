const crypto = require("crypto");
const db = require("../config/db");

exports.handleWebhook = async (req, res) => {
    try {
        const body = req.body;

        // 1. Log dữ liệu nhận được để debug
        console.log("👉 Webhook Data Received:", JSON.stringify(body, null, 2));

        // Trường hợp PayOS Test Connection (thường data sẽ null hoặc rỗng)
        if (!body || !body.data) {
            console.log("✅ PayOS Test Connection OK");
            return res.json({ success: true });
        }

        const { data, signature } = body;
        const { amount, description, orderCode, status } = data;

        // 2. Tạo chữ ký để kiểm tra (Theo quy tắc của PayOS: amount -> description -> orderCode -> status)
        // Lưu ý: Các tham số phải sắp xếp theo bảng chữ cái
        const rawSignature = `amount=${amount}&description=${description}&orderCode=${orderCode}&status=${status}`;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.PAYOS_CHECKSUM_KEY)
            .update(rawSignature)
            .digest("hex");

        // 3. So sánh chữ ký
        if (expectedSignature !== signature) {
            console.error("⚠️ LỖI: Chữ ký không khớp!");
            console.log("   - Chữ ký nhận được:", signature);
            console.log("   - Chữ ký tính toán:", expectedSignature);
            console.log("   - Raw String:", rawSignature);
            console.log("   - Checksum Key:", process.env.PAYOS_CHECKSUM_KEY ? "Đã có (Check lại xem đúng chưa)" : "CHƯA CÓ!");
            
            // Vẫn return true để PayOS không gửi lại spam, nhưng log lỗi để mình sửa
            return res.json({ success: true });
        }

        // 4. Nếu thanh toán thành công (code == "00" hoặc status == "PAID")
        if (body.code == "00" || status === "PAID") {
            console.log(`✅ Đang xử lý đơn hàng: ${orderCode}`);

            // A. Cập nhật bảng payments
            await db.query(
                "UPDATE payments SET status = 'success' WHERE order_id = ?",
                [orderCode]
            );

            // B. Kích hoạt Premium cho User
            await db.query(
                `UPDATE users 
                 SET is_premium = 1, premium_since = NOW() 
                 WHERE id = (SELECT user_id FROM payments WHERE order_id = ?)`,
                [orderCode]
            );

            console.log(`🎉 User (Đơn ${orderCode}) đã lên Premium thành công!`);
        }

        return res.json({ success: true });

    } catch (error) {
        console.error("❌ Lỗi Webhook:", error);
        res.status(500).json({ success: false });
    }
};