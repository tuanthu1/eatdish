const Recipe = require('../models/RecipeModel');
const Review = require('../models/Review');
const User = require('../models/UserModel');
const ActivityLog = require('../models/ActivityLogModel');
const SearchAnalytics = require('../models/SearchAnalyticsModel');
const SiteSetting = require('../models/SiteSetting');
const jwt = require('jsonwebtoken');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseNumber = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number.parseInt(String(value), 10);
    return Number.isNaN(parsed) ? null : parsed;
};

const parseTimeValue = (value) => {
    if (value === undefined || value === null || value === '') return 0;
    const match = String(value).match(/\d+/);
    return match ? Number.parseInt(match[0], 10) : 0;
};

const normalizeRecipeClassification = (value, fallback) => {
    if (value === undefined || value === null) return fallback;
    const trimmed = String(value).trim();
    return trimmed || fallback;
};

const DEFAULT_CATEGORY_LABELS = {
    Mon_chinh: 'Món chính',
    Mon_phu: 'Món phụ',
    Mon_chay: 'Món chay',
    Mon_nuoc: 'Món nước / Canh',
    Trang_mieng: 'Tráng miệng',
    Do_uong: 'Đồ uống',
    Khac: 'Khác'
};

const DEFAULT_MEAL_TYPE_LABELS = {
    Bua_sang: 'Bữa sáng',
    Bua_trua: 'Bữa trưa',
    Bua_toi: 'Bữa tối',
    An_vat: 'Ăn vặt',
    Tiec: 'Tiệc / Đãi khách',
    Khong_xac_dinh: 'Không xác định'
};

const humanizeClassification = (value, fallback) => {
    if (!value) return fallback;
    return String(value).replace(/_/g, ' ');
};

const buildLabelMap = (items = []) => {
    return (Array.isArray(items) ? items : []).reduce((acc, item) => {
        const key = String(item?.value || '').trim();
        const label = String(item?.label || '').trim();
        if (key && label) acc[key] = label;
        return acc;
    }, {});
};

const getRecipeClassificationLabelMaps = async () => {
    const setting = await SiteSetting.findOne({ key: 'recipe_classifications' }).select('value');
    const categories = setting?.value?.categories || [];
    const mealTypes = setting?.value?.mealTypes || [];

    return {
        categoryLabelMap: {
            ...DEFAULT_CATEGORY_LABELS,
            ...buildLabelMap(categories)
        },
        mealTypeLabelMap: {
            ...DEFAULT_MEAL_TYPE_LABELS,
            ...buildLabelMap(mealTypes)
        }
    };
};

// Lấy danh sách món ăn 
exports.getAllRecipes = async (req, res) => {
    try {
        const { keyword, userId, prefs } = req.query; // Nhận từ khoá tìm kiếm từ React
        const { categoryLabelMap, mealTypeLabelMap } = await getRecipeClassificationLabelMaps();
        
        // 1. Dựng bộ lọc tìm kiếm Mongoose
        let filter = {};
        if (keyword) {
            // MongoDB tìm kiếm gần đúng (như LIKE trong SQL), 'i' là không phân biệt hoa/thường
            filter.name = { $regex: keyword, $options: 'i' }; 
        }

        // 2. Tìm trong Database
        let recipes = await Recipe.find(filter)
            .populate('author', '_id fullname avatar') // Lấy thông tin tác giả
            .sort({ createdAt: -1 });

        // 3. Xử lý thông tin người dùng hiện tại (nếu có đăng nhập)
        let currentUser = null;
        if (req.user && req.user.id) {
            const User = require('../models/UserModel');
            currentUser = await User.findById(req.user.id).select('favorites blocked_users');
            
            // Nếu có user, lọc bỏ các món của người đã bị block
            if (currentUser && currentUser.blocked_users && currentUser.blocked_users.length > 0) {
                recipes = recipes.filter(r => !currentUser.blocked_users.includes(r.author?._id));
            }
        }
        // thuật tooans đề xuất (TikTok style): Dựa vào lịch sử xem và sở thích của người dùng để đẩy những món ăn họ có khả năng thích lên đầu danh sách
        if(!keyword && prefs) {
            const preferredCategories = prefs.split(',').map(c => c.trim()).filter(c => c);
            const recommended = [];
            const others = [];
            // phân loại trúng sở thích thì đẩy vào recommended, không thì vào others
            recipes.forEach(r => {
                if (preferredCategories.includes(r.category)) {
                    recommended.push(r);
                } else {
                    others.push(r);
                }
            });
            // xáo trộn recommended để không bị trùng lặp mỗi lần vào 
            for (let i = recommended.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [recommended[i], recommended[j]] = [recommended[j], recommended[i]];
            }
            recipes = [...recommended, ...others];
        }
        // 4. Format lại data cho React đọc được
        const formattedRecipes = recipes.map(r => {
            const obj = r.toObject();
            obj.id = obj._id; // Gắn ID chuẩn
            
            // Check xem món này đã được tim chưa (dùng optional chaining ?.)
            obj.is_favorite = currentUser?.favorites?.includes(obj._id) || false;

            // Đẩy thông tin tác giả ra ngoài cho React dễ đọc
            if (obj.author) {
                obj.user_id = obj.author._id;
                obj.fullname = obj.author.fullname;
                obj.avatar = obj.author.avatar;
            }

            obj.category_label = categoryLabelMap[obj.category] || humanizeClassification(obj.category, 'Khác');
            obj.meal_type_label = mealTypeLabelMap[obj.meal_type] || humanizeClassification(obj.meal_type, 'Không xác định');
            return obj;
        });

        res.json(formattedRecipes);
    } catch (error) {
        console.error("❌ Lỗi getAllRecipes:", error);
        res.status(500).json({ message: "Lỗi server khi lấy món ăn", error: error.message });
    }
};

// Tính calo bằng AI
exports.calculateCaloriesAI = async (req, res) => {
    try {
        const { ingredients, steps } = req.body;
        
        if (!ingredients || ingredients.length === 0) {
            return res.status(400).json({ message: "Cần có nguyên liệu để tính toán" });
        }

        // VŨ KHÍ BÍ MẬT: Ép AI liệt kê từng món ra nháp rồi mới cộng tổng
        const prompt = `
        Bạn là một chuyên gia dinh dưỡng tỉ mỉ. Hãy tính lượng calo (kcal) cho món ăn này.
        - Nguyên liệu: ${JSON.stringify(ingredients)}
        - Chế biến: ${JSON.stringify(steps)}

        YÊU CẦU:
        1. Phân tích ước lượng calo cho TỪNG nguyên liệu một.
        2. Cộng tổng tất cả lại.
        
        BẮT BUỘC TRẢ VỀ CHUẨN JSON VỚI CẤU TRÚC SAU (Không giải thích văn bản):
        {
            "chi_tiet": [
                {"mon": "Thịt bò 500g", "calo": 1250},
                {"mon": "Dầu ăn 2 muỗng", "calo": 240}
            ],
            "tong_calo": 1490
        }
        `;

        const completion = await groq.chat.completions.create({
            model: GROQ_MODEL,
            temperature: 0.1, // Giữ độ sáng tạo thấp để nó tính toán nghiêm túc
            response_format: { type: 'json_object' }, 
            messages: [
                {
                    role: 'system',
                    content: 'Bạn là siêu máy tính dinh dưỡng. Chỉ trả về JSON thuần túy.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        // Lấy data JSON AI nhả ra
        const jsonText = completion.choices?.[0]?.message?.content || '{"tong_calo": 0}';
        const parsedData = JSON.parse(jsonText);
        
        // Chỉ bốc đúng cái "tong_calo" ra để dùng, mặc kệ cái "chi_tiet"
        const finalCalories = parsedData.tong_calo || parsedData.total_calories || 0;
        
        // Lọc lại lần cuối cho chắc cốp là số
        const cleanCalories = String(finalCalories).replace(/[^0-9]/g, '');

        res.json({ success: true, calories: cleanCalories || 0 });
    } catch (error) {
        console.error("Lỗi AI tính calo:", error);
        res.status(500).json({ message: "Hệ thống AI đang bận, vui lòng tự nhập calo!" });
    }
};
// Thêm món ăn mới
exports.createRecipe = async (req, res) => {
    try {
       const { name, userId, description, calories, time, ingredients, steps, video_url, category, meal_type, is_premium } = req.body;
        const normalizedTime = parseTimeValue(time);
        
        const imgUrl = req.file ? req.file.path : null;

        if (!name || !userId || !imgUrl) {
            return res.status(400).json({ message: "Thiếu thông tin cần thiết" });
        }
        
        await Recipe.create({
            name, 
            author: userId, 
            description: description || '', 
            category: normalizeRecipeClassification(category, 'Khac'),
            meal_type: normalizeRecipeClassification(meal_type, 'Khong_xac_dinh'),
            calories, 
            time: String(normalizedTime), 
            img: imgUrl, 
            ingredients, 
            steps,
            video_url: video_url || '',
            is_premium: (is_premium == 1 || is_premium === '1') ? true : false 
        });
        await ActivityLog.create({
            admin: req.user ? req.user.id : null,
            action: "Tài khoản " + userId + " đã gửi một công thức mới chờ duyệt với tên: " + name
        });
        res.json({ success: true, message: "Đã gửi công thức chờ duyệt!" });
    } catch (err) {
        console.error("Lỗi upload recipe:", err);
        res.status(500).json({ error: err.message });
    }
};

// Cập nhật (Sửa) món ăn
exports.updateRecipe = async (req, res) => {
    try {
        const recipeId = req.params.id;
        const userId = req.user.id; 
        const { name, description, calories, time, ingredients, steps, video_url, category, meal_type, is_premium } = req.body;

        const recipe = await Recipe.findById(recipeId);
        if (!recipe) return res.status(404).json({ message: "Không tìm thấy công thức" });
        if (recipe.author.toString() !== userId) {
            return res.status(403).json({ message: "Không có quyền chỉnh sửa" });
        }

        // 1. Ép kiểu bạo lực để xóa chữ, lấy số
        const cleanTime = time ? parseInt(String(time).replace(/[^0-9]/g, '')) || 0 : 0;
        const cleanCalories = calories ? parseInt(String(calories).replace(/[^0-9]/g, '')) || 0 : 0;

        // 2. Dịch ngược chuỗi JSON mảng
        let parsedIngredients = [];
        try { parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients; } 
        catch (e) { parsedIngredients = ingredients || []; }

        let parsedSteps = [];
        try { parsedSteps = typeof steps === 'string' ? JSON.parse(steps) : steps; } 
        catch (e) { parsedSteps = steps || []; }

        // 3. Gói data sạch
        const updateData = {
            name,
            description,
            calories: cleanCalories,
            time: String(cleanTime),
            ingredients: parsedIngredients,
            steps: parsedSteps,
            video_url,
            category: normalizeRecipeClassification(category, 'Khac'),
            meal_type: normalizeRecipeClassification(meal_type, 'Khong_xac_dinh'),
            is_premium: (is_premium === '1' || is_premium === 1 || is_premium === 'true' || is_premium === true)
        };
        if (req.file) updateData.img = req.file.path;

        // 4. LƯU VÀ LẤY VỀ DATA MỚI NHẤT (Chìa khóa là {new: true})
        const updatedRecipe = await Recipe.findByIdAndUpdate(recipeId, updateData, { new: true }).populate('author', '_id fullname avatar');
        
        await ActivityLog.create({
            admin: req.user ? req.user.id : null,
            action: "Tài khoản " + userId + " đã cập nhật công thức: " + name
        });

        const formattedRecipe = updatedRecipe.toObject();
        formattedRecipe.id = formattedRecipe._id;

        const { categoryLabelMap, mealTypeLabelMap } = await getRecipeClassificationLabelMaps();
        formattedRecipe.category_label = categoryLabelMap[formattedRecipe.category] || humanizeClassification(formattedRecipe.category, 'Khác');
        formattedRecipe.meal_type_label = mealTypeLabelMap[formattedRecipe.meal_type] || humanizeClassification(formattedRecipe.meal_type, 'Không xác định');

        // ---> THÊM ĐOẠN NÀY ĐỂ REACT KHÔNG ẨN MÓN ĂN ĐI <---
        if (formattedRecipe.author) {
            formattedRecipe.user_id = formattedRecipe.author._id;
            formattedRecipe.fullname = formattedRecipe.author.fullname;
            formattedRecipe.avatar = formattedRecipe.author.avatar;
        }

        res.json({ success: true, message: "Cập nhật công thức thành công", recipe: formattedRecipe });
    } catch (err) {
        console.error("Lỗi cập nhật recipe:", err);
        res.status(500).json({ error: err.message });
    }
};

// Toggle Yêu thích 
exports.toggleFavorite = async (req, res) => {
    try {
        const { userId, recipeId } = req.body;
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

        const isFavorited = user.favorites?.includes(recipeId);

        if (isFavorited) {
            await User.findByIdAndUpdate(userId, {
                $pull: { favorites: recipeId }
            });
            res.json({ status: 'unfavorited', message: "Đã bỏ thích" });
        } else {
            await User.findByIdAndUpdate(userId, {
                $addToSet: { favorites: recipeId }
            });
            res.json({ status: 'favorited', message: "Đã thêm vào yêu thích" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Lấy danh sách yêu thích
exports.getUserFavorites = async (req, res) => {
    try {
        const { userId } = req.params;
        const mongoose = require('mongoose');
        if (!userId || userId === 'undefined' || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.json([]); 
        }
        const user = await User.findById(userId).populate('favorites');
        if (!user) return res.json([]);
        
        res.json(user.favorites || []);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Lấy chi tiết 1 món
exports.getRecipeById = async (req, res) => {
    try {
        const { id } = req.params;
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID công thức không hợp lệ!" });
        }
        
        const recipe = await Recipe.findById(id).populate('author', '_id fullname avatar');
        
        if (!recipe) {
            return res.status(404).json({ message: "Không tìm thấy công thức này!" });
        }
        const formattedRecipe = recipe.toObject();
        formattedRecipe.id = formattedRecipe._id; 

        const { categoryLabelMap, mealTypeLabelMap } = await getRecipeClassificationLabelMaps();
        formattedRecipe.category_label = categoryLabelMap[formattedRecipe.category] || humanizeClassification(formattedRecipe.category, 'Khác');
        formattedRecipe.meal_type_label = mealTypeLabelMap[formattedRecipe.meal_type] || humanizeClassification(formattedRecipe.meal_type, 'Không xác định');
        
        if (formattedRecipe.author) {
            formattedRecipe.author_id = formattedRecipe.author._id;
            formattedRecipe.fullname = formattedRecipe.author.fullname;
            formattedRecipe.avatar = formattedRecipe.author.avatar;
        }
        const totalLikes = await User.countDocuments({ favorites: id });
        formattedRecipe.favorites_count = totalLikes;

        // --- BẮT ĐẦU ĐOẠN LOGIC TÍNH TOP TÌM KIẾM ---
        const SearchAnalytics = require('../models/SearchAnalyticsModel');
        // Tìm xem món này đang hot nhất với từ khóa nào
        const topSearch = await SearchAnalytics.findOne({ recipe: id }).sort({ clicks: -1 });
        
        if (topSearch) {
            // Đếm xem có bao nhiêu món ăn khác có lượt click CAO HƠN món này với cùng từ khóa đó
            const rankCount = await SearchAnalytics.countDocuments({
                keyword: topSearch.keyword,
                clicks: { $gt: topSearch.clicks }
            });
            const rank = rankCount + 1; // Hạng = Số thằng hơn mình + 1
            
            // Nếu lọt Top 10 thì trả về Frontend để show Badge
            if (rank <= 10) {
                formattedRecipe.trendingBadge = {
                    rank: rank,
                    keyword: topSearch.keyword
                };
            }
        }

        res.json(formattedRecipe);
    } catch (err) {
        console.error("❌ Lỗi getRecipeById:", err);
        res.status(500).json({ message: "Lỗi server khi tải công thức" });
    }
};
// Tìm kiếm
exports.searchRecipes = async (req, res) => {
    try {
        const { q, minCalories, maxCalories, maxTime } = req.query;

        let query = {};
        if (q) query.name = { $regex: q, $options: 'i' };
        if (minCalories) query.calories = { $gte: parseInt(minCalories) };
        if (maxCalories) {
            if (!query.calories) query.calories = {};
            query.calories.$lte = parseInt(maxCalories);
        }
        if (maxTime) query.time = { $lte: parseInt(maxTime) };

        let recipes = await Recipe.find(query)
            .populate('author', 'fullname avatar')
            .limit(20);

        // --- BẮT ĐẦU THUẬT TOÁN ĐẨY TOP TÌM KIẾM LÊN ĐẦU ---
        if (q) {
            const SearchAnalytics = require('../models/SearchAnalyticsModel');
            // 1. Lấy toàn bộ lịch sử click của từ khóa này
            const analytics = await SearchAnalytics.find({ keyword: q.trim().toLowerCase() });
            
            // 2. Tạo một "từ điển" lưu số lượt click của từng món
            const clickMap = {};
            analytics.forEach(item => {
                clickMap[item.recipe.toString()] = item.clicks;
            });

            // 3. Format lại dữ liệu cho chuẩn React
            const formattedRecipes = recipes.map(r => {
                const obj = r.toObject();
                obj.id = obj._id;
                if (obj.author) obj.user_id = obj.author._id;
                return obj;
            });

            // 4. Bơm logic sắp xếp: Ai có lượt Click (Rank) cao hơn thì chễm chệ ngồi trên!
            formattedRecipes.sort((a, b) => {
                const clicksA = clickMap[a._id.toString()] || 0;
                const clicksB = clickMap[b._id.toString()] || 0;
                
                if (clicksB !== clicksA) {
                    return clicksB - clicksA; // Click cao xếp trước
                }
                // Nếu 2 món bằng lượt click nhau (hoặc cùng bằng 0), ưu tiên món mới đăng
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            return res.json(formattedRecipes);
        }
        // --- KẾT THÚC THUẬT TOÁN ---

        // Nếu người dùng không nhập từ khóa (chỉ filter) thì trả về bình thường
        res.json(recipes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Món trending
exports.getTrendingRecipes = async (req, res) => {
    try {
        const trendingIds = await User.aggregate([
            { $unwind: "$favorites" },
            { 
                $group: { 
                    _id: "$favorites", 
                    total_likes: { $sum: 1 } 
                } 
            },
            { $sort: { total_likes: -1 } },
            { $limit: 3 }
        ]);
        if (trendingIds.length === 0) {
            return res.json([]);
        }
        const recipeIds = trendingIds.map(t => t._id);
        const recipesInfo = await Recipe.find({ _id: { $in: recipeIds } });
        const formattedTrending = trendingIds.map(t => {
            const r = recipesInfo.find(rec => rec._id.toString() === t._id.toString());
            if (!r) return null; 

            return {
                id: r._id,
                name: r.title || r.name,
                img: r.img || r.image || r.image_url,
                total_likes: t.total_likes
            };
        }).filter(item => item !== null);

        res.json(formattedTrending);

    } catch (err) {
        console.error("Lỗi getTrendingRecipes:", err);
        res.status(500).json({ error: err.message });
    }
};

// Gửi review
exports.addReview = async (req, res) => {
    try {
        const { userId, recipeId, rating, content, comment } = req.body;
        const normalizedComment = String(comment ?? content ?? '').trim();

        await Review.create({
            user: userId,
            recipe: recipeId,
            rating: Number(rating) || 5,
            comment: normalizedComment
        });

        await ActivityLog.create({
            admin: req.user ? req.user.id : null,
            action: "Tài khoản " + userId + " đã gửi một đánh giá mới cho công thức với nội dung: " + (normalizedComment || '[không có nội dung]').substring(0, 30) + "..."
        });
        res.json({ success: true, message: "Đã gửi đánh giá" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Lấy reviews
exports.getRecipeReviews = async (req, res) => {
    try {
        const { recipeId } = req.params;
        const reviews = await Review.find({ recipe: recipeId })
            .populate('user', 'fullname username avatar')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Lưu lịch sử nấu
exports.markAsCooked = async (req, res) => {
    try {
        const { userId, recipeId, note, comment, rating } = req.body;

        if (!userId || !recipeId) {
            return res.status(400).json({ message: 'Thiếu thông tin người dùng hoặc công thức' });
        }

        const cooksnapImage = req.file?.path || '';
        const cooksnapNote = String(note ?? comment ?? '').trim();

        if (!cooksnapImage) {
            return res.status(400).json({ message: 'Vui lòng gửi ảnh món đã nấu' });
        }

        if (!cooksnapNote) {
            return res.status(400).json({ message: 'Vui lòng nhập nhận xét để hoàn tất đánh giá' });
        }

        const normalizedRating = Math.min(5, Math.max(1, Number(rating) || 5));

        await User.findByIdAndUpdate(userId, {
            $push: {
                cooked_history: {
                    recipe: recipeId,
                    cooked_at: new Date(),
                    cooksnap_image: cooksnapImage,
                    cooksnap_note: cooksnapNote
                }
            }
        });

        await Review.create({
            user: userId,
            recipe: recipeId,
            rating: normalizedRating,
            comment: cooksnapNote,
            cooksnap_image: cooksnapImage,
            cooked_at: new Date()
        });

        await ActivityLog.create({
            admin: req.user ? req.user.id : null,
            action: "Tài khoản " + userId + " đã gửi cooksnap + đánh giá cho công thức ID: " + recipeId
        });

        res.json({ status: 'success', message: 'Đã lưu đánh giá và lịch sử đã nấu' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Lấy lịch sử nấu
exports.getCookedHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).populate({
            path: 'cooked_history.recipe',
            populate: { path: 'author', select: '_id fullname avatar' }
        });
        
        res.json(user?.cooked_history || []);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Lọc công thức
exports.filterRecipes = async (req, res) => {
    try {
        const {
            keyword,
            q,
            name,
            authorName,
            calories,
            maxCal,
            time,
            maxTime,
            ingredient,
            ingredients,
            category,
            mealType,
            meal_type,
            hasVideo,
            premiumOnly,
            sortBy,
        } = req.query;

        const query = {};
        const searchTerm = keyword || q || name;
        const maxCaloriesValue = parseNumber(maxCal ?? calories);
        const maxTimeValue = parseNumber(maxTime ?? time);
        const ingredientTerm = ingredient || ingredients;
        const categoryTerm = category;
        const mealTypeTerm = mealType || meal_type;

        if (searchTerm) {
            query.name = { $regex: escapeRegex(searchTerm), $options: 'i' };
        }

        if (maxCaloriesValue !== null) {
            query.calories = { $lte: maxCaloriesValue };
        }

        if (ingredientTerm) {
            query.ingredients = { $elemMatch: { $regex: escapeRegex(ingredientTerm), $options: 'i' } };
        }

        if (categoryTerm && categoryTerm !== 'all') {
            query.category = categoryTerm;
        }

        if (mealTypeTerm && mealTypeTerm !== 'all') {
            query.meal_type = mealTypeTerm;
        }

        if (hasVideo === 'true' || hasVideo === true) {
            query.video_url = { $exists: true, $nin: [null, ''] };
        }

        if (premiumOnly === 'true') {
            query.is_premium = true;
        } else if (premiumOnly === 'false') {
            query.is_premium = false;
        }

        let recipes = await Recipe.find(query)
            .populate('author', 'fullname avatar');

        if (authorName) {
            const authorSearch = escapeRegex(authorName);
            recipes = recipes.filter(recipe => {
                const authorFullname = recipe.author?.fullname || '';
                return new RegExp(authorSearch, 'i').test(authorFullname);
            });
        }

        if (maxTimeValue !== null) {
            recipes = recipes.filter(recipe => parseTimeValue(recipe.time) <= maxTimeValue);
        }

        recipes.sort((left, right) => {
            switch (sortBy) {
                case 'oldest':
                    return new Date(left.createdAt) - new Date(right.createdAt);
                case 'name_asc':
                    return (left.name || '').localeCompare(right.name || '', 'vi');
                case 'name_desc':
                    return (right.name || '').localeCompare(left.name || '', 'vi');
                case 'calories_asc':
                    return (Number(left.calories) || 0) - (Number(right.calories) || 0);
                case 'calories_desc':
                    return (Number(right.calories) || 0) - (Number(left.calories) || 0);
                case 'time_asc':
                    return parseTimeValue(left.time) - parseTimeValue(right.time);
                case 'time_desc':
                    return parseTimeValue(right.time) - parseTimeValue(left.time);
                case 'newest':
                default:
                    return new Date(right.createdAt) - new Date(left.createdAt);
            }
        });

        const formattedRecipes = recipes.slice(0, 50).map(recipe => {
            const obj = recipe.toObject();
            obj.id = obj._id;
            obj.title = obj.name || obj.title;
            obj.image_url = obj.img || obj.image_url;
            obj.is_vip = obj.is_premium ? 1 : 0;
            obj.category = obj.category || 'Khac';
            obj.meal_type = obj.meal_type || 'Khong_xac_dinh';

            if (obj.author) {
                obj.author_id = obj.author._id;
                obj.author_name = obj.author.fullname;
                obj.author_avatar = obj.author.avatar;
            }

            return obj;
        });

        res.json(formattedRecipes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Toggle VIP
exports.toggleVip = async (req, res) => {
    try {
        const { recipeId } = req.params;
        const { is_premium } = req.body;

        const recipe = await Recipe.findById(recipeId);
        if (!recipe) return res.status(404).json({ message: "Không tìm thấy công thức" });

        await Recipe.findByIdAndUpdate(recipeId, { is_premium });
        res.json({ status: 'success', message: is_premium ? "Đã đặt VIP" : "Đã hủy VIP" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Xóa công thức của người dùng
exports.deleteMyRecipe = async (req, res) => {
    try {
        const recipeId = req.params.id || req.params.recipeId;
        const userId = req.user.id;

        if (!recipeId) {
            return res.status(400).json({ message: "Thiếu ID công thức" });
        }

        const recipe = await Recipe.findById(recipeId);
        if (!recipe) return res.status(404).json({ message: "Không tìm thấy công thức" });
        if (recipe.author.toString() !== userId) {
            return res.status(403).json({ message: "Không có quyền xóa" });
        }

        await Recipe.findByIdAndDelete(recipeId);
        await ActivityLog.create({
            admin: req.user ? req.user.id : null,
            action: "Tài khoản " + userId + " đã xóa công thức với ID: " + recipeId
        });
        res.json({ status: 'success', message: "Đã xóa công thức" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
// Tracking lượt click từ kết quả tìm kiếm
exports.trackSearchClick = async (req, res) => {
    try {
        const { keyword, recipeId } = req.body;
        if (!keyword || !recipeId) return res.json({ success: false });

        const keywordLower = keyword.trim().toLowerCase();
        
        // Tìm xem món này với từ khóa này đã có trong bảng chưa, chưa có thì tạo mới, có rồi thì cộng 1
        await SearchAnalytics.findOneAndUpdate(
            { keyword: keywordLower, recipe: recipeId },
            { $inc: { clicks: 1 } },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Lỗi trackSearchClick:", err);
        res.status(500).json({ error: err.message });
    }
};

const RecipeReport = require('../models/RecipeReportModel');

exports.reportRecipe = async (req, res) => {
    try {
        const { reportedRecipeId, reason } = req.body;
        const reporterId = req.user.id;

        if (!reportedRecipeId || !reason) {
            return res.status(400).json({ message: "Vui lòng nhập lý do báo cáo." });
        }

        const newReport = await RecipeReport.create({
            reporter: reporterId,
            reportedRecipe: reportedRecipeId,
            reason: reason
        });

        res.status(201).json({ message: "Báo cáo công thức thành công!", report: newReport });
    } catch (err) {
        console.error("Lỗi báo cáo công thức:", err);
        res.status(500).json({ message: "Lỗi Server khi báo cáo công thức" });
    }
};