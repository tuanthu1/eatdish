
const User = require('../models/UserModel');
const Recipe = require('../models/RecipeModel');
const ActivityLog = require('../models/ActivityLogModel');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
exports.processAdminCommand = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ message: "Vui lòng nhập lệnh!" });

        const systemPrompt = `
            Bạn là Trợ lý AI Quản trị tối cao của hệ thống EatDish.
            Nhiệm vụ của bạn là phân tích câu lệnh của Admin và trả về CHỈ MỘT CỤC JSON DUY NHẤT để hệ thống thực thi. 
            Tuyệt đối không giải thích, không thêm văn bản thừa.

            Các hành động (action) hệ thống hỗ trợ:
            1. "DELETE_SPAM_RECIPE": Xóa các công thức nấu ăn chứa từ khóa spam. (Tham số: keyword)
            2. "BAN_USER": Khóa tài khoản người dùng. (Tham số: email_hoac_username).
            3. "CLEAR_LOGS": Xóa lịch sử hoạt động cũ. (Tham số: days_ago)
            4. "GET_STATS": Lấy thống kê hệ thống. (Tham số: null)
            5. "CHAT_NORMAL": Trả lời bình thường nếu admin chỉ muốn trò chuyện hoặc hỏi han. (Tham số: reply_text)
            6. "SEARCH_USERS": Tìm kiếm và liệt kê người dùng theo tên hoặc username. (Tham số: keyword).
            7. "SEARCH_RECIPES": Tìm kiếm và liệt kê công thức theo tên hoặc thành phần. (Tham số: keyword).
            8. "GET_USER_INFO": Lấy thông tin chi tiết của một người dùng. (Tham số: email_hoac_username).
            9. "GET_RECIPE_INFO": Lấy thông tin chi tiết của một công thức nấu ăn. (Tham số: recipe_id).
            10. "UPDATE_USER_ROLE": Cập nhật vai trò của người dùng (user, chef, admin). (Tham số: email_hoac_username, new_role).
            11. "GET_FEEDBACKS": Lấy danh sách phản hồi từ người dùng. (Tham số: null)
            12. "DELETE_FEEDBACK": Xóa một phản hồi cụ thể. (Tham số: feedback_id)
            13. "GET_LOGS": Lấy nhật ký hoạt động của hệ thống. (Tham số: null)
            14. "RESTART_SERVER": Khởi động lại server để áp dụng các thay đổi hoặc fix lỗi tạm thời. (Tham số: null) - CẢNH BÁO: HÀNH ĐỘNG NÀY SẼ GIÁN ĐOẠN DỊCH VỤ TRONG VÀI GIÂY, CHỈ DÙNG KHI THẬT SỰ CẦN THIẾT!
            15. "CHAT_NORMAL": Dùng khi Admin hỏi kiến thức bình thường, chào hỏi, hoặc các yêu cầu không nằm trong các quyền quản trị ở trên. (Tham số: reply_text).
            16. "GET_USER_LIST": Lấy danh sách toàn bộ người dùng mới nhất trên hệ thống (Tham số: null).
            ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
            {
                "action": "TÊN_HÀNH_ĐỘNG",
                "params": { "key": "value" },
                "botReply": "Câu nói AI phản hồi lại cho Admin đọc trên giao diện"
            }

            Ví dụ 1: 
            User: "Xóa hết các bài viết chứa từ khóa 'cờ bạc' nhé"
            Bot: {"action": "DELETE_SPAM_RECIPE", "params": {"keyword": "cờ bạc"}, "botReply": "Đã nhận lệnh xóa các bài viết chứa từ khóa cờ bạc."}

            Ví dụ 2:
            User: "Chào em, hôm nay em khỏe không?"
            Bot: {"action": "CHAT_NORMAL", "params": {}, "botReply": "Dạ em là AI nên lúc nào cũng khỏe ạ! Sếp cần em giúp gì không?"}
        `;
        const aiResponseString = await callYourAI(systemPrompt, message); 
        
        let aiData;
        try {
            aiData = JSON.parse(aiResponseString); 
        } catch (e) {
            return res.json({ reply: "AI trả về sai định dạng, không thể thực thi." });
        }

        const { action, params, botReply } = aiData;
        let finalReply = botReply;
        switch (action) {
            case 'SEARCH_USERS':
                if (!params.keyword) {
                    finalReply = "Bạn chưa cung cấp từ khóa để tôi tìm kiếm!";
                    break;
                }

                // Chui vào Database, dùng $regex để tìm chuỗi chứa chữ cái đó (không phân biệt hoa thường)
                const users = await User.find({
                    $or: [
                        { username: { $regex: params.keyword, $options: 'i' } },
                        { fullname: { $regex: params.keyword, $options: 'i' } },
                        { email: { $regex: params.keyword, $options: 'i' } }
                    ]
                }).limit(10); // Lấy 10 người thôi cho đỡ lag khung chat

                if (users.length > 0) {
                    // Xếp danh sách cho đẹp
                    const userListString = users.map((u, index) => 
                        `${index + 1}. 👤 ${u.fullname || 'Chưa cập nhật'} (@${u.username}) - ✉️ ${u.email}`
                    ).join('\n');
                    
                    finalReply = ` Sếp đợi em tí... Dạ em tìm thấy ${users.length} người dùng có chứa chữ "${params.keyword}":\n\n${userListString}`;
                } else {
                    finalReply = ` Em đã lục tung Database nhưng không tìm thấy ai có chữ "${params.keyword}" cả sếp ạ!`;
                }
                break;
            case 'GET_USER_LIST':
                const allUsers = await User.find().sort({ createdAt: -1 }).limit(10); // Lấy 10 người mới nhất
                
                if (allUsers.length > 0) {
                    const listString = allUsers.map((u, index) => 
                        `${index + 1}. 👤 ${u.fullname || 'Chưa cập nhật'} (@${u.username}) - ✉️ ${u.email}`
                    ).join('\n');
                    finalReply = `📋 Dạ đây là danh sách 10 người dùng mới nhất trên hệ thống sếp nhé:\n\n${listString}`;
                } else {
                    finalReply = `❌ Hiện tại hệ thống chưa có người dùng nào đăng ký cả!`;
                }
                break;
            case 'DELETE_SPAM_RECIPE':
                // const deleted = await Recipe.deleteMany({ title: { $regex: params.keyword, $options: 'i' } });
                finalReply += `\n Hệ thống báo cáo: Đã xóa thành công bài viết chứa từ '${params.keyword}'.`;
                break;

            case 'BAN_USER':
                // const user = await User.findOneAndUpdate({ username: params.email_hoac_username }, { status: 'banned' });
                finalReply += `\n Đã khóa tài khoản ${params.email_hoac_username}.`;
                break;

            case 'CLEAR_LOGS':
                // Logic xóa log
                finalReply += `\n🧹 Đã dọn dẹp nhật ký hệ thống.`;
                break;

            case 'GET_STATS':
                const userCount = await User.countDocuments();
                finalReply += `\n Hiện tại hệ thống đang có ${userCount} người dùng đăng ký.`;
                break;

            case 'CHAT_NORMAL':
                finalReply = botReply || params?.reply_text || params?.reply || "Dạ em là AI Groq đây, sếp gọi em có việc gì không ạ?";
                break;
            case 'SEARCH_RECIPES':
                const recipes = await Recipe.find({
                    $or: [
                        { title: { $regex: params.keyword, $options: 'i' } },
                        { ingredients: { $regex: params.keyword, $options: 'i' } }
                    ]
                    }).limit(10);
                    if (recipes.length > 0) {
                        const recipeListString = recipes.map((r, index) => 
                            `${index + 1}. 🍲 ${r.title} (ID: ${r._id})`
                        ).join('\n');
                        finalReply = ` Sếp đợi em tí... Dạ em tìm thấy ${recipes.length} công thức có chứa chữ "${params.keyword}":\n\n${recipeListString}`;
                    } else {
                        finalReply = ` Em đã lục tung Database nhưng không tìm thấy công thức nào có chữ "${params.keyword}" cả sếp ạ!`;
                    }
                    break;
                case 'GET_USER_INFO':
                    const userInfo = await User.findOne({
                        $or: [
                            { username: params.email_hoac_username },
                            { email: params.email_hoac_username }
                        ]
                    });
                    if (userInfo) {
                        finalReply = `Thông tin người dùng:\n👤 Họ tên: ${userInfo.fullname || 'Chưa cập nhật'}\n👤 Username: @${userInfo.username}\n👤 Email: ${userInfo.email}\n👤 Vai trò: ${userInfo.role}\n👤 Trạng thái: ${userInfo.status}`;
                    } else {
                        finalReply = `Không tìm thấy người dùng với thông tin "${params.email_hoac_username}".`;
                    }
                    break;
                case 'GET_RECIPE_INFO':
                    const recipeInfo = await Recipe.findById(params.recipe_id);
                    if (recipeInfo) {
                        finalReply = `Thông tin công thức:\n🍲 Tên: ${recipeInfo.title}\n🍲 Thành phần: ${recipeInfo.ingredients}\n🍲 Hướng dẫn: ${recipeInfo.instructions}`;
                    } else {
                        finalReply = `Không tìm thấy công thức với ID "${params.recipe_id}".`;
                    }
                    break;
                case 'UPDATE_USER_ROLE':
                    const updatedUser = await User.findOneAndUpdate(
                        { 
                            $or: [
                                { username: params.email_hoac_username },
                                { email: params.email_hoac_username }
                            ]
                        },
                        { role: params.new_role },
                        { new: true }
                    );
                    if (updatedUser) {
                        finalReply = `Đã cập nhật vai trò của người dùng "${params.email_hoac_username}" thành "${params.new_role}".`;
                    } else {
                        finalReply = `Không tìm thấy người dùng với thông tin "${params.email_hoac_username}".`;
                    }
                    break;
                case 'GET_FEEDBACKS':
                    // Logic lấy feedback
                    finalReply += `\n Dưới đây là danh sách phản hồi từ người dùng...`;
                    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).limit(10);
                    if (feedbacks.length > 0) {
                        const feedbackListString = feedbacks.map((f, index) =>
                            `${index + 1}. 📝 ${f.content} (ID: ${f._id})`
                        ).join('\n');
                        finalReply += `\n${feedbackListString}`;
                    } else {
                        finalReply += `\nKhông có phản hồi nào để hiển thị.`;
                    }
                    break;
                case 'DELETE_FEEDBACK':
                    // Logic xóa feedback
                    finalReply += `\n Đã xóa phản hồi có ID "${params.feedback_id}".`;
                    const deletedFeedback = await Feedback.findByIdAndDelete(params.feedback_id);
                    if (!deletedFeedback) {
                        finalReply += `\nKhông tìm thấy phản hồi với ID "${params.feedback_id}".`;
                    }
                    break;
                case 'GET_LOGS':
                    // Logic lấy logs
                    finalReply += `\n Dưới đây là nhật ký hoạt động của hệ thống...`;
                    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(10);
                    if (logs.length > 0) {
                        const logListString = logs.map((l, index) =>
                            `${index + 1}. 📜 ${l.action} (Thời gian: ${l.createdAt.toLocaleString()})`
                        ).join('\n');
                        finalReply += `\n${logListString}`;
                    } else {
                        finalReply += `\nKhông có nhật ký nào để hiển thị.`;
                    }
                    break;
                case 'RESTART_SERVER':
                    // CẢNH BÁO: HÀNH ĐỘNG NÀY SẼ GIÁN ĐOẠN DỊCH VỤ TRONG VÀI GIÂY, CHỈ DÙNG KHI THẬT SỰ CẦN THIẾT!
                    finalReply += `\nĐang khởi động lại server... Hệ thống sẽ trở lại sau vài giây!`;
                    // Logic khởi động lại server (ví dụ: gọi một script bên ngoài hoặc sử dụng PM2)
                    const { exec } = require('child_process');
                    exec('pm2 restart eatdish-server', (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Lỗi khi khởi động lại server: ${error.message}`);
                            return;
                        }
                        if (stderr) {
                            console.error(`Lỗi khi khởi động lại server: ${stderr}`);
                            return;
                        }
                        console.log(`Server khởi động lại thành công: ${stdout}`);
                    });
                    break;
                case 'BAN_USER':
                // 🛑 Mở comment và code thật vào đây:
                const bannedUser = await User.findOneAndUpdate(
                    { 
                        $or: [
                            { username: params.email_hoac_username },
                            { email: params.email_hoac_username }
                        ]
                    }, 
                    { is_verified: false }, // Hoặc status: 'banned' tùy Database của mày
                    { new: true }
                );

                if (bannedUser) {
                    finalReply = `Đã khóa thành công tài khoản ${params.email_hoac_username}.`;
                } else {
                    finalReply = `Không tìm thấy user nào tên là ${params.email_hoac_username} để khóa!`;
                }
                break;
                default:
                    finalReply += `\nHệ thống chưa hỗ trợ hành động: ${action}`;
        }

        if (action !== 'CHAT_NORMAL') {
            await ActivityLog.create({
                username: "Groq_AI_Bot",
                action: `Thực thi lệnh tự động: ${action}`
            });
        }

        // Trả kết quả cuối cùng về cho Giao diện Chat
        res.status(200).json({ reply: finalReply });

    } catch (error) {
        res.status(500).json({ message: "Lỗi server: " + error.message });
    }
};

async function callYourAI(systemPrompt, userMessage) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            // Dùng model Llama3 vì nó parse JSON cực kỳ thông minh và nhanh
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant', 
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        // Lấy cục text JSON mà con AI nhả ra
        const aiOutput = chatCompletion.choices[0]?.message?.content || "{}";
        return aiOutput;
        
    } catch (error) {
        console.error("Lỗi gọi Groq AI:", error);
        return JSON.stringify({ 
            action: "CHAT_NORMAL", 
            params: {}, 
            botReply: "Hệ thống AI Groq đang bận hoặc hết hạn ngạch. Vui lòng thử lại sau!" 
        });
    }
}