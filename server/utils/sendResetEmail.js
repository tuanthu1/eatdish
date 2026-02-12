const nodemailer = require('nodemailer');

const sendResetEmail = async (email, resetUrl) => {
    try {
        // Cấu hình
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER, 
                pass: process.env.MAIL_PASS  
            }
        });

        // Nội dung Email 
        const mailOptions = {
            from: '"EatDish Support" <no-reply@eatdish.com>',
            to: email,
            subject: ' Yêu cầu đặt lại mật khẩu - EatDish',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #ff9f1c; text-align: center;">Yêu Cầu Đặt Lại Mật Khẩu</h2>
                    
                    <p>Xin chào,</p>
                    <p>Chúng tôi vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản EatDish của bạn.</p>
                    <p>Để tiếp tục, vui lòng nhấn vào nút bên dưới:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #ff9f1c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                            Đặt Lại Mật Khẩu
                        </a>
                    </div>

                    <p style="color: #555;">Hoặc copy đường dẫn này vào trình duyệt:</p>
                    <p style="color: #0984e3; word-break: break-all;">${resetUrl}</p>

                    <p>⚠️ <strong>Lưu ý:</strong> Link này sẽ hết hạn sau 1 giờ.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #888; font-size: 12px; text-align: center;">Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này.</p>
                </div>
            `
        };

        // Gửi mail
        await transporter.sendMail(mailOptions);
        console.log(`Đã gửi mail reset password tới: ${email}`);

    } catch (error) {
        console.error("Lỗi gửi mail reset:", error);
        throw new Error("Không thể gửi email xác nhận.");
    }
};

module.exports = sendResetEmail;