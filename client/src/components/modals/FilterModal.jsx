import React, { useEffect, useState } from 'react';
import Modal from '../Modal';
import { DEFAULT_CATEGORY_OPTIONS, DEFAULT_MEALTYPE_OPTIONS, withAllOption } from '../../data/recipeClassifications';

const defaultFilters = {
  name: '',
  authorName: '',
  category: 'all',
  mealType: 'all',
  maxCal: '',
  maxTime: '',
  ingredient: '',
  hasVideo: false,
  premiumOnly: 'all',
  sortBy: 'newest',
};

const FilterModal = ({ isOpen, onClose, onApply, initialFilters, categoryOptions, mealTypeOptions }) => {
  const [filters, setFilters] = useState(defaultFilters);
  const categorySelectOptions = withAllOption(categoryOptions || DEFAULT_CATEGORY_OPTIONS, 'Tất cả danh mục');
  const mealTypeSelectOptions = withAllOption(mealTypeOptions || DEFAULT_MEALTYPE_OPTIONS, 'Tất cả phân loại món');

  useEffect(() => {
    if (isOpen) {
      setFilters({ ...defaultFilters, ...(initialFilters || {}) });
    }
  }, [isOpen, initialFilters]);

  const updateFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    onApply(filters); 
    onClose();
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    onApply(defaultFilters);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bộ lọc món ăn">
      <div className="modal-body filter-modal-body">
        <div className="filter-grid">
          <div className="filter-input-group">
            <label className="filter-label">Tên món ăn</label>
            <input
              type="text"
              placeholder="Ví dụ: phở bò, gà nướng..."
              className="filter-input"
              value={filters.name}
              onChange={(e) => updateFilter('name', e.target.value)}
            />
          </div>

          <div className="filter-input-group">
            <label className="filter-label">Người đăng</label>
            <input
              type="text"
              placeholder="Ví dụ: Nguyễn Văn A"
              className="filter-input"
              value={filters.authorName}
              onChange={(e) => updateFilter('authorName', e.target.value)}
            />
          </div>

          <div className="filter-input-group">
            <label className="filter-label">Loại món</label>
            <select
              className="filter-input filter-select"
              value={filters.premiumOnly}
              onChange={(e) => updateFilter('premiumOnly', e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="false">Miễn phí</option>
              <option value="true">Premium</option>
            </select>
          </div>

          <div className="filter-input-group">
            <label className="filter-label">Danh mục món</label>
            <select
              className="filter-input filter-select"
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
            >
              {categorySelectOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-input-group">
            <label className="filter-label">Phân loại món</label>
            <select
              className="filter-input filter-select"
              value={filters.mealType}
              onChange={(e) => updateFilter('mealType', e.target.value)}
            >
              {mealTypeSelectOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-input-group">
            <label className="filter-label">Sắp xếp theo</label>
            <select
              className="filter-input filter-select"
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="name_asc">Tên A-Z</option>
              <option value="name_desc">Tên Z-A</option>
              <option value="calories_asc">Calo tăng dần</option>
              <option value="calories_desc">Calo giảm dần</option>
              <option value="time_asc">Thời gian tăng dần</option>
              <option value="time_desc">Thời gian giảm dần</option>
            </select>
          </div>
        </div>

        <div className="filter-grid filter-grid-compact">
        <div className="filter-input-group">
          <label className="filter-label">Calories tối đa (kcal)</label>
          <input
            type="number"
            placeholder="Ví dụ: 500"
            className="filter-input"
            value={filters.maxCal}
            onChange={(e) => updateFilter('maxCal', e.target.value)}
          />
        </div>

        <div className="filter-input-group">
          <label className="filter-label">Thời gian nấu tối đa (phút)</label>
          <input
            type="number"
            placeholder="Ví dụ: 30"
            className="filter-input"
            value={filters.maxTime}
            onChange={(e) => updateFilter('maxTime', e.target.value)}
          />
        </div>
        
        <div className="filter-input-group">
          <label className="filter-label">Nguyên liệu (tên nguyên liệu)</label>
          <input
            type="text"
            placeholder="Ví dụ: thịt bò, tôm..."
            className="filter-input"
            value={filters.ingredient}
            onChange={(e) => updateFilter('ingredient', e.target.value)}
          />
        </div>
        </div>

        <label className="filter-checkbox-row" htmlFor="video-filter">
          <input 
            type="checkbox" 
            id="video-filter" 
            checked={filters.hasVideo}
            onChange={(e) => updateFilter('hasVideo', e.target.checked)}
          />
          <span>Chỉ hiện món có video</span>
        </label>

        <p className="filter-hint">Bộ lọc sẽ kết hợp tất cả tiêu chí đang chọn, bao gồm cả sắp xếp.</p>

        <div className="filter-footer filter-footer-spread">
          <button onClick={onClose} className="btn-filter-cancel">Hủy bỏ</button>
          <button onClick={handleReset} className="btn-filter-reset">Xóa lọc</button>
          <button onClick={handleApply} className="btn-filter-apply">Áp dụng</button>
        </div>
      </div>
    </Modal>
  );
};

export default FilterModal;