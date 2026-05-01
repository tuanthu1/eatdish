import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import RecipeReviews from '../components/RecipeReviews';
import PremiumModal from '../components/modals/PremiumModal';
import { toast } from 'react-toastify';
import { Flame } from 'lucide-react';
import '../index.css';
import Modal from '../components/Modal';
import { Heart, Crown, Lock, ShoppingCart, Camera, Star, MessageSquareWarning, MoreVertical } from 'lucide-react';
const CustomMedal = ({ size = 20, color = "#000000" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 300 300"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            fill={color} // Đổ màu cho icon
            d="M213.102,185.5H189.5v-22.995c0-0.09,0.405-0.177,0.402-0.265c4.652-6.007,8.892-12.613,12.19-19.24 c1.305-0.232,2.721-0.66,4.019-1.28c5.963-2.849,11.425-9.791,14.523-18.571c5.115-14.5,2.081-27.414-7.232-30.705 c-2.195-0.779-4.901-0.904-6.901-0.408V80.109c15-4.4,24.59-15.13,24.59-28.058c0-14.737-11.351-26.466-27.705-29.438 C197.584,9.189,176.408,0,149.32,0c-27.124,0-48.269,9.252-53.934,22.754C79.262,26.057,67.368,37.9,67.368,51.945 c0,12.796,9.132,23.186,23.132,27.659v12.488c-3-0.706-5.196-0.258-6.913,0.35c-9.313,3.293-12.2,16.205-7.087,30.707 c2.068,5.861,5.329,11.061,9.035,14.642c3.059,2.954,6.546,4.74,9.89,5.256c3.53,7.088,7.075,14.145,13.075,20.469V185.5H84.563 c-28.742,0-52.063,23.666-52.063,52.408v26.82c0,2.943,1.67,5.621,4.335,6.871c41.311,19.393,80.245,25.401,112.658,25.4 c17.062,0,32.307-1.666,45.132-3.92c40.39-7.101,65.313-21.14,66.371-21.734c2.392-1.344,3.504-3.874,3.504-6.617v-26.82 C264.5,209.166,241.844,185.5,213.102,185.5z M174.5,196.658l-15.038,15.131L123.5,189.41v-11.222 c7,5.429,15.819,8.807,24.992,8.807c9.579,0,18.008-3.681,26.008-9.542V196.658L174.5,196.658z M82.872,51.945 c0-7.597,8.26-13.973,19.215-14.83c3.798-0.297,6.788-3.366,6.987-7.172c0.314-6.02,16.15-14.762,40.249-14.762 c24.183,0,40.116,8.76,40.463,14.789c0.221,3.855,3.303,6.93,7.158,7.144c10.996,0.608,18.977,6.892,18.977,14.938 c0,6.942-7.228,12.769-18.103,14.502c-3.685,0.587-6.318,3.765-6.318,7.496V88.5h-86V73.633c0-3.688-2.24-6.844-5.873-7.479 C88.877,64.278,82.872,58.966,82.872,51.945z M200.122,103.549c1.561,2.689,4.604,4.211,7.621,3.785 c0.349,1.972,0.36,5.807-1.375,10.725c-2.041,5.785-4.989,8.859-6.334,9.742c-1.571-0.516-3.274-0.5-4.855,0.048 c-1.986,0.688-3.599,2.174-4.452,4.095c-8.172,18.391-24.049,39.867-41.896,39.867c-17.886,0-33.773-21.537-41.945-39.983 c-0.884-1.996-2.585-3.513-4.669-4.167c-1.627-0.51-3.364-0.452-4.938,0.136c-1.362-0.911-4.278-3.964-6.301-9.697 c-1.704-4.833-1.723-8.583-1.394-10.583c3.176,0.619,6.465-1.025,8.077-3.949L200.122,103.549z M47.5,259.858v-21.95 c0-20.371,16.693-36.408,37.063-36.408h28.78l57.156,35.078v44.291C137.5,283.766,94.5,280.888,47.5,259.858z M249.5,260.081 c-8,3.959-29.116,12.938-58.175,18.046c-1.846,0.325-3.825,0.633-5.825,0.929v-46.715c0-2.634-0.974-5.079-3.216-6.461 l-9.474-5.695l19.148-18.685h21.145c20.37,0,36.398,16.037,36.398,36.408V260.081z"
        />
    </svg>
);
const RecipeDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState(null);
    const [isFavorited, setIsFavorited] = useState(false);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [myId, setMyId] = useState(null);
    const [cookSnapFile, setCookSnapFile] = useState(null);
    const [cookSnapPreview, setCookSnapPreview] = useState('');
    const [cookSnapNote, setCookSnapNote] = useState('');
    const [cookSnapRating, setCookSnapRating] = useState(5);
    const [isSubmittingCooksnap, setIsSubmittingCooksnap] = useState(false);
    const [reviewRefreshKey, setReviewRefreshKey] = useState(0);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const reviewsRef = useRef(null);
    const isAdmin = currentUser?.role === 'admin';
    const isOwner = currentUser && recipe && String(currentUser.id) === String(recipe.author_id || recipe.user_id || recipe.author);
    const isPremiumUser = currentUser?.is_premium == 1 || currentUser?.is_premium === true;

    const canViewFullRecipe = isAdmin || isPremiumUser || isOwner;
    const isRecipeVip = (recipe?.is_premium == 1 || recipe?.is_vip == 1);
    const isLocked = isRecipeVip && !canViewFullRecipe;

    useEffect(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        if (!token) {
            toast.warning("Vui lòng đăng nhập để xem chi tiết món ăn!");
            navigate('/login-register');
            return;
        }

        const fetchRecipeData = async () => {
            setIsLoading(true);
            try {
                const resAuth = await axiosClient.get('/auth/me');
                const loggedUser = resAuth.data.user;
                const currentUserId = String(loggedUser._id || loggedUser.id);
                loggedUser.id = currentUserId;
                setCurrentUser(loggedUser);
                setMyId(currentUserId);

                const [resRec, resFav] = await Promise.all([
                    axiosClient.get(`/recipes/${id}`),
                    axiosClient.get(`/recipes/favorites/${currentUserId}`)
                ]);

                setRecipe(resRec.data);

                const listFavorite = resFav.data.map((f) => String(f.id || f._id || f.recipe_id || f.recipeId));
                setIsFavorited(listFavorite.includes(String(id)));

            } catch (err) {
                console.log("Lỗi tải chi tiết:", err);
                toast.error("Không thể tải thông tin món ăn.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecipeData();
    }, [id, navigate]);

    const handleToggleFavorite = async () => {
        if (!myId) return toast.error("Bạn cần đăng nhập để thực hiện chức năng này!");
        try {
            await axiosClient.post('/recipes/favorites/toggle', { userId: myId, recipeId: id });

            setRecipe(prev => ({
                ...prev,
                favorites_count: isFavorited
                    ? Math.max(0, (prev.favorites_count || 0) - 1)
                    : (prev.favorites_count || 0) + 1
            }));

            setIsFavorited(!isFavorited);

            toast.success(isFavorited ? "Đã bỏ lưu món ăn" : "Đã lưu vào yêu thích");
        } catch (e) {
            toast.error("Lỗi kết nối.");
        }
    };

    const handleReportRecipe = async () => {
        if (!currentUser) return toast.error("Vui lòng đăng nhập để báo cáo!");
        if (!reportReason.trim()) return toast.warning("Vui lòng nhập lý do báo cáo!");

        try {
            await axiosClient.post(`/recipes/report`, {
                reportedRecipeId: recipe.id || recipe._id,
                reason: reportReason
            });
            toast.success("Đã gửi báo cáo công thức thành công!");
            setIsReportModalOpen(false);
            setReportReason('');
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi khi báo cáo công thức!");
        }
    };

    const handleCookSnapFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
        const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
        const normalizedType = (file.type || '').toLowerCase();
        const normalizedName = (file.name || '').toLowerCase();
        const isValidImage = validTypes.includes(normalizedType) || validExtensions.some((ext) => normalizedName.endsWith(ext));

        if (!isValidImage) {
            toast.error('Chỉ hỗ trợ JPG, PNG, WebP hoặc AVIF');
            return;
        }

        if (file.size > 8 * 1024 * 1024) {
            toast.error('Ảnh quá lớn, vui lòng chọn ảnh dưới 8MB');
            return;
        }

        if (cookSnapPreview && cookSnapPreview.startsWith('blob:')) {
            URL.revokeObjectURL(cookSnapPreview);
        }

        setCookSnapFile(file);
        setCookSnapPreview(URL.createObjectURL(file));
    };

    const handleSubmitCooksnap = async () => {
        if (!myId) return toast.error('Bạn cần đăng nhập để gửi Cooksnap!');
        if (!cookSnapFile) return toast.error('Vui lòng chọn ảnh món đã nấu!');
        if (!cookSnapNote.trim()) return toast.error('Vui lòng nhập nhận xét để hoàn tất đánh giá!');

        setIsSubmittingCooksnap(true);
        try {
            const formData = new FormData();
            formData.append('userId', myId);
            formData.append('recipeId', id);
            formData.append('image', cookSnapFile);
            formData.append('note', cookSnapNote.trim());
            formData.append('rating', cookSnapRating);

            await axiosClient.post('/recipes/cooked', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Đã gửi đánh giá kèm ảnh, cảm ơn bạn đã chia sẻ!');
            setCookSnapFile(null);
            setCookSnapNote('');
            setCookSnapRating(5);
            if (cookSnapPreview && cookSnapPreview.startsWith('blob:')) {
                URL.revokeObjectURL(cookSnapPreview);
            }
            setCookSnapPreview('');
            setReviewRefreshKey(prev => prev + 1);
            reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể gửi đánh giá lúc này.');
        } finally {
            setIsSubmittingCooksnap(false);
        }
    };

    // Hàm Xử Lý
    const safeParseArray = (data) => {
        if (!data) return [];

        let rawData = data;
        if (Array.isArray(rawData) && rawData.length === 1 && typeof rawData[0] === 'string' && rawData[0].trim().startsWith('[')) {
            rawData = rawData[0];
        }

        if (Array.isArray(rawData)) return rawData;
        if (typeof rawData === 'string') {
            try {
                let parsed = JSON.parse(rawData);

                if (typeof parsed === 'string' && parsed.trim().startsWith('[')) {
                    parsed = JSON.parse(parsed);
                }

                return Array.isArray(parsed) ? parsed : [parsed];
            } catch (error) {
                let text = rawData.trim();
                if (text.startsWith('[') && text.endsWith(']')) {
                    let stripped = text.slice(1, -1);
                    return stripped.split('","').map(item => item.replace(/^["']|["']$/g, '').trim());
                }
                return [rawData];
            }
        }
        return [];
    };

    if (isLoading) return <div className="page-loading-msg">Đang load công thức... </div>;
    if (!recipe) return <div className="page-loading-msg">Không tìm thấy công thức này </div>;

    return (
        <div className="recipe-detail-wrapper">

            <div className="recipe-detail-header">
                <button className="btn-back-header" onClick={() => navigate(-1)}>
                    ← Quay lại
                </button>
                <h2 className="recipe-header-title">{recipe.title || recipe.name}</h2>
                <div style={{ width: '80px' }}></div>
            </div>

            <div className="recipe-content-wrapper">

                {/* CỘT TRÁI */}
                <div className="recipe-col-left">
                    <div className="recipe-media-container">
                        {isLocked ? (
                            <>
                                <img
                                    src={recipe.img || recipe.image || recipe.image_url}
                                    alt={recipe.name}
                                    className="recipe-media-img locked"
                                />
                                <div className="recipe-locked-text">
                                    <div className="icon"><Lock /></div>
                                    <h3>Video Premium</h3>
                                    <p>Nâng cấp VIP để xem hướng dẫn</p>
                                </div>
                            </>
                        ) : (
                            (recipe.video_url || recipe.youtube_link) ? (
                                <iframe
                                    className="recipe-media-iframe"
                                    src={(() => {
                                        const url = recipe.video_url || recipe.youtube_link;
                                        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                                        const match = url.match(regExp);
                                        return (match && match[2].length === 11)
                                            ? `https://www.youtube.com/embed/${match[2]}?autoplay=0`
                                            : url;
                                    })()}
                                    title="Recipe Video"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <img
                                    src={recipe.img || recipe.image || recipe.image_url}
                                    alt={recipe.name}
                                    className="recipe-media-img"
                                />
                            )
                        )}
                        {isRecipeVip && <div className="recipe-premium-badge"><Crown /> PREMIUM</div>}
                    </div>
                    <div className="recipe-ingredients-sticky">
                        <div className="recipe-section">
                            <h3 className="section-title orange"><ShoppingCart /> Nguyên liệu</h3>
                            {!isLocked ? (
                                <ul className="recipe-ingredients-list">
                                    {safeParseArray(recipe.ingredients).map((ing, i) => (
                                        <li key={i}>{ing}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="locked-msg"><Lock /> Nội dung đã bị ẩn.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI */}
                <div className="recipe-col-right">

                    {/* LỚP PHỦ KHÓA */}
                    {isLocked && (
                        <div className="recipe-locked-overlay">
                            <div className="icon"><Lock /></div>
                            <h2>Công thức dành cho VIP</h2>
                            <p>Nâng cấp tài khoản để xem chi tiết nguyên liệu và cách làm.</p>

                            <button className="btn-unlock-premium" onClick={() => setIsPremiumModalOpen(true)}>
                                <Crown /> Mở khóa ngay
                            </button>
                        </div>
                    )}

                    {/* NỘI DUNG CHÍNH */}
                    <div className={`recipe-content-main ${isLocked ? 'locked' : ''}`}>

                        <div className="recipe-author-box" onClick={(e) => {
                            e.stopPropagation();
                            const targetAuthorId = recipe.author?._id || recipe.author_id || recipe.user_id;
                            if (targetAuthorId) {
                                navigate(`/profile/${targetAuthorId}`);
                            } else {
                                toast.error("Không tìm thấy thông tin tác giả!");
                            }
                        }}>
                            <img
                                src={recipe.author?.avatar || recipe.author_avatar || `https://ui-avatars.com/api/?name=${recipe.author?.fullname || recipe.author_name || 'User'}`}
                                alt="avatar"
                            />
                            <div className="author-info">
                                <span className="label">Công thức bởi</span>
                                <span className="name">
                                    {recipe.author?.fullname || recipe.author_name || recipe.fullname || 'Đầu bếp ẩn danh'}
                                </span>
                            </div>
                        </div>
                        {recipe.trendingBadge && (
                            <div className="rd-trending-badge" style={{ marginBottom: '20px' }}>
                                <span className="rd-trending-title"><Flame className="rd-trending-icon" /> Tìm kiếm hàng đầu trong </span>
                                <span className="rd-trending-desc">
                                    Top {recipe.trendingBadge.rank === 1 ? '1St' :
                                        recipe.trendingBadge.rank === 2 ? '2Nd' :
                                            recipe.trendingBadge.rank === 3 ? '3Rd' : `${recipe.trendingBadge.rank}Th`} cho từ khóa <strong>"{recipe.trendingBadge.keyword}"</strong>
                                </span>
                            </div>
                        )}
                        <div className="recipe-interaction-bar" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px', marginBottom: '25px' }}>
                            <span style={{ fontSize: '15px', color: '#666' }}>
                                {recipe.favorites_count > 0
                                    ? `${recipe.favorites_count} người đã thích`
                                    : 'Hãy là người đầu tiên thích món này!'}
                            </span>

                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <button
                                    onClick={handleToggleFavorite}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '6px 16px', borderRadius: '20px',
                                        border: 'none', background: '#f2f2f2', cursor: 'pointer',
                                        fontSize: '16px', fontWeight: 'bold',
                                        color: isFavorited ? '#ff4757' : '#555',
                                        transition: 'all 0.2s ease-in-out'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e2e2'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f2f2f2'}
                                >
                                    <Heart
                                        size={20}
                                        color={isFavorited ? "#ff4757" : "#555"}
                                        fill={isFavorited ? "#ff4757" : "none"}
                                        style={{ transition: 'all 0.2s ease-in-out' }}
                                    />
                                    <span>{recipe.favorites_count || recipe.likes || 0}</span>
                                </button>

                                {/* Nút Báo cáo */}
                                {!isOwner && currentUser && (
                                    <div className="recipe-report-actions">
                                        <button 
                                            className="recipe-report-btn recipe-report-btn--desktop"
                                            onClick={() => setIsReportModalOpen(true)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                padding: '6px 16px', borderRadius: '20px',
                                                border: 'none', background: '#fff0f0', cursor: 'pointer',
                                                fontSize: '15px', fontWeight: 'bold',
                                                color: '#d63031',
                                                transition: 'all 0.2s ease-in-out'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fadcd6'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff0f0'}
                                        >
                                            <MessageSquareWarning size={18} />
                                            <span>Báo cáo</span>
                                        </button>

                                        <button 
                                            className="recipe-report-btn recipe-report-btn--mobile"
                                            onClick={() => setIsReportModalOpen(true)}
                                            aria-label="Báo cáo công thức"
                                            title="Báo cáo"
                                        >
                                            <MoreVertical size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Cách làm */}
                        <div className="recipe-section">
                            <h3 className="section-title dark"><CustomMedal /> Cách làm</h3>
                            {!isLocked ? (
                                <div>
                                    {safeParseArray(recipe.steps || recipe.instructions).map((step, i) => (
                                        <div key={i} className="recipe-step-item">
                                            <div className="step-number">{i + 1}</div>
                                            <div className="step-text">{step}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="locked-msg"><Lock /> Nội dung đã bị ẩn.</p>}
                        </div>


                    </div>
                </div>

            </div>
            <div className="recipe-cooksnap-wapper">
                <div className="recipe-cooksnap-section">
                    <img
                        src="https://global-web-assets.cpcdn.com/assets/empty_states/no_cooksnaps-f66c55e9ba9f02804b9b58a14dc73fe273ee54c782dd7d95406bb79613016612.svg"
                        alt="No cooksnaps"
                        className="recipe-cooksnap-illustration"
                    />
                    <h3 className="recipe-cooksnap-title">Đánh giá món đã nấu</h3>
                    <p className="recipe-cooksnap-desc">Gửi ảnh món bạn đã nấu kèm nhận xét.</p>
                    {cookSnapPreview && (
                        <div className="recipe-cooksnap-preview-card">
                            <img src={cookSnapPreview} alt="Ảnh món đã nấu" className="recipe-cooksnap-preview" />
                        </div>
                    )}
                    <div className="recipe-cooksnap-actions">
                        <div className="recipe-cooksnap-rating">
                            <span className="recipe-cooksnap-rating-label">So sao:</span>
                            <div className="recipe-cooksnap-stars" role="radiogroup" aria-label="Danh gia sao">
                                {[1, 2, 3, 4, 5].map((starValue) => (
                                    <button
                                        key={starValue}
                                        type="button"
                                        className={`recipe-cooksnap-star ${starValue <= cookSnapRating ? 'active' : ''}`}
                                        onClick={() => setCookSnapRating(starValue)}
                                        disabled={isLocked || isSubmittingCooksnap}
                                        aria-label={`${starValue} sao`}
                                    >
                                        <Star size={18} fill={starValue <= cookSnapRating ? '#f1c40f' : 'none'} color={starValue <= cookSnapRating ? '#f1c40f' : '#9ca3af'} />
                                    </button>
                                ))}
                            </div>
                            <span className="recipe-cooksnap-rating-value">{cookSnapRating}/5</span>
                        </div>

                        <label htmlFor="cooksnap-input" className={`btn-cooksnap-upload ${isLocked ? 'disabled' : ''}`}>
                            <Camera size={18} /> {cookSnapFile ? 'Đổi ảnh' : 'Chọn ảnh / Chụp ảnh'}
                        </label>
                        <input
                            id="cooksnap-input"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleCookSnapFileChange}
                            style={{ display: 'none' }}
                            disabled={isLocked}
                        />
                        <textarea
                            className="recipe-cooksnap-note"
                            placeholder="Nhận xét của bạn về món ăn (bắt buộc)"
                            value={cookSnapNote}
                            onChange={(e) => setCookSnapNote(e.target.value)}
                            disabled={isLocked}
                        />
                        <button
                            onClick={handleSubmitCooksnap}
                            disabled={isLocked || isSubmittingCooksnap}
                            className="btn-cook-done"
                        >
                            {isSubmittingCooksnap ? 'Đang gửi...' : 'Gửi đánh giá '}
                        </button>
                    </div>
                </div>
            </div>

            <PremiumModal
                isOpen={isPremiumModalOpen}
                onClose={() => setIsPremiumModalOpen(false)}
                user={currentUser || {}}
                onUpgradeSuccess={() => window.location.reload()}
            />

            {/* Modal Báo cáo */}
            <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Báo cáo công thức">
                <p style={{ marginBottom: '15px', color: '#666' }}>Vui lòng cho biết lý do bạn báo cáo công thức <b>{recipe.title || recipe.name}</b>:</p>
                <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Nhập lý do báo cáo..."
                    style={{ width: '100%', minHeight: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '15px' }}
                />
                <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button className="btn-confirm-no" onClick={() => setIsReportModalOpen(false)}>Hủy</button>
                    <button className="btn-confirm-yes"  onClick={handleReportRecipe}>Gửi báo cáo</button>
                </div>
            </Modal>

            <div ref={reviewsRef} className="recipe-reviews-wrapper">
                <RecipeReviews recipeId={id} refreshKey={reviewRefreshKey} />
            </div>
        </div>
    );
};

export default RecipeDetailPage;