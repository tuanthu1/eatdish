import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const RecipeReviews = ({ recipeId }) => {
    const myId = localStorage.getItem('eatdish_user_id');
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');

    const fetchReviews = async () => {
        try {
            const res = await axiosClient.get(`/recipes/${recipeId}/reviews`);
            setReviews(res.data);
        } catch (e) { console.log(e); }
    };

    useEffect(() => {
        document.body.style.overflow = 'auto';
        document.body.style.height = 'auto';
        fetchReviews(); 
        return () => {
            document.body.style.overflow = 'hidden';
            document.body.style.height = '100vh';
        };
    }, [recipeId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!myId) return setError("Cần đăng nhập!");
        try {
            await axiosClient.post('/recipes/reviews', { recipeId, userId: myId, rating, comment });
            setComment('');
            fetchReviews();
        } catch (e) { setError("Lỗi khi gửi"); }
    };

    return (
        <div style={{ marginTop: '30px', padding: '20px', background: '#fff', borderRadius: '15px' }}>
            <h3>Đánh giá từ cộng đồng ⭐</h3>

            {/* Form gửi đánh giá */}
            <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
                <div style={{ margin: '10px 0' }}>
                    {[1, 2, 3, 4, 5].map(num => (
                        <span key={num} onClick={() => setRating(num)} style={{ cursor: 'pointer', fontSize: '24px', color: num <= rating ? '#ff9f1c' : '#ccc' }}>
                            ★
                        </span>
                    ))}
                </div>
                <textarea 
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Bạn thấy món ăn này thế nào?"
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ddd' }}
                />
                <button type="submit" style={{ marginTop: '10px', padding: '10px 20px', background: '#ff9f1c', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer' }}>
                    Gửi đánh giá
                </button>
            </form>

            {/* Hiển thị danh sách đánh giá */}
            <div className="reviews-list">
                {reviews.map(rev => (
                    <div key={rev.id} style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={rev.avatar} alt="avt" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                            <b>{rev.username}</b>
                            <span style={{ color: '#ff9f1c' }}>{"★".repeat(rev.rating)}</span>
                        </div>
                        <p style={{ margin: '5px 0 0 40px', color: '#555' }}>{rev.comment}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecipeReviews;