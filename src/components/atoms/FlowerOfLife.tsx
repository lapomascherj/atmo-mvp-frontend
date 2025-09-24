import React, { useState } from 'react';

interface FlowerOfLifeProps {
  size?: number;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  hasNewContent?: boolean;
}

const FlowerOfLife: React.FC<FlowerOfLifeProps> = ({ 
  size = 48, 
  isActive = false, 
  onClick, 
  className = '',
  hasNewContent = false
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (onClick) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000); // 2 seconds animation
      onClick();
    }
  };

  return (
    <div
      className={`cursor-pointer transition-all duration-300 hover:scale-110 ${className}`}
      onClick={handleClick}
      style={{
        filter: isAnimating ? 'drop-shadow(0 0 20px rgba(218, 165, 32, 0.8))' : 'drop-shadow(0 0 10px rgba(184, 134, 11, 0.5))'
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className={`
          transition-all duration-300
          ${isAnimating ? 'animate-spin-fast' : ''}
          ${hasNewContent ? 'animate-pulse-gold' : ''}
        `}
        style={{
          animation: isAnimating
            ? 'spinSlow 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            : hasNewContent
            ? 'pulseGold 2s ease-in-out infinite'
            : 'none'
        }}
      >
        <defs>
          <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={isAnimating ? "4" : "2"} result="coloredBlur"/>
            <feColorMatrix type="matrix" values="1 0.84 0 0 0  1 0.84 0 0 0  0 0 0 0 0  0 0 0 1 0" result="goldBlur"/>
            <feMerge>
              <feMergeNode in="goldBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <radialGradient id="goldRadial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(218, 165, 32, 1)" />
            <stop offset="50%" stopColor="rgba(184, 134, 11, 0.95)" />
            <stop offset="80%" stopColor="rgba(160, 116, 10, 0.9)" />
            <stop offset="100%" stopColor="rgba(139, 101, 8, 0.8)" />
          </radialGradient>
          <linearGradient id="goldLinear" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(218, 165, 32, 1)" />
            <stop offset="50%" stopColor="rgba(184, 134, 11, 0.98)" />
            <stop offset="100%" stopColor="rgba(160, 116, 10, 0.95)" />
          </linearGradient>
        </defs>

        {/* Complete Flower of Life pattern - High Definition Gold */}
        {/* Center circle */}
        <circle cx="100" cy="100" r="22" fill="none" stroke="url(#goldRadial)" strokeWidth="1.5" filter="url(#goldGlow)" />

        {/* First ring - 6 circles around center */}
        <circle cx="100" cy="78" r="22" fill="none" stroke="url(#goldLinear)" strokeWidth="1.4" filter="url(#goldGlow)" />
        <circle cx="119" cy="89" r="22" fill="none" stroke="url(#goldLinear)" strokeWidth="1.4" filter="url(#goldGlow)" />
        <circle cx="119" cy="111" r="22" fill="none" stroke="url(#goldLinear)" strokeWidth="1.4" filter="url(#goldGlow)" />
        <circle cx="100" cy="122" r="22" fill="none" stroke="url(#goldLinear)" strokeWidth="1.4" filter="url(#goldGlow)" />
        <circle cx="81" cy="111" r="22" fill="none" stroke="url(#goldLinear)" strokeWidth="1.4" filter="url(#goldGlow)" />
        <circle cx="81" cy="89" r="22" fill="none" stroke="url(#goldLinear)" strokeWidth="1.4" filter="url(#goldGlow)" />

        {/* Second ring - 12 circles */}
        <circle cx="100" cy="56" r="22" fill="none" stroke="rgba(184, 134, 11, 0.95)" strokeWidth="1.2" filter="url(#goldGlow)" />
        <circle cx="138" cy="78" r="22" fill="none" stroke="rgba(184, 134, 11, 0.95)" strokeWidth="1.2" filter="url(#goldGlow)" />
        <circle cx="138" cy="122" r="22" fill="none" stroke="rgba(184, 134, 11, 0.95)" strokeWidth="1.2" filter="url(#goldGlow)" />
        <circle cx="100" cy="144" r="22" fill="none" stroke="rgba(184, 134, 11, 0.95)" strokeWidth="1.2" filter="url(#goldGlow)" />
        <circle cx="62" cy="122" r="22" fill="none" stroke="rgba(184, 134, 11, 0.95)" strokeWidth="1.2" filter="url(#goldGlow)" />
        <circle cx="62" cy="78" r="22" fill="none" stroke="rgba(184, 134, 11, 0.95)" strokeWidth="1.2" filter="url(#goldGlow)" />

        {/* Additional circles for complete pattern */}
        <circle cx="119" cy="67" r="22" fill="none" stroke="rgba(160, 116, 10, 0.92)" strokeWidth="1.1" filter="url(#goldGlow)" />
        <circle cx="138" cy="100" r="22" fill="none" stroke="rgba(160, 116, 10, 0.92)" strokeWidth="1.1" filter="url(#goldGlow)" />
        <circle cx="119" cy="133" r="22" fill="none" stroke="rgba(160, 116, 10, 0.92)" strokeWidth="1.1" filter="url(#goldGlow)" />
        <circle cx="81" cy="133" r="22" fill="none" stroke="rgba(160, 116, 10, 0.92)" strokeWidth="1.1" filter="url(#goldGlow)" />
        <circle cx="62" cy="100" r="22" fill="none" stroke="rgba(160, 116, 10, 0.92)" strokeWidth="1.1" filter="url(#goldGlow)" />
        <circle cx="81" cy="67" r="22" fill="none" stroke="rgba(160, 116, 10, 0.92)" strokeWidth="1.1" filter="url(#goldGlow)" />
      </svg>

      <style jsx>{`
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulseGold {
          0%, 100% {
            filter: drop-shadow(0 0 10px rgba(184, 134, 11, 0.5));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(218, 165, 32, 0.8));
          }
        }
      `}</style>
    </div>
  );
};

export default FlowerOfLife;