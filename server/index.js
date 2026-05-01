const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');
// 1. IMPORT HÀM KẾT NỐI MONGODB
const connectDB = require('./config/db'); 

const app = express();
const PORT = process.env.PORT || 5000;

// 2. KÍCH HOẠT KẾT NỐI DATABASE NGAY KHI KHỞI ĐỘNG
connectDB();

// Import các Routes từ thư mục routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const communityRoutes = require('./routes/communityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const chatRoutes = require('./routes/chatRoutes');
const paymentRouter = require('./routes/paymentRouter');
const webhookRoutes = require('./routes/webhookRoutes');
const packageRoutes = require('./routes/premiumRouter');
const settingRoutes = require('./routes/settingRouter');
const adminChatRoutes = require('./routes/adminChatRoutes');
// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://localhost:5173', 
        process.env.DOMAIN 
    ].filter(Boolean), // Cho phép tất cả các cổng này vào
    credentials: true // BẮT BUỘC ĐỂ TRUYỀN COOKIE
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});

// Định tuyến API
app.use('/api/auth', authRoutes);         
app.use('/api/users', userRoutes);       
app.use('/api/recipes', recipeRoutes);   
app.use('/api/notifications', notificationRoutes);
app.use('/api/community', communityRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', packageRoutes);
app.use('/api/payment', paymentRouter);
app.use('/api/webhook', webhookRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/admin/chat', adminChatRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error("❌ Lỗi Server:", err);
    res.status(500).json({ 
        message: "Lỗi Server",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ message: "API endpoint không tồn tại" });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên cổng ${PORT}`);
    console.log(`📦 Database: MongoDB`);
    console.log(`🌐 ENV: ${process.env.NODE_ENV || 'development'}`);
});