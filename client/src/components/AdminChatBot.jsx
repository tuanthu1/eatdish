import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import axiosClient from '../api/axiosClient';
import linhvat from '../logo/linhvat.png';
import './AdminChatBot.css';

const AdminChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const hasMoved = useRef(false);
    const [isTyping, setIsTyping] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('eatdish_admin_modal_chat_history');
        if (saved) return JSON.parse(saved);
        return [
            {
                isBot: true,
                text: 'Xin chào ADMIN, bạn hãy giao nhiện vụ cho tôi, tôi sẽ thực hiện ngay ví dụ: "Xóa 5 bài cộng đồng chưa từ khóa spam".'
            }
        ];
    });
    const scrollRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('eatdish_admin_modal_chat_history', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 60);
        }
    }, [messages, isOpen, isTyping]);

    const sendMessage = async (text) => {
        if (!text.trim()) return;

        const userMsg = { isBot: false, text };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        try {
            const res = await axiosClient.post('/admin/chat/bot', { message: text });
            setMessages(prev => [...prev, { isBot: true, text: res.data.reply }]);
        } catch (err) {
            const errorMsg = err.response?.data?.reply || 'Không thể xử lý lệnh lúc này, vui lòng thử lại.';
            setMessages(prev => [...prev, { isBot: true, text: errorMsg }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSend = () => {
        const text = inputValue;
        setInputValue('');
        sendMessage(text);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        hasMoved.current = false;
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        hasMoved.current = true;
        setPosition({
            x: e.clientX - dragStartPos.current.x,
            y: e.clientY - dragStartPos.current.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <>
            <button 
                className="admin-chat-floating-btn" 
                onMouseDown={handleMouseDown}
                onClick={(e) => {
                    if (hasMoved.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        hasMoved.current = false;
                        return;
                    }
                    setIsOpen(true);
                }}
                style={{ 
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    cursor: isDragging ? 'grabbing' : 'pointer'
                }}
            >
                <img src={linhvat} alt="Admin Chat" draggable={false} />
            </button>

            {isOpen && (
                <div
                    className="admin-chat-modal-container"
                    style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
                >
                    <div className="admin-chat-modal">
                        <div
                            className="admin-chat-modal-header"
                            onMouseDown={handleMouseDown}
                            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                        >
                            <div className="admin-chat-modal-title">
                                <img src={linhvat} alt="Bot" draggable={false} />
                                <div>
                                    <b>Admin Chat AI</b>
                                    <span>Chế độ kiểm duyệt</span>
                                </div>
                            </div>
                            <button className="admin-chat-close" onMouseDown={(e) => e.stopPropagation()} onClick={() => setIsOpen(false)}>✕</button>
                        </div>

                        <div className="admin-chat-modal-body">
                            {messages.map((m, idx) => (
                                <div key={`${idx}-${m.isBot ? 'b' : 'u'}`} className={`admin-chat-msg-row ${m.isBot ? 'bot' : 'user'}`}>
                                    <div className={`admin-chat-msg-bubble ${m.isBot ? 'bot' : 'user'}`}>
                                        {m.isBot ? <ReactMarkdown>{m.text}</ReactMarkdown> : m.text}
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="admin-chat-msg-row bot">
                                    <div className="admin-chat-msg-bubble bot">Đang xử lý lệnh...</div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>

                        <div className="admin-chat-modal-input">
                            <input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Nhập lệnh cho chatbot admin..."
                            />
                            <button onClick={handleSend}>Gửi</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminChatBot;
