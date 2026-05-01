import React from 'react';
import ReactDOM from 'react-dom';
import '../index.css';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal show" onClick={onClose}> 
      
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        
        <h3 className="modal-header-title">{title}</h3>
        {children}
      </div>
      
    </div>,
    document.body
  );
};

export default Modal;