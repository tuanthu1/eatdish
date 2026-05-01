import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import ImageCropperModal from './ImageCropperModal';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import { Camera, Crown, ShoppingCart } from 'lucide-react';
import { DEFAULT_CATEGORY_OPTIONS, DEFAULT_MEALTYPE_OPTIONS } from '../../data/recipeClassifications';
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
const UploadModal = ({
    isOpen,
    onClose,
    user,
    uploadData,
    setUploadData,
    uploadPreview,
    setUploadPreview,
    handleSubmitRecipe,
    categoryOptions,
    mealTypeOptions
}) => {

    const categorySelectOptions = categoryOptions?.length ? categoryOptions : DEFAULT_CATEGORY_OPTIONS;
    const mealTypeSelectOptions = mealTypeOptions?.length ? mealTypeOptions : DEFAULT_MEALTYPE_OPTIONS;

    const [tempIngredient, setTempIngredient] = useState('');
    const [tempStep, setTempStep] = useState('');
    const [isCalculatingCal, setIsCalculatingCal] = useState(false);
    // State cho modal cắt ảnh
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [selectedFileToCrop, setSelectedFileToCrop] = useState(null);

    useEffect(() => {
        if (uploadData.ingredients.length === 0) return;

        const autoCalculateTimer = setTimeout(async () => {
            setIsCalculatingCal(true);
            try {
                const res = await axiosClient.post('/recipes/calculate-calories', {
                    ingredients: uploadData.ingredients,
                    steps: uploadData.steps
                });
                
                if (res.data.calories) {
                    setUploadData(prev => ({ ...prev, calories: `${res.data.calories} calo` }));
                }
            } catch (error) {
                console.error("Lỗi AI tự tính calo:", error);
            } finally {
                setIsCalculatingCal(false);
            }
        }, 1000); 
        return () => clearTimeout(autoCalculateTimer);
        
    }, [uploadData.ingredients, uploadData.steps]);
    const handleRecipeFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFileToCrop(file);
        setCropModalOpen(true);
        e.target.value = null;
    };

    const handleCropConfirm = (croppedFile) => {
        setUploadData(prev => ({ ...prev, image: croppedFile }));
        setUploadPreview(URL.createObjectURL(croppedFile));
        setCropModalOpen(false);
        setSelectedFileToCrop(null);
    };

    const handleAddIngredient = () => {
        if (!tempIngredient.trim()) return;
        setUploadData(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, tempIngredient.trim()]
        }));
        setTempIngredient('');
    };

    const handleAddStep = () => {
        if (!tempStep.trim()) return;
        setUploadData(prev => ({
            ...prev,
            steps: [...prev.steps, tempStep.trim()]
        }));
        setTempStep('');
    };

    const handleRemoveItem = (type, index) => {
        setUploadData(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    //  Hàm xử lý cập nhật nội dung khi người dùng sửa trực tiếp
    const handleEditItem = (type, index, newValue) => {
        setUploadData(prev => {
            const updatedList = [...prev[type]];
            updatedList[index] = newValue; 
            return { ...prev, [type]: updatedList };
        });
    };

    const handleAddVideoURL = (e) => {
        setUploadData(prev => ({
            ...prev,
            video_url: e.target.value
        }));
    }
    // 1Hàm xử lý gõ (Chỉ lấy số, lỡ gõ chữ sẽ tự xóa)
    const handleNumberInput = (field, value) => {
        const digitsOnly = value.replace(/[^0-9]/g, '');
        const normalizedValue = digitsOnly.replace(/^0+(?=\d)/, '');
        setUploadData(prev => ({ ...prev, [field]: normalizedValue }));
    };

    //Hiệu ứng Debounce: Chờ 1s sau khi ngừng gõ Calo
    useEffect(() => {
        const calVal = uploadData.calories;
        if (calVal && !String(calVal).includes('calo')) {
            const timer = setTimeout(() => {
                setUploadData(prev => ({ ...prev, calories: `${calVal} calo` }));
            }, 1000);
            
            return () => clearTimeout(timer);
        }
    }, [uploadData.calories]);

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Chia sẻ công thức mới">
                <div className="up-modal-content">
                        {/* Hiển thị Avatar & Tên người đang đăng */}
                        <div className="up-author-box">
                            <img 
                                src={user.avatar || 'https://via.placeholder.com/50'} 
                                alt="My Avatar" 
                                className="up-author-avt"
                            />
                            <div>
                                <div className="up-author-name">
                                    {user.fullname || user.username || 'Đầu bếp EatDish'}
                                </div>
                                <div className="up-author-status">
                                    Đang sáng tạo công thức mới...
                                </div>
                            </div>
                        </div>

                        {/* Ảnh món ăn */}
                        <div className="up-img-wrapper">
                            <label className="up-img-label">
                                {uploadPreview ? (
                                    <img src={uploadPreview} className="up-img-preview" alt="preview" />
                                ) : (
                                    <div className="up-img-placeholder">
                                        <span className="up-img-icon"><Camera /></span>
                                        <span>Nhấn để chọn ảnh món ăn</span>
                                    </div>
                                )}
                                <input type="file" hidden accept="image/*" onChange={handleRecipeFileChange} />
                            </label>
                        </div>

                        {/* Thông tin chính */}
                        <textarea 
                            placeholder="Tên món (VD: Phở Bò)" 
                            value={uploadData.name} 
                            onChange={e => setUploadData({...uploadData, name: e.target.value})} 
                            className="up-input up-input-mb0" 
                        />
                        
                        <div className="up-input-grid">
                            
                            {/* Ô 1: Nhập thời gian */}
                            <input 
                                type="text" 
                                placeholder="Thời gian (phút, VD: 30)" 
                                value={uploadData.time} 
                                onChange={e => handleNumberInput('time', e.target.value)}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="up-input up-input-mb0" 
                            />
                            
                            {/* Ô 2: Calo (AI tự tính, đã khóa nhập) để im sau nếu sửa sẽ cho thêm nhập */}
                            <input 
                                type="text" 
                                placeholder={isCalculatingCal ? " AI đang tính..." : "AI sẽ tự tính calo"} 
                                value={isCalculatingCal ? "" : uploadData.calories} 
                                readOnly={true} 
                                onClick={() => {
                                    if (!isCalculatingCal) {
                                        toast.info("Bạn không cần nhập calo, AI sẽ tự động tính giúp bạn nhé!");
                                    }
                                }}
                                className="up-input up-input-mb0" 
                                style={{
                                    backgroundColor: isCalculatingCal ? '#f1f2f6' : '#fafafa',
                                    color: isCalculatingCal ? '#e1b12c' : '#2d3436',
                                    fontWeight: isCalculatingCal ? 'bold' : 'normal',
                                    transition: 'all 0.3s ease',
                                    cursor: 'not-allowed',
                                    width: '100%' 
                                }}
                            />
                            
                        </div>

                        <div className="up-input-grid">
                            <select
                                value={uploadData.category || 'Khac'}
                                onChange={e => setUploadData({ ...uploadData, category: e.target.value })}
                                className="up-input up-input-mb0"
                            >
                                {categorySelectOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>

                            <select
                                value={uploadData.meal_type || 'Khong_xac_dinh'}
                                onChange={e => setUploadData({ ...uploadData, meal_type: e.target.value })}
                                className="up-input up-input-mb0"
                            >
                                {mealTypeSelectOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                        
                        <input type="text" placeholder="Video hướng dẫn (URL Youtube,TikTok)" value={uploadData.video_url} onChange={handleAddVideoURL} className="up-input" />
                        
                        <textarea 
                            placeholder="Mô tả ngắn về món ăn..." 
                            value={uploadData.description} 
                            onChange={e => setUploadData({...uploadData, description: e.target.value})} 
                            className="up-input" 
                            style={{ minHeight: '60px' }}
                        ></textarea>

                        {/* Nhập Nguyên liệu */}
                        <div className="up-section-box ing">
                            <label className="up-section-title orange"><ShoppingCart /> Nguyên liệu</label>
                            <ul className="up-list" style={{ listStyle: 'none', paddingLeft: 0 }}>
                                {uploadData.ingredients.map((ing, idx) => (
                                    <li key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ marginRight: '8px', color: '#ff9f1c' }}>•</span>
                                        <input 
                                            type="text" 
                                            value={ing}
                                            onChange={(e) => handleEditItem('ingredients', idx, e.target.value)}
                                            style={{ 
                                                flex: 1, border: 'none', borderBottom: '1px dashed #ffeaa7', 
                                                background: 'transparent', outline: 'none', fontSize: '14px', 
                                                padding: '2px 5px', color: '#2d3436' 
                                            }}
                                        />
                                        <span onClick={() => handleRemoveItem('ingredients', idx)} className="up-action-text">(Xóa)</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="up-add-row">
                                <input type="text" placeholder="VD: 500g Thịt bò..." value={tempIngredient} onChange={e => setTempIngredient(e.target.value)} className="up-input up-input-mb0" onKeyPress={e => e.key === 'Enter' && handleAddIngredient()} />
                                <button onClick={handleAddIngredient} className="up-btn-add orange">+</button>
                            </div>
                        </div>

                        {/* Nhập Bước làm */}
                        <div className="up-section-box step">
                            <label className="up-section-title dark"><CustomMedal /> Các bước thực hiện</label>
                            <div>
                                {uploadData.steps.map((step, idx) => (
                                    <div key={idx} className="up-step-item" style={{ alignItems: 'flex-start' }}>
                                        <span className="up-step-prefix" style={{ paddingTop: '8px' }}>B{idx + 1}:</span>
                                        <textarea 
                                            value={step}
                                            onChange={(e) => handleEditItem('steps', idx, e.target.value)}
                                            style={{ 
                                                flex: 1, border: '1px dashed #dcdde1', borderRadius: '8px', 
                                                background: '#fff', outline: 'none', padding: '8px', 
                                                fontSize: '14px', color: '#2d3436', minHeight: '45px', resize: 'vertical' 
                                            }}
                                        />
                                        <span onClick={() => handleRemoveItem('steps', idx)} className="up-action-text" style={{ marginLeft: '10px', paddingTop: '8px' }}>✕</span>
                                    </div>
                                ))}
                            </div>
                            <div className="up-add-row">
                                <textarea placeholder="VD: Đun sôi nước..." value={tempStep} onChange={e => setTempStep(e.target.value)} className="up-input up-input-mb0" style={{ minHeight: '50px' }}></textarea>
                                <button onClick={handleAddStep} className="up-btn-add dark">+</button>
                            </div>
                        </div>
                        {user?.is_premium === 1 && (
                            <div style={{ 
                                margin: '15px 0', 
                                padding: '10px', 
                                background: 'linear-gradient(45deg, #fff3cd, #ffeaa7)', 
                                borderRadius: '8px',
                                border: '1px dashed #ff9f1c'
                            }}>
                                <label style={{ cursor: 'pointer', fontWeight: 'bold', color: '#d35400', display: 'flex', alignItems: 'center' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={uploadData.is_premium === 1}
                                        onChange={(e) => setUploadData({...uploadData, is_premium: e.target.checked ? 1 : 0})}
                                        style={{ marginRight: '10px', transform: 'scale(1.3)' }}
                                    />
                                    <Crown /> Đăng làm công thức Premium (Không hiện quảng cáo)
                                </label>
                            </div>
                        )}

                        <button onClick={handleSubmitRecipe} className="up-btn-submit">Đăng công thức ngay! </button>
                    </div>
            </Modal>

            <ImageCropperModal
                isOpen={cropModalOpen}
                onClose={() => {
                    setCropModalOpen(false);
                    setSelectedFileToCrop(null);
                }}
                imageFile={selectedFileToCrop}
                onCropComplete={handleCropConfirm}
            />
        </>
    );
};

export default UploadModal;