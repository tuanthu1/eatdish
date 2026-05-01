const User = require('../models/UserModel');
const Recipe = require('../models/RecipeModel');
const CommunityPost = require('../models/CommunityPost');
const ActivityLog = require('../models/ActivityLogModel');
const SiteSetting = require('../models/SiteSetting');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const DEFAULT_CHAT_CATEGORIES = [
    { value: 'Mon_chinh', label: 'Món chính' },
    { value: 'Mon_phu', label: 'Món phụ' },
    { value: 'Mon_chay', label: 'Món chay' },
    { value: 'Mon_nuoc', label: 'Món nước / Canh' },
    { value: 'Trang_mieng', label: 'Tráng miệng' },
    { value: 'Do_uong', label: 'Đồ uống' },
    { value: 'Khac', label: 'Khác' }
];

const normalizeViText = (input = '') => String(input)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const findCategoryValue = (rawCategory, categories = []) => {
    const normalizedInput = normalizeViText(rawCategory);
    if (!normalizedInput) return null;

    const categoryMatch = categories.find((cat) => {
        const valueText = normalizeViText(cat.value);
        const labelText = normalizeViText(cat.label);
        return normalizedInput === valueText || normalizedInput === labelText;
    });

    if (categoryMatch) return categoryMatch.value;

    const containsMatch = categories.find((cat) => {
        const valueText = normalizeViText(cat.value);
        const labelText = normalizeViText(cat.label);
        return normalizedInput.includes(valueText) || normalizedInput.includes(labelText);
    });

    return containsMatch ? containsMatch.value : null;
};

const extractCategoryFromMessage = (message, categories = []) => {
    const normalizedMessage = normalizeViText(message);
    if (!normalizedMessage) return null;

    const categoryMatch = categories.find((cat) => {
        const valueText = normalizeViText(cat.value);
        const labelText = normalizeViText(cat.label);
        return normalizedMessage.includes(valueText) || normalizedMessage.includes(labelText);
    });

    return categoryMatch ? categoryMatch.value : null;
};

const getChatCategories = async () => {
    const setting = await SiteSetting.findOne({ key: 'recipe_classifications' }).select('value');
    const categories = setting?.value?.categories;

    if (!Array.isArray(categories) || categories.length === 0) {
        return DEFAULT_CHAT_CATEGORIES;
    }

    return categories
        .filter((item) => item && item.value && item.label)
        .map((item) => ({
            value: String(item.value).trim(),
            label: String(item.label).trim()
        }));
};
async function generateGroqJson(systemPrompt, userPrompt) {
    const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]
    });
    return completion.choices?.[0]?.message?.content || '{}';
}

async function generateGroqText(systemPrompt, userPrompt) {
    const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        temperature: 0.7,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]
    });
    return completion.choices?.[0]?.message?.content || '';
}
async function getCurrentTemperature(lat, lon, city, weatherApiKey, fallbackTemperature = 25) {
    if (weatherApiKey) {
        try {
            // Đã nâng cấp: Nếu có tọa độ thì ưu tiên tọa độ, không có mới dùng city
            const weatherUrl = (lat && lon) 
                ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`
                : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${weatherApiKey}&units=metric`;
            
            const weatherResponse = await fetch(weatherUrl);
            if (weatherResponse.ok) {
                const weatherData = await weatherResponse.json();
                const temp = weatherData?.main?.temp;
                if (typeof temp === 'number' && Number.isFinite(temp)) return temp;
            }
        } catch (weatherErr) {
            console.warn('Lỗi gọi OpenWeather:', weatherErr.message);
        }
    }

    // Fallback sang Open-Meteo
    try {
        let finalLat = lat;
        let finalLon = lon;
        
        // Nếu trình duyệt khách không cấp quyền GPS, đi tìm tọa độ dự phòng của city
        if (!finalLat || !finalLon) {
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
            const geoResponse = await fetch(geoUrl);
            const geoData = await geoResponse.json();
            const place = geoData?.results?.[0];
            if (!place) throw new Error('Không tìm thấy tọa độ thành phố');
            finalLat = place.latitude;
            finalLon = place.longitude;
        }

        const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${finalLat}&longitude=${finalLon}&current=temperature_2m`;
        const meteoResponse = await fetch(meteoUrl);
        if (meteoResponse.ok) {
            const meteoData = await meteoResponse.json();
            const temp = meteoData?.current?.temperature_2m;
            if (typeof temp === 'number' && Number.isFinite(temp)) return temp;
        }
    } catch (fallbackErr) {
        console.warn(`Lỗi fallback, dùng mặc định ${fallbackTemperature} độ.`, fallbackErr.message);
    }

    return fallbackTemperature;
}
exports.processChat = async (req, res) => {
    try {
        const { message, lat, lon } = req.body;
        
        const userId = req.user?.id; 
        if (!userId) {
            return res.status(401).json({ reply: "Vui lòng đăng nhập để trò chuyện với đầu bếp AI nhé! 👨‍🍳" });
        }
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ reply: "Không tìm thấy thông tin tài khoản." });
        const isAdmin = user.role === 'admin';
        // Lấy nhiệt độ từ API thời tiết; nếu lỗi ở bất kỳ bước nào thì giữ mặc định 25 độ.
        const weatherApiKey = process.env.WEATHER_API_KEY;
        const fallbackCity = "Hanoi"; // Dự phòng nếu khách không cho phép GPS
        const DEFAULT_TEMPERATURE = 25;
        const currentTemperature = await getCurrentTemperature(lat, lon, fallbackCity, weatherApiKey, DEFAULT_TEMPERATURE);
        // Kiểm tra nếu last_chat_date hôm nay thì dùng daily_chat_count, nếu không reset về 0
        const today = new Date().toDateString();
        const lastChatDate = user.last_chat_date ? new Date(user.last_chat_date).toDateString() : null;
        let currentCount = (lastChatDate === today) ? user.daily_chat_count : 0;
        const CHAT_LIMIT = isAdmin ? 9999 : (user.is_premium ? 50 : 5);
        
        const admin = await User.findOne({ role: 'admin' }) || { 
            _id: 1, fullname: "Admin EatDish", bio: ""
        };
        admin.fb = "https://facebook.com/tuanthu2911"; 
        admin.zalo = "https://zalo.me/0348181596";
        
        if (currentCount >= CHAT_LIMIT) {
            return res.status(200).json({ 
                reply: user.is_premium 
                    ? "Bạn đã dùng hết 50 lượt chat VIP hôm nay rồi. Hẹn gặp lại vào ngày mai nhé! 😴" 
                    : "Bạn đã hết 5 lượt chat miễn phí hôm nay. Nâng cấp Premium 👑 để chat thả ga, hoặc quay lại vào ngày mai nhé!"
            });
        }

        const parsePrompt = `
            Nhiệt độ hiện tại: ${Math.round(currentTemperature)}°C.
            Phân tích câu nói: "${message}"
            
            Quy tắc phân tích intent:
            - "search": Nếu người dùng muốn tìm món ăn cụ thể.
            - "weather_suggestion": RẤT QUAN TRỌNG. Nếu người dùng hỏi chung chung như "ăn gì đây", "hôm nay ăn gì", "tư vấn món"... HÃY TỰ ĐỘNG sinh ra mảng "keywords" chứa các món cực kỳ phù hợp với thời tiết ${Math.round(currentTemperature)}°C. 
               + VÍ DỤ: Nếu < 20°C (Lạnh), keywords = ["lẩu", "nướng", "kho", "cay", "nóng"]. 
               + VÍ DỤ: Nếu > 30°C (Nóng), keywords = ["canh", "gỏi", "salad", "luộc", "mát", "chè"].
                - Nếu người dùng hỏi theo danh mục (ví dụ: món chay, món nước, tráng miệng, đồ uống), phải điền field "category" theo mã gần đúng.
            - "admin_info": Nếu hỏi về Admin, người sáng lập.
            - "admin_moderation": Nếu yêu cầu kiểm duyệt hệ thống (xóa bài, khóa user).
            - "chat": Các câu chào hỏi bình thường.

            Trả về JSON định dạng sau (Không giải thích thêm):
            {
              "intent": "search" | "weather_suggestion" | "admin_moderation" | "admin_info" | "chat",
              "keywords": [],
              "category": string | null,
              "max_calo": number | null,
              "max_time": number | null,
              "moderation_action": "delete_posts" | "delete_recipes" | "lock_users" | "unlock_users" | "system_summary" | null,
              "moderation_target_keyword": string | null,
              "moderation_limit": number | null
            }
        `;

        const nluSystemPrompt = "Bạn là máy phân tích ngôn ngữ tự nhiên. Chỉ trả về JSON thuần túy.";
        const nluText = (await generateGroqJson(nluSystemPrompt, parsePrompt)).trim();
        const cleanedNluText = nluText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        
        let parsedData = { intent: 'chat', keywords: [], category: null, max_calo: null, max_time: null };
        try { parsedData = { ...parsedData, ...JSON.parse(cleanedNluText) }; } 
        catch (parseErr) { console.warn('NLU parse lỗi:', parseErr.message); }

        const categoryOptions = await getChatCategories();
        const categoryFromModel = findCategoryValue(parsedData.category, categoryOptions);
        const categoryFromMessage = extractCategoryFromMessage(message, categoryOptions);
        const requestedCategory = categoryFromModel || categoryFromMessage;

        if (parsedData.intent === 'admin_moderation') {
            if (!isAdmin) {
                return res.status(403).json({
                    reply: 'Tính năng kiểm duyệt chỉ dành cho tài khoản Admin. Vui lòng liên hệ quản trị viên. 🔐'
                });
            }

            const action = parsedData.moderation_action;
            const keyword = (parsedData.moderation_target_keyword || '').trim();
            const limit = Math.min(20, Math.max(1, Number(parsedData.moderation_limit) || 5));
            let moderationReply = '';

            if (action === 'delete_posts') {
                const query = keyword ? { content: { $regex: keyword, $options: 'i' } } : {};
                const posts = await CommunityPost.find(query).sort({ createdAt: -1 }).limit(limit).select('_id content user');

                if (!posts.length) {
                    moderationReply = `Không tìm thấy bài cộng đồng phù hợp để kiểm duyệt với từ khóa "${keyword || 'mặc định'}".`;
                } else {
                    const ids = posts.map(p => p._id);
                    await CommunityPost.deleteMany({ _id: { $in: ids } });
                    moderationReply = `Đã kiểm duyệt và xóa ${ids.length} bài viết cộng đồng${keyword ? ` theo từ khóa "${keyword}"` : ''}.`;
                }
            } else if (action === 'delete_recipes') {
                const query = keyword ? { name: { $regex: keyword, $options: 'i' } } : {};
                const recipes = await Recipe.find(query).sort({ createdAt: -1 }).limit(limit).select('_id name');

                if (!recipes.length) {
                    moderationReply = `Không tìm thấy công thức phù hợp để kiểm duyệt với từ khóa "${keyword || 'mặc định'}".`;
                } else {
                    const ids = recipes.map(r => r._id);
                    await Recipe.deleteMany({ _id: { $in: ids } });
                    moderationReply = `Đã kiểm duyệt và xóa ${ids.length} công thức${keyword ? ` theo từ khóa "${keyword}"` : ''}.`;
                }
            } else if (action === 'lock_users' || action === 'unlock_users') {
                const userQuery = {
                    role: { $ne: 'admin' }
                };

                if (keyword) {
                    userQuery.$or = [
                        { email: { $regex: keyword, $options: 'i' } },
                        { username: { $regex: keyword, $options: 'i' } },
                        { fullname: { $regex: keyword, $options: 'i' } }
                    ];
                }

                const users = await User.find(userQuery).sort({ createdAt: -1 }).limit(limit).select('_id email username fullname is_verified');
                if (!users.length) {
                    moderationReply = `Không tìm thấy user phù hợp để ${action === 'lock_users' ? 'khóa' : 'mở khóa'}${keyword ? ` với từ khóa "${keyword}"` : ''}.`;
                } else {
                    const ids = users.map(u => u._id);
                    const newVerifyState = action === 'unlock_users';
                    await User.updateMany({ _id: { $in: ids } }, { is_verified: newVerifyState });
                    moderationReply = `Đã ${newVerifyState ? 'mở khóa' : 'khóa'} ${ids.length} tài khoản người dùng${keyword ? ` theo từ khóa "${keyword}"` : ''}.`;
                }
            } else {
                const [userCount, recipeCount, postCount] = await Promise.all([
                    User.countDocuments(),
                    Recipe.countDocuments(),
                    CommunityPost.countDocuments()
                ]);
                moderationReply = `Tổng quan hệ thống hiện tại: ${userCount} người dùng, ${recipeCount} công thức, ${postCount} bài cộng đồng.`;
            }

            await User.findByIdAndUpdate(userId, {
                daily_chat_count: currentCount + 1,
                last_chat_date: new Date()
            });

            await ActivityLog.create({
                admin: user._id,
                action: `Admin ${user.email} dùng chatbot kiểm duyệt: ${action || 'system_summary'}${keyword ? ` | keyword: ${keyword}` : ''}`
            });

            return res.json({ reply: `✅ ${moderationReply}` });
        }

        let finalRecipes = [];
        let isFallbackRandom = false;

        if (parsedData.intent !== 'chat' && parsedData.intent !== 'admin_info' && parsedData.intent !== 'admin_moderation') {
            let query = {};

            if (requestedCategory) {
                query.category = requestedCategory;
            }

            if (parsedData.keywords && parsedData.keywords.length > 0) {
                query.name = { $regex: parsedData.keywords.join('|'), $options: 'i' };
            }

            if (parsedData.max_calo) { query.calories = { $lte: parsedData.max_calo }; }
            if (parsedData.max_time) { query.time = { $lte: parsedData.max_time }; }

            finalRecipes = await Recipe.find(query).select('_id name calories time').limit(4);

            // Nếu DB không có món nào khớp keyword thời tiết, fallback về random
            if (finalRecipes.length === 0) {
                finalRecipes = await Recipe.find({}).select('_id name calories time').limit(3);
                isFallbackRandom = true; 
            }
        }

        const recipeListText = finalRecipes.length > 0 
            ? finalRecipes.map(r => `- [${r.name}](/recipe/${r._id}) (🔥 ${r.calories ? r.calories : 'Chưa rõ'} calo - ⏳ ${r.time ? r.time : 'Chưa rõ'} phút)`).join('\n')
            : "";

        // 5. PROMPT CHỐT HẠ - ÉP CÁCH NÓI CHUYỆN VÀ HỎI LẠI
        const replyPrompt = `
            Bạn là Bot EatDish - một đầu bếp AI xì tin, thân thiện và rất tâm lý. Bạn xưng "mình" và gọi người dùng là "bạn".
            Câu hỏi của khách: "${message}".

            THÔNG TIN NGỮ CẢNH BẮT BUỘC SỬ DỤNG:
            - Thời tiết hiện tại: ${Math.round(currentTemperature)}°C.

            KẾT QUẢ TÌM KIẾM TRONG HỆ THỐNG MÓN ĂN:
            ${recipeListText ? recipeListText : "Không tìm thấy món ăn cụ thể."}
            ${isFallbackRandom ? "(Đây là món ngẫu nhiên do không có món khớp hoàn toàn)" : ""}

            QUY TẮC PHẢN HỒI (TUÂN THỦ TUYỆT ĐỐI):
            1. ĐÚNG TRỌNG TÂM: Đi thẳng vào vấn đề. Nếu khách hỏi ăn gì, hãy gợi ý món luôn, không vòng vo.
            2. GẮN KẾT THỜI TIẾT: Bắt buộc nhắc đến nhiệt độ ${Math.round(currentTemperature)}°C để dẫn dắt món ăn. 
               - Ví dụ: "Trời hôm nay ${Math.round(currentTemperature)} độ hơi nóng, mình ăn salad là chuẩn bài nha..." 
            3. TRÌNH BÀY: Liệt kê món ăn bằng gạch đầu dòng Markdown, giữ nguyên định dạng link [Tên món](/recipe/id) để khách ấn vào được. Nói ngắn gọn 1 câu vì sao món đó ngon.
            4. TƯƠNG TÁC TỰ NHIÊN: Luôn kết thúc câu trả lời bằng MỘT CÂU HỎI MỞ để khách nói chuyện tiếp.
               - Ví dụ: "Tủ lạnh nhà bạn đang có sẵn nguyên liệu gì không?", "Bạn thích ăn nhanh hay muốn tốn chút thời gian nấu nướng trổ tài?", "Bạn thấy ưng món nào trong list trên chưa?".

            (Nếu khách hỏi về Admin, trả lời theo thông tin sau: Admin ${admin.fullname}, Facebook: [Facebook](${admin.fb}), Zalo: [Zalo](${admin.zalo})).
        `;
            
        const chatSystemPrompt = 'Bạn là Bot EatDish thân thiện, phản hồi bằng tiếng Việt chuẩn xác và tự nhiên.';
        const chatReply = await generateGroqText(chatSystemPrompt, replyPrompt);
        
        await User.findByIdAndUpdate(userId, {
            daily_chat_count: currentCount + 1,
            last_chat_date: new Date()
        });
        
        await ActivityLog.create({
            admin: user._id, // Log lưu id người gửi
            action: `Người dùng ${user.email} đã chat với AI. (Lượt: ${currentCount + 1})`
        });
        
        res.json({ reply: chatReply || 'Xin lỗi, bếp đang bận xíu, bạn gọi lại sau nhé 😅🍳' });

    } catch (err) {
        console.error("Chat Error:", err);
        res.status(500).json({ reply: "Xin lỗi, bếp đang bận xíu, bạn gọi lại sau nhé 😅🍳" });
    }
};

exports.processAdminChat = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ reply: 'Vui lòng đăng nhập để sử dụng Admin Chat.' });
        }

        const user = await User.findById(userId).select('role');
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ reply: 'Bạn không có quyền truy cập Admin Chat. 🔐' });
        }

        return exports.processChat(req, res);
    } catch (err) {
        console.error('Admin Chat Error:', err);
        return res.status(500).json({ reply: 'Admin Chat đang bận, vui lòng thử lại sau.' });
    }
};
