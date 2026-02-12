import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import ReactMarkdown from 'react-markdown';
import '../index.css';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ text: "Xin chào! Mình có thể giúp gì cho bạn?", isBot: true }]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
      const checkAuth = () => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        setIsGuest(!token);
      };
        checkAuth();
        window.addEventListener("storage", checkAuth);
        return () => window.removeEventListener("storage", checkAuth);
    }, []);
    const scrollRef = useRef(null);
    const BOT_AVATAR = "https://cdn-icons-png.flaticon.com/512/4712/4712035.png";
    const navigate = useNavigate();

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    useEffect(() => {
         const openChatFromMascot = (e) => {
            const msg = e.detail?.message;
            setIsOpen(true);

            if (msg) {
            setMessages(prev => [
                ...prev,
                { text: msg, isBot: false }
            ]);

            handleSendFromMascot(msg);
            }
        };

        window.addEventListener("open-chatbot", openChatFromMascot);
        return () => window.removeEventListener("open-chatbot", openChatFromMascot);
    }, []);
    // nếu khách nhấn thì bắt đăng nhập (không cho mở chat)
    const handleOpenChat = () => {
        if (isGuest) {
            navigate('/login');
            return;
        }
        setIsOpen(true);
    };

    // chặn sự kiện open-chatbot (từ linh vật) nếu là guest
    useEffect(() => {
        const guardOpenChat = (e) => {
            if (isGuest) {
                e.stopImmediatePropagation?.();
                e.preventDefault?.();
                navigate('/login');
            }
        };
        window.addEventListener('open-chatbot', guardOpenChat, true);
        return () => window.removeEventListener('open-chatbot', guardOpenChat, true);
    }, [isGuest, navigate]);

    useEffect(() => {
        const onDocClick = (e) => {
            if (!isGuest) return;
            const t = e.target;
            if (t && t.nodeType === 1 && (t.textContent === '💬' || t.innerText === '💬')) {
                e.stopPropagation();
                e.preventDefault();
                navigate('/not-found');
            }
        };
        document.addEventListener('click', onDocClick, true);
        return () => document.removeEventListener('click', onDocClick, true);
    }, [isGuest, navigate]);
    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg = { text: inputValue, isBot: false };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsTyping(true);

        try {
            const res = await axiosClient.post('/chat', { message: inputValue });
            setMessages(prev => [...prev, { text: res.data.reply, isBot: true }]);
        } catch (err) {
            setMessages(prev => [...prev, { text: "Xin lỗi, món bạn nhập tạm thời chưa có trên hệ thống, vui lòng chờ Admin thêm, Cảm ơn và xin lỗi bạn.", isBot: true }]);
        } finally {
            setIsTyping(false);
        }
    };
    //người dùng nhấn linh vật
    const sendToBot = async (text) => {
    setIsTyping(true);
    try {
        const res = await axiosClient.post("/chat", { message: text });
        setMessages(prev => [...prev, { text: res.data.reply, isBot: true }]);
    } catch {
        setMessages(prev => [
        ...prev,
        { text: "Xin lỗi, mình chưa hiểu câu này 😥", isBot: true }
        ]);
    } finally {
        setIsTyping(false);
    }
    };

    const handleSendFromMascot = (text) => {
    sendToBot(text);
    };


    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999 }}>
            {!isOpen && (
                <div onClick={() => {setIsOpen(true); handleOpenChat();}} style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ff9f1c', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', fontSize: '25px' }}>
                    💬
                </div>
            )}

            {/* Cửa sổ Chat */}
            {isOpen && (
                <div className="fadeIn" style={{ width: '350px', height: '450px', background: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #eee' }}>
                    <div style={{ background: '#ff9f1c', padding: '15px', color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                        <span>🤖 Trợ lý EatDish</span>
                        <span onClick={() => {setIsOpen(false);}}  style={{ cursor: 'pointer' }}>✕</span>
                    </div>

                    <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: '#f9fafc' }}>
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-end",
                                    justifyContent: m.isBot ? "flex-start" : "flex-end",
                                    gap: "8px"
                                }}
                            >
                                {m.isBot && (
                                    <img
                                        src={BOT_AVATAR}
                                        alt="bot"
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: "50%"
                                        }}
                                    />
                                )}

                                <div
                                    style={{
                                        background: m.isBot ? "#fff" : "#ff9f1c",
                                        color: m.isBot ? "#333" : "#fff",
                                        padding: "12px 18px",
                                        borderRadius: "18px",
                                        maxWidth: "75%",
                                        fontSize: "14px",
                                        boxShadow: "0 3px 10px rgba(0,0,0,0.08)"
                                    }}
                                >
                                    {m.isBot ? (
                                        <div className="chatbot-markdown-content">
                                            <ReactMarkdown
                                                components={{
                                                    a: ({ node, ...props }) => (
                                                        <span
                                                            style={{
                                                                color: "#007bff",
                                                                textDecoration: "underline",
                                                                cursor: "pointer",
                                                                fontWeight: "bold"
                                                            }}
                                                            onClick={() => navigate(props.href)}
                                                        >
                                                            {props.children}
                                                        </span>
                                                    )
                                                }}
                                            >
                                                {m.text}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        m.text
                                    )}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <img
                                    src={BOT_AVATAR}
                                    style={{ width: 32, height: 32, borderRadius: "50%" }}
                                />
                                <div style={{ background: "#eee", padding: "8px 12px", borderRadius: "15px", fontSize: "12px" }}>
                                    👨‍🍳 Bro tôi đang suy nghĩ...
                                </div>
                            </div>
                        )}

                        <div ref={scrollRef} />
                    </div>

                    <div style={{ padding: '15px', display: 'flex', gap: '10px', borderTop: '1px solid #eee' }}>
                        <input 
                            type="text" 
                            placeholder="Nhập tin nhắn..." 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none' }} 
                        />
                        <button onClick={handleSend} style={{ background: '#ff9f1c', border: 'none', color: 'white', padding: '0 15px', borderRadius: '10px', cursor: 'pointer' }}> gửi </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBot;