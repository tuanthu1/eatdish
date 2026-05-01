const User = require('../models/UserModel');
const SiteSetting = require('../models/SiteSetting');

const DEFAULT_RECIPE_CLASSIFICATIONS = {
    categories: [
        { value: 'Mon_chinh', label: 'Món chính', imageUrl: '' },
        { value: 'Mon_phu', label: 'Món phụ', imageUrl: '' },
        { value: 'Mon_chay', label: 'Món chay', imageUrl: '' },
        { value: 'Mon_nuoc', label: 'Món nước / Canh', imageUrl: '' },
        { value: 'Trang_mieng', label: 'Tráng miệng', imageUrl: '' },
        { value: 'Do_uong', label: 'Đồ uống', imageUrl: '' },
        { value: 'Khac', label: 'Khác', imageUrl: '' }
    ],
    mealTypes: [
        { value: 'Bua_sang', label: 'Bữa sáng' },
        { value: 'Bua_trua', label: 'Bữa trưa' },
        { value: 'Bua_toi', label: 'Bữa tối' },
        { value: 'An_vat', label: 'Ăn vặt' },
        { value: 'Tiec', label: 'Tiệc / Đãi khách' },
        { value: 'Khong_xac_dinh', label: 'Không xác định' }
    ]
};

const toSlug = (input = '') => {
    const normalized = String(input)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');

    return normalized
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .replace(/_{2,}/g, '_') || 'Khac';
};

const normalizeClassificationList = (items = [], fallbackList = []) => {
    const source = Array.isArray(items) && items.length > 0 ? items : fallbackList;
    const dedupe = new Set();
    const normalized = [];

    source.forEach((item) => {
        const rawLabel = typeof item === 'string' ? item : item?.label;
        const label = String(rawLabel || '').trim();
        if (!label) return;

        const rawValue = typeof item === 'object' ? item?.value : '';
        const value = String(rawValue || '').trim() || toSlug(label);
        if (dedupe.has(value)) return;

        const imageUrl = typeof item === 'object' ? String(item?.imageUrl || '').trim() : '';
        dedupe.add(value);
        normalized.push({ value, label, imageUrl });
    });

    return normalized;
};

const getRecipeClassificationSetting = async () => {
    const setting = await SiteSetting.findOne({ key: 'recipe_classifications' });
    const value = setting?.value || {};

    return {
        categories: normalizeClassificationList(value.categories, DEFAULT_RECIPE_CLASSIFICATIONS.categories),
        mealTypes: normalizeClassificationList(value.mealTypes, DEFAULT_RECIPE_CLASSIFICATIONS.mealTypes)
    };
};

// API lấy trạng thái bảo trì (Public)
exports.getMaintenanceStatus = async (req, res) => {
    try {
        // Lấy trạng thái maintenance từ environment variable hoặc default false
        const isMaintenance = process.env.MAINTENANCE_MODE === 'true' ? true : false;
        res.json({ isMaintenance });
    } catch (err) {
        console.error("Lỗi lấy trạng thái bảo trì:", err);
        res.status(500).json({ error: "Lỗi Server" });
    }
};

//API Bật/Tắt bảo trì (Chỉ Admin dùng)
exports.toggleMaintenanceStatus = async (req, res) => {
    try {
        const { status } = req.body; 
        // Trong thực tế, bạn có thể lưu vào cơ sở dữ liệu hoặc biến môi trường
        process.env.MAINTENANCE_MODE = status ? 'true' : 'false';

        res.json({ 
            success: true, 
            message: status ? "Đã BẬT chế độ bảo trì!" : "Đã TẮT chế độ bảo trì, web hoạt động bình thường!" 
        });
    } catch (err) {
        console.error("Lỗi bật/tắt bảo trì:", err);
        res.status(500).json({ error: "Lỗi Server" });
    }
};
// Cập nhật cài đặt thông báo
exports.updateNotificationSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email_tutorial, email_newsletter } = req.body;

        await User.findByIdAndUpdate(userId, {
            email_tutorial: email_tutorial ? true : false,
            email_newsletter: email_newsletter ? true : false
        });

        res.json({ success: true, message: "Đã lưu cài đặt thông báo!" });
    } catch (err) {
        console.error("Lỗi lưu thông báo:", err);
        res.status(500).json({ message: "Lỗi Server khi lưu cài đặt" });
    }
};

// API lấy danh sách banner (Backend)
exports.getRecipeBanner = async (req, res) => {
    try {
        const SiteSetting = require('../models/SiteSetting');
        const bannerSetting = await SiteSetting.findOne({ key: 'recipe_banner' });
        
        let banners = [];
        
        if (bannerSetting && bannerSetting.value) {
            // Chuyển đổi data cũ (imageUrls) sang data mới (banners) để không bị lỗi
            if (bannerSetting.value.imageUrls && Array.isArray(bannerSetting.value.imageUrls)) {
                banners = bannerSetting.value.imageUrls.map(url => ({ imageUrl: url }));
            } 
            // Nếu đã là form mới thì lấy luôn
            else if (bannerSetting.value.banners && Array.isArray(bannerSetting.value.banners)) {
                banners = bannerSetting.value.banners;
            }
        }

        return res.json({ banners });
    } catch (err) {
        console.error('Lỗi lấy banner công thức:', err);
        return res.status(500).json({ message: 'Lỗi Server' });
    }
};

// API cập nhật danh sách banner (Backend)
exports.updateRecipeBanner = async (req, res) => {
    try {
        const SiteSetting = require('../models/SiteSetting');
        const { banners } = req.body; // Lấy mảng banners từ Frontend gửi lên

        if (!banners || !Array.isArray(banners)) {
            return res.status(400).json({ message: 'Thiếu dữ liệu danh sách banner!' });
        }

        // Lọc bỏ những ảnh bị lỗi rỗng
        const validBanners = banners.filter(b => b && b.imageUrl && String(b.imageUrl).trim() !== '');

        await SiteSetting.findOneAndUpdate(
            { key: 'recipe_banner' },
            {
                value: { banners: validBanners }
            },
            { upsert: true, returnDocument: 'after' }
        );

        return res.json({ success: true, message: 'Đã cập nhật banner thành công' });
    } catch (err) {
        console.error('Lỗi cập nhật banner:', err);
        return res.status(500).json({ message: 'Lỗi Server' });
    }
};
exports.uploadBannerImage = async (req, res) => {
    try {
        // req.file chứa thông tin ảnh đã được file upload.js ném lên Cloudinary
        if (!req.file || !req.file.path) {
            return res.status(400).json({ message: "Không tìm thấy file ảnh tải lên" });
        }
        
        // Trả về link ảnh xịn xò từ mây
        res.json({ imageUrl: req.file.path });
    } catch (err) {
        console.error("Lỗi upload ảnh banner:", err);
        res.status(500).json({ message: "Lỗi Server khi upload ảnh" });
    }
};

// API lấy danh sách category / phân loại món (Public)
exports.getRecipeClassifications = async (req, res) => {
    try {
        const payload = await getRecipeClassificationSetting();
        res.json(payload);
    } catch (err) {
        console.error('Lỗi lấy phân loại công thức:', err);
        res.status(500).json({ message: 'Lỗi Server khi lấy phân loại món ăn' });
    }
};

// API lấy ảnh danh mục từ database (Public)
exports.getCategoryImages = async (req, res) => {
    try {
        const payload = await getRecipeClassificationSetting();
        const images = payload.categories.map(cat => ({
            value: cat.value,
            label: cat.label,
            imageUrl: cat.imageUrl
        }));
        res.json({ images });
    } catch (err) {
        console.error('Lỗi lấy ảnh danh mục:', err);
        res.status(500).json({ message: 'Lỗi Server khi lấy ảnh danh mục' });
    }
};

// API cập nhật danh sách category / phân loại món (Admin)
exports.updateRecipeClassifications = async (req, res) => {
    try {
        const { categories, mealTypes } = req.body;

        const normalizedCategories = normalizeClassificationList(categories, DEFAULT_RECIPE_CLASSIFICATIONS.categories);
        const normalizedMealTypes = normalizeClassificationList(mealTypes, DEFAULT_RECIPE_CLASSIFICATIONS.mealTypes);

        await SiteSetting.findOneAndUpdate(
            { key: 'recipe_classifications' },
            {
                value: {
                    categories: normalizedCategories,
                    mealTypes: normalizedMealTypes
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        res.json({
            success: true,
            message: 'Đã cập nhật danh mục và phân loại món',
            categories: normalizedCategories,
            mealTypes: normalizedMealTypes
        });
    } catch (err) {
        console.error('Lỗi cập nhật phân loại công thức:', err);
        res.status(500).json({ message: 'Lỗi Server khi cập nhật phân loại món ăn' });
    }
};