const mongoose = require('mongoose');
require('dotenv').config();

// Fail fast when DB is not connected instead of buffering queries for 10s.
mongoose.set('bufferCommands', false);

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        
        if (!uri) {
            throw new Error("Chưa cấu hình MONGO_URI trong file .env");
        }

        // Kết nối vào MongoDB với timeout rõ ràng để debug dễ hơn
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            maxPoolSize: 10
        });

        console.log("🟢 Đã kết nối MongoDB (EatDish_DB) thành công!");
    } catch (error) {
        console.error("🔴 Lỗi kết nối MongoDB:", error.message);

        if (String(error.message).includes('IP that isn\'t whitelisted')) {
            console.error('👉 Hãy thêm IP hiện tại vào Atlas Network Access hoặc tạm mở 0.0.0.0/0 để test local.');
        }

        if (String(error.message).includes('bad auth') || String(error.message).includes('Authentication failed')) {
            console.error('👉 Kiểm tra lại username/password trong MONGO_URI và quyền user trên Atlas.');
        }

        process.exit(1);
    }
};

module.exports = connectDB;