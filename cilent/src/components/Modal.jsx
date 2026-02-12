import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal show" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h3 style={{ marginBottom: '15px' }}>{title}</h3>
        {children}
      </div>
    </div>
  );
};

export default Modal;