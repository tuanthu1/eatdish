import React, { useState } from 'react';
import Modal from '../Modal';

const FilterModal = ({ isOpen, onClose, onApply }) => {
  // Quản lý dữ liệu nhập vào
  const [maxCal, setMaxCal] = useState('');
  const [maxTime, setMaxTime] = useState('');
  const [ingredient, setIngredient] = useState('');

  const handleApply = () => {
    onApply({ maxCal, maxTime, ingredient });
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="⚙️ Bộ lọc món ăn"
    >
      <div className="modal-body">
        <div className="input-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Calories tối đa (kcal)
          </label>
          <input 
            type="number" 
            placeholder="Ví dụ: 500" 
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            value={maxCal}
            onChange={(e) => setMaxCal(e.target.value)}
          />
        </div>

        <div className="input-group" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Thời gian nấu tối đa (phút)
          </label>
          <input 
            type="number" 
            placeholder="Ví dụ: 30" 
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            value={maxTime}
            onChange={(e) => setMaxTime(e.target.value)}
          />
        </div>
        <div className="input-group" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Nguyên liệu (tên nguyên liệu)
          </label>
          <input 
            type="text" 
            placeholder="Ví dụ: thịt bò, tôm..." 
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            value={ingredient}
            onChange={(e) => setIngredient(e.target.value)}
          />
        </div>

        <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose}
            style={{ padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleApply}
            style={{ 
              padding: '8px 15px', 
              borderRadius: '8px', 
              border: 'none', 
              backgroundColor: '#ff9f43', 
              color: 'white', 
              fontWeight: 'bold',
              cursor: 'pointer' 
            }}
          >
            Áp dụng
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default FilterModal;