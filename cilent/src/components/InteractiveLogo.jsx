import React from 'react';
import logoHat from '../logo/logo1.png'; 
import logoText from '../logo/logo3.png';

const InteractiveLogo = () => {
  const bounceAnimation = `
    @keyframes bounceHat {
      0%, 100% {
        transform: translateY(0) rotate(-15deg);
      }
      50% {
        transform: translateY(-8px) rotate(-9deg);
      }
    }
  `;

  return (
    <>
      <style>{bounceAnimation}</style>

      <div
        className="logo-container"
        style={{
          position: 'relative',
          display: 'inline-block',
          width: '200px',
          height: '100px',
          right: '21px',
          overflow: 'visible'
        }}
      >
        <img
          src={logoText}
          alt="EatDish Text"
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            userSelect: 'none',
            position: 'relative', 
            zIndex: 1 
          }}
          draggable={false}
        />

        {/* Ảnh mũ ( nhảy)*/}
        <img
          src={logoHat}
          alt="EatDish Hat"
          style={{
            position: 'absolute',
            top: '-30px',
            left: '-15px',
            width: '25%',
            height: 'auto',
            userSelect: 'none',
            zIndex: 2, 

            pointerEvents: 'none',
            animation: 'bounceHat 2s ease-in-out infinite'
          }}
          draggable={false}
        />
      </div>
    </>
  );
};

export default InteractiveLogo;