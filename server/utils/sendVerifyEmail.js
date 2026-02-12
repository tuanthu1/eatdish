const nodemailer = require('nodemailer');

module.exports = async (email, name, token) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await transporter.sendMail({
        from: '"EatDish" <no-reply@eatdish.com>',
        to: email,
        subject: 'Xác minh email',
        html: `
            <h2>Xin chào ${name || 'Người dùng'}</h2>
            <p>Tôi nhận thấy bạn đang đăng kí tài khoản tại EatDish tương ứng với email của bạn, cảm ơn bạn đã đăng ký!</p>
            <p>Vui lòng vào link bên dưới để xác minh tài khoản:</p>
            <a href="${verifyUrl}">${verifyUrl}</a>
            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
            <br/>
            <p>Trân trọng,</p>
            <p>Đội ngũ EatDish</p>
        `
    });
};
