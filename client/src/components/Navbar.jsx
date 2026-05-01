import { Settings } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import '../index.css';
import { Search } from 'lucide-react';
const Navbar = ({ onSearch, onOpenFilter }) => {
  const [keyword, setKeyword] = useState("");
  const isMounted = useRef(false); 

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch(keyword); 
    }
  };

  useEffect(() => {
    if (!isMounted.current) {
        isMounted.current = true;
        return;
    }

    const delayDebounceFn = setTimeout(() => {
      onSearch(keyword);
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [keyword]); 

  return (
    <div className="header">
      <div className="search-bar">
        <span><Search /></span>
        <input 
            type="text" 
            placeholder="Tìm kiếm món ăn ngon..." 
            value={keyword} 
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown} 
            autoComplete="off"
        />
      </div>
      <div className="filter-btn cursor-pointer" onClick={onOpenFilter}>< Settings /> Bộ Lọc</div>
    </div>
  );
};

export default Navbar;