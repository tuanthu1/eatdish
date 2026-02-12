import React, { useState } from 'react';
import Modal from '../Modal';
const UploadModal = ({
    isOpen,
    onClose,
    user,
    uploadData,
    setUploadData,
    uploadPreview,
    setUploadPreview,
    handleSubmitRecipe
}) => {

    const [tempIngredient, setTempIngredient] = useState('');
    const [tempStep, setTempStep] = useState('');

    const handleRecipeFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadData(prev => ({ ...prev, image: file }));
        setUploadPreview(URL.createObjectURL(file));
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
    const handleAddVideoURL = (e) => {
        const url = e.target.value;
        setUploadData(prev => ({
            ...prev,
            video_url: url
        }));
    }
    const handleRemoveItem = (type, index) => {
        setUploadData(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };
    const btnOrange = {
        width: '100%', padding: '15px', background: '#ff9f1c', color: '#fff',
        border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px'
    };
    const inputStyle = {
        width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #eee',
        background: '#f9fafc', marginBottom: '15px', outline: 'none', fontSize: '14px'
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chia sẻ công thức mới">
            <div style={{ padding: '0 10px 20px 10px', maxHeight: '75vh', overflowY: 'auto' }}>
                    {/*  Hiển thị Avatar & Tên người đang đăng  */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                        <img 
                            src={user.avatar || 'https://via.placeholder.com/50'} 
                            alt="My Avatar" 
                            style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ff9f1c' }}
                        />
                        <div>
                            <div style={{ fontWeight: 'bold', color: '#2d3436', fontSize: '15px' }}>
                                {user.fullname || user.username || 'Đầu bếp EatDish'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#888' }}>
                                Đang sáng tạo công thức mới 🍳
                            </div>
                        </div>
                    </div>
                    {/* Ảnh món ăn */}
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <label style={{ cursor: 'pointer', display: 'block' }}>
                            {uploadPreview ? (
                                <img src={uploadPreview} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '15px' }} alt="preview" />
                            ) : (
                                <div style={{ width: '100%', height: '150px', background: '#f0f0f0', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888', border: '2px dashed #ccc' }}>
                                    <span style={{ fontSize: '30px' }}>📷</span>
                                    <span>Nhấn để chọn ảnh món ăn</span>
                                </div>
                            )}
                            <input type="file" hidden accept="image/*" onChange={handleRecipeFileChange} />
                        </label>
                    </div>

                    {/* Thông tin chính */}
                    <textarea type="text" placeholder="Tên món (VD: Phở Bò)" value={uploadData.name} onChange={e => setUploadData({...uploadData, name: e.target.value})} style={{...inputStyle, minHeight: '40px'}} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <input type="text" placeholder="Thời gian (VD: 30p)" value={uploadData.time} onChange={e => setUploadData({...uploadData, time: e.target.value})} style={inputStyle} />
                        <input type="number" placeholder="Calo (VD: 500)" value={uploadData.calories} onChange={e => setUploadData({...uploadData, calories: e.target.value})} style={inputStyle} />
                    </div>
                    <input type="text" placeholder="Video hướng dẫn (URL Youtube)" value={uploadData.video_url} onChange={handleAddVideoURL} style={inputStyle} />
                    <textarea placeholder="Mô tả ngắn về món ăn..." value={uploadData.description} onChange={e => setUploadData({...uploadData, description: e.target.value})} style={{ ...inputStyle, minHeight: '60px' }}></textarea>

                    {/*  Nhập Nguyên liệu */}
                    <div style={{ marginBottom: '20px', background: '#fffcf5', padding: '15px', borderRadius: '15px', border: '1px solid #ffeaa7' }}>
                        <label style={{fontWeight:'bold', color:'#ff9f1c', display:'block', marginBottom:'10px'}}>🛒 Nguyên liệu</label>
                        <ul style={{ paddingLeft: '20px', marginBottom: '10px' }}>
                            {uploadData.ingredients.map((ing, idx) => (
                                <li key={idx} style={{ marginBottom: '5px' }}>
                                    {ing} <span onClick={() => handleRemoveItem('ingredients', idx)} style={{ color: 'red', cursor: 'pointer', marginLeft: '10px', fontSize: '12px' }}>(Xóa)</span>
                                </li>
                            ))}
                        </ul>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="text" placeholder="VD: 500g Thịt bò..." value={tempIngredient} onChange={e => setTempIngredient(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} onKeyPress={e => e.key === 'Enter' && handleAddIngredient()} />
                            <button onClick={handleAddIngredient} style={{ background: '#ff9f1c', color: '#fff', border: 'none', borderRadius: '10px', width: '50px', cursor: 'pointer', fontWeight:'bold' }}>+</button>
                        </div>
                    </div>

                    {/*  Nhập Bước làm */}
                    <div style={{ marginBottom: '20px', background: '#f5f6fa', padding: '15px', borderRadius: '15px', border: '1px solid #dcdde1' }}>
                        <label style={{fontWeight:'bold', color:'#2f3640', display:'block', marginBottom:'10px'}}>👩‍🍳 Các bước thực hiện</label>
                        <div style={{ marginBottom: '10px' }}>
                            {uploadData.steps.map((step, idx) => (
                                <div key={idx} style={{ marginBottom: '8px', display: 'flex', gap: '10px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#ff9f1c' }}>B{idx + 1}:</span>
                                    <span style={{ flex: 1 }}>{step}</span>
                                    <span onClick={() => handleRemoveItem('steps', idx)} style={{ color: 'red', cursor: 'pointer', fontSize: '12px' }}>✕</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <textarea placeholder="VD: Đun sôi nước..." value={tempStep} onChange={e => setTempStep(e.target.value)} style={{ ...inputStyle, marginBottom: 0, minHeight: '50px' }}></textarea>
                            <button onClick={handleAddStep} style={{ background: '#2f3640', color: '#fff', border: 'none', borderRadius: '10px', width: '50px', cursor: 'pointer', fontWeight:'bold' }}>+</button>
                        </div>
                    </div>

                    <button onClick={handleSubmitRecipe} style={btnOrange}>Đăng công thức ngay! 🚀</button>
                </div>
        </Modal>
    );
};

export default UploadModal;
