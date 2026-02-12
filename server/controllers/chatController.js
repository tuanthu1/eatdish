const db = require('../config/db');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });
exports.processChat = async (req, res) => {
    try {
        const { message } = req.body;
        
        //  TỪ ĐIỂN MỞ RỘNG 
        const synonymMap = {
            "chim": ["chim", "bồ câu", "cút", "sẻ"],
            "gà": ["gà", "cánh", "đùi", "chân", "ức", "lòng"],
            "vịt": ["vịt", "ngan", "ngỗng"],
            "heo": ["heo", "lợn", "sườn", "ba chỉ", "giò"],
            "lợn": ["heo", "lợn", "sườn", "ba chỉ", "giò"],
            "bò": ["bò", "bắp", "thăn", "gầu", "đuôi"],
            "trâu": ["trâu", "nghé"],
            "cá": ["cá", "chép", "trắm", "hồi", "ngừ", "lóc", "rô"],
            "hải sản": ["tôm", "cua", "ghẹ", "mực", "bạch tuộc", "ngao", "sò", "ốc"],
            "tôm": ["tôm", "tép"],
            "trứng": ["trứng", "ốp la", "chiên"],
            "rau": ["rau", "cải", "muống", "xà lách", "nộm", "gỏi"]
        };

        //  Lọc từ khóa rác
        const stopWords = ["tao", "tôi", "tớ", "mình", "bạn", "muốn", "thích", "cần", "tìm", "kiếm", "ăn", "uống", "làm", "nấu", "cách", "món", "gì", "ngon", "gợi", "ý", "cho", "hỏi", "có", "không", "bot", "ơi", "với", "là", "nhé", "nào", "được", "rất", "thấy", "bảo", "sao", "mà"];
        
        // Tách từ khóa gốc
        let rawWords = message.toLowerCase().split(/\s+/)
            .filter(w => !stopWords.includes(w) && w.length > 1);

        // MỞ RỘNG TỪ KHÓA 
        let expandedWords = [...rawWords];
        
        rawWords.forEach(word => {
            // Nếu từ khóa có trong từ điển (VD: "chim") thì thêm cả "bồ câu", "cút"... vào danh sách tìm
            if (synonymMap[word]) {
                expandedWords.push(...synonymMap[word]);
            }
        });

        // Loại bỏ từ trùng lặp
        expandedWords = [...new Set(expandedWords)];

        let finalRecipes = [];
        const sqlBase = "SELECT id, name, calories, time FROM recipes WHERE (status = 'active' OR status = 'public')";

        //  TÌM CHÍNH XÁC CẢ CÂU
        const [exactMatch] = await db.query(
            `${sqlBase} AND name LIKE ? LIMIT 5`, 
            [`%${message}%`]
        );
        finalRecipes = exactMatch;

        //  TÌM THEO TỪ KHÓA ĐÃ MỞ RỘNG
        if (finalRecipes.length === 0 && expandedWords.length > 0) {
            
            const likeConditions = expandedWords.map(() => "name LIKE ?").join(" OR ");
            const params = expandedWords.map(w => `%${w}%`);

            const sqlBroad = `${sqlBase} AND (${likeConditions}) LIMIT 5`;
            
            const [broadMatch] = await db.query(sqlBroad, params);
            finalRecipes = broadMatch;
        }

        // RANDOM NẾU CÓ Ý ĐỊNH GỢI Ý 
        const intentKeywords = ["gợi ý", "đói", "thực đơn", "random", "chưa biết", "hôm nay"];
        const hasIntent = intentKeywords.some(w => message.toLowerCase().includes(w));

        if (finalRecipes.length === 0 && (hasIntent || rawWords.length === 0)) {
             const [randomResult] = await db.query(`${sqlBase} ORDER BY RAND() LIMIT 3`);
             if (hasIntent) finalRecipes = randomResult;
        }

        // TẠO PHẢN HỒI 
        const recipeListText = finalRecipes.length > 0 
            ? finalRecipes.map(r => `- [${r.name}](/recipe/${r.id}): ${r.calories} calo, ${r.time} phút.`).join('\n')
            : ""; 

        const prompt = `
            Bạn là Bot EatDish. Người dùng nói: "${message}".
            
            Dữ liệu tìm được từ kho:
            ${recipeListText ? recipeListText : "Không có món nào khớp."}
            
            NHIỆM VỤ:
            1. Nếu có món: Mời người dùng bấm vào xem.
            2. Nếu KHÔNG có món: Trả lời khéo léo, đừng bịa đặt.
            3. Dùng icon động vật tương ứng (VD: 🐔 cho gà, 🐟 cho cá, 🐷 cho heo) để sinh động.
            4. Ngắn gọn, vui vẻ.
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        
        res.json({ reply: response.text() });

    } catch (err) {
        console.error("Chat Error:", err);
        res.status(500).json({ reply: "Xin lỗi, Server đang bị lag xíu 😅" });
    }
};  