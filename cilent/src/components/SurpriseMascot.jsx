import React, { useState, useEffect, useRef } from "react";
import linhvat from '../logo/linhvat.png'
const QUESTIONS = [
  "Hôm nay bạn muốn nấu món gì? 🍳",
  "Cần mình gợi ý món ăn nhanh không? ⏱️",
  "Bạn đã thử món mới nào chưa? 😋",
  "Tối nay ăn gì cho khỏe nhỉ? 🥗",
  "Muốn nấu món đơn giản hay cầu kỳ? 🔥",
  "Bạn thích ăn món chay hay món mặn? 🥘",
  "Cần mình giúp tìm nguyên liệu không? 🛒",
];

const SurpriseMascot = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [pos, setPos] = useState({ x: 30, y: window.innerHeight - 180 });
  const [isGuest, setIsGuest] = useState(false);

  const lifeTimer = useRef(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      setIsGuest(!token);
    };
    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  useEffect(() => {
    const onOpenChatbot = (e) => {
      if (isGuest) {
        alert("Vui lòng đăng nhập để sử dụng tính năng này.");
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener("open-chatbot", onOpenChatbot, true); 
    return () => window.removeEventListener("open-chatbot", onOpenChatbot, true);
  }, [isGuest]);
  // hiện linh vật (30s) 
  const showMascot = () => {
    const msg = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    setMessage(msg);
    setIsVisible(true);

    clearTimeout(lifeTimer.current);
    lifeTimer.current = setTimeout(() => {
      setIsVisible(false);
    }, 30000);
  };

  // random thjowif gian hiện lên bất kì
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.5) showMascot();
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(lifeTimer.current);
    };
  }, []);

  // DRAG START
  const onDown = (e) => {
    dragging.current = true;
    moved.current = false;
    start.current = { x: e.clientX, y: e.clientY };
  };

  // DRAG MOVE
  const onMove = (e) => {
    if (!dragging.current) return;

    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved.current = true;

    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
    start.current = { x: e.clientX, y: e.clientY };
  };

  // DRAG END / CLICK
  const onUp = () => {
    dragging.current = false;

    if (!moved.current) {
      window.dispatchEvent(new CustomEvent("open-chatbot", {
        detail: message
      }
    ))
    }
  };

  if (!isVisible) return null;

  return (
    <div
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 9999,
        cursor: "grab",
        userSelect: "none"
      }}
    >
      {/* BUBBLE CÂU HỎI */}
      <div
        style={{
          background: "white",
          padding: "10px 14px",
          borderRadius: "14px 14px 14px 0",
          border: "2px solid #ff9f1c",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          marginBottom: "35px",
          maxWidth: "220px",
          fontSize: "13px"
        }}
      >
        {message}
      </div>

      {/* LINH VẬT */}
      <img
        src={linhvat}
        alt="Mascot"
        draggable={false}
        style={{
          width: "80px",
          position: "absolute",
          bottom: "-20px",
          left: "-10px",
          pointerEvents: "none"
        }}
      />
    </div>
  );
};

export default SurpriseMascot;
