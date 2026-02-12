import React, { useState, useEffect } from 'react';
const Navbar = ({onSearch, onOpenFilter}) => {

  const [keyword, setKeyword] = useState("");
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch(keyword); 
    }
  };
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch(keyword);
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [keyword]);
  return (
    <div className="header">
      <div className="search-bar">
        <span>🔍</span>
        <input type="text" placeholder="Tìm kiếm món ăn ngon..." value={keyword} onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown} />
      </div>
      <div className="filter-btn" onClick={onOpenFilter} style={{cursor: 'pointer'}}>⚙️ Bộ Lọc</div>
    </div>
  );
};

export default Navbar;