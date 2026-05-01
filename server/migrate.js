require('dotenv').config();
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');

// Import Models của nhà mới
const User = require('./models/UserModel');
const Recipe = require('./models/RecipeModel');

async function runMigration() {
    console.log("🚀 BẮT ĐẦU QUÁ TRÌNH CHUYỂN NHÀ TỪ MYSQL SANG MONGODB...");

    let mysqlConn;
    try {
        // 1. KẾT NỐI CẢ 2 DATABASE
        mysqlConn = await mysql.createConnection({
            host: process.env.DB_HOST, user: process.env.DB_USER,
            password: process.env.DB_PASS, database: process.env.DB_NAME
        });
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🟢 Đã kết nối thành công 2 Database!");

        // (Tùy chọn) Xóa sạch data cũ bên Mongo trước khi bơm vào để khỏi trùng lặp
        await User.deleteMany({});
        await Recipe.deleteMany({});

        // --- BẮT ĐẦU CHUYỂN BẢNG USERS ---
        console.log("📦 Đang chuyển dữ liệu Users...");
        const [oldUsers] = await mysqlConn.query("SELECT * FROM users");
        
        // Tạo một cái từ điển để nhớ: ID_MySQL_Cũ -> ID_Mongo_Mới
        const idMap = {}; 

        for (const oldUser of oldUsers) {
            const newUser = await User.create({
                // Thêm fallback (||) đề phòng MySQL bị NULL
                username: oldUser.username || `user_${oldUser.id}`, 
                email: oldUser.email || `no-email-${oldUser.id}@eatdish.com`, // Bơm email giả nếu thiếu
                password: oldUser.password || '123456', 
                fullname: oldUser.fullname || 'Thành viên EatDish',
                avatar: oldUser.avatar,
                role: oldUser.role || 'user',
                is_premium: oldUser.is_premium === 1,
                is_verified: oldUser.is_verified === 1,
                createdAt: oldUser.created_at
            });
            // Lưu vào từ điển
            idMap[oldUser.id] = newUser._id; 
        }
        console.log(`✅ Đã chuyển xong ${oldUsers.length} Users!`);

        // --- BẮT ĐẦU CHUYỂN BẢNG RECIPES ---
        console.log("📦 Đang chuyển dữ liệu Recipes...");
        const [oldRecipes] = await mysqlConn.query("SELECT * FROM recipes");

        let recipeCount = 0;
        for (const oldRecipe of oldRecipes) {
            // Ép chuỗi JSON cũ thành Array mới cho Mongoose
            let ingredientsArr = [];
            let stepsArr = [];
            try {
                ingredientsArr = JSON.parse(oldRecipe.ingredients || "[]");
                stepsArr = JSON.parse(oldRecipe.steps || "[]");
            } catch (e) { console.log("Lỗi parse JSON ở món:", oldRecipe.name); }

            // Lấy ID mới của thằng tác giả từ cái từ điển idMap
            const newAuthorId = idMap[oldRecipe.author_id];

            if (newAuthorId) {
                await Recipe.create({
                    name: oldRecipe.name,
                    description: oldRecipe.description,
                    calories: oldRecipe.calories,
                    time: oldRecipe.time,
                    img: oldRecipe.img,
                    video_url: oldRecipe.video_url,
                    ingredients: ingredientsArr,
                    steps: stepsArr,
                    author: newAuthorId, // Nhét ID mới vào đây
                    is_premium: oldRecipe.is_premium === 1,
                    createdAt: oldRecipe.created_at
                });
                recipeCount++;
            }
        }
        console.log(`✅ Đã chuyển xong ${recipeCount} Món ăn!`);

        // --- MÀY CÓ THỂ VIẾT TIẾP CHO BẢNG POSTS, REVIEWS Ở ĐÂY ---
        // Cách làm y hệt: Select -> Vòng lặp -> Đổi ID qua idMap -> Create

        console.log("🎉 HOÀN TẤT CHUYỂN NHÀ!");

    } catch (error) {
        console.error("❌ CÓ LỖI XẢY RA:", error);
    } finally {
        if (mysqlConn) await mysqlConn.end();
        await mongoose.disconnect();
        process.exit(0); // Tắt script
    }
}

runMigration();