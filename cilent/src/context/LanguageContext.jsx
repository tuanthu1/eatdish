import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Bộ từ điển (Chỉ còn VI và EN)
const translations = {
    vi: {
        // Sidebar
        overview: "Tổng Quan",
        recipes: "Công Thức",
        favorites: "Yêu Thích",
        community: "Cộng Đồng",
        settings: "Cài Đặt",
        upload: "Tải Lên",
        
        // Settings Menu
        edit_profile: "Chỉnh sửa hồ sơ",
        account_security: "Tài khoản & Bảo mật",
        notifications: "Cài đặt thông báo",
        faq: "Câu hỏi thường gặp (FAQ)",
        feedback: "Góp ý & Phản hồi",
        policies: "Pháp lý & Chính sách",
        language: "Ngôn ngữ",
        
        // Common
        hello: "Xin chào",
        search_placeholder: "Tìm kiếm món ăn ngon...",
        trending: "Đang Hot",
        logout: "Đăng xuất"
    },
    en: {
        overview: "Overview",
        recipes: "Recipes",
        favorites: "Favorites",
        community: "Community",
        settings: "Settings",
        upload: "Upload",
        edit_profile: "Edit Profile",
        account_security: "Account & Security",
        notifications: "Notifications",
        faq: "FAQ",
        feedback: "Feedback",
        policies: "Legal & Policies",
        language: "Language",
        hello: "Hello",
        search_placeholder: "Search for delicious food...",
        trending: "Trending",
        logout: "Logout"
    }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(localStorage.getItem('eatdish_lang') || 'vi');

    useEffect(() => {
        localStorage.setItem('eatdish_lang', lang);
    }, [lang]);

    const t = (key) => {
        return translations[lang]?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);