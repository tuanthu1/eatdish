const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Import các Routes từ thư mục routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const communityRoutes = require('./routes/communityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const path = require('path');
const chatRoutes = require('./routes/chatRoutes');
const paymentRouter = require('./routes/paymentRouter');
const webhookRoutes = require('./routes/webhookRoutes');
const packageRoutes = require('./routes/premiumRouter');
// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);         
app.use('/api/users', userRoutes);       
app.use('/api/recipes', recipeRoutes);   
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/community', communityRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', packageRoutes);
app.use('/api/payment', paymentRouter);
app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/webhook', webhookRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});