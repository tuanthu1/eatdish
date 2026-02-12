const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Kiểm tra kết nối
db.getConnection((err, conn) => {
    if (err) console.error("Lỗi kết nối Database:", err);
    else {
        console.log("Đã kết nối Database thành công!");
        conn.release();
    }
});

module.exports = db.promise(); 