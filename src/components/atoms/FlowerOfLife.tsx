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
      setTimeout(() => setIsAnimating(false), 1200); // 1.2 seconds animation
      onClick();
    }
  };

  return (
    <div
      className={`cursor-pointer transition-all duration-300 hover:scale-110 ${className}`}
      onClick={handleClick}
      style={{
        filter: isAnimating ? 'drop-shadow(0 0 20px rgba(255, 112, 0, 0.8))' : 'drop-shadow(0 0 8px rgba(255, 112, 0, 0.4))'
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
            ? 'spinFast 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            : hasNewContent
            ? 'pulseOrange 2s ease-in-out infinite'
            : 'none'
        }}
      >
        <defs>
          <filter id="orangeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={isAnimating ? "3" : "1.5"} result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <radialGradient id="orangeRadial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 112, 0, 1)" />
            <stop offset="70%" stopColor="rgba(255, 112, 0, 0.8)" />
            <stop offset="100%" stopColor="rgba(255, 112, 0, 0.4)" />
          </radialGradient>
        </defs>
        
        {/* Outer boundary circles */}
        <circle cx="100" cy="100" r="85" fill="none" stroke="url(#orangeRadial)" strokeWidth="1.2" filter="url(#orangeGlow)" />
        <circle cx="100" cy="100" r="78" fill="none" stroke="rgba(255, 112, 0, 0.7)" strokeWidth="0.8" filter="url(#orangeGlow)" />

        {/* Complete Flower of Life pattern - 19 circles total */}
        {/* Center circle */}
        <circle cx="100" cy="100" r="22" fill="none" stroke="url(#orangeRadial)" strokeWidth="1" filter="url(#orangeGlow)" />

        {/* First ring - 6 circles around center */}
        <circle cx="100" cy="78" r="22" fill="none" stroke="rgba(255, 112, 0, 0.95)" strokeWidth="1" filter="url(#orangeGlow)" />
        <circle cx="119" cy="89" r="22" fill="none" stroke="rgba(255, 112, 0, 0.95)" strokeWidth="1" filter="url(#orangeGlow)" />
        <circle cx="119" cy="111" r="22" fill="none" stroke="rgba(255, 112, 0, 0.95)" strokeWidth="1" filter="url(#orangeGlow)" />
        <circle cx="100" cy="122" r="22" fill="none" stroke="rgba(255, 112, 0, 0.95)" strokeWidth="1" filter="url(#orangeGlow)" />
        <circle cx="81" cy="111" r="22" fill="none" stroke="rgba(255, 112, 0, 0.95)" strokeWidth="1" filter="url(#orangeGlow)" />
        <circle cx="81" cy="89" r="22" fill="none" stroke="rgba(255, 112, 0, 0.95)" strokeWidth="1" filter="url(#orangeGlow)" />

        {/* Second ring - 12 circles */}
        <circle cx="100" cy="56" r="22" fill="none" stroke="rgba(255, 112, 0, 0.85)" strokeWidth="0.9" filter="url(#orangeGlow)" />
        <circle cx="138" cy="78" r="22" fill="none" stroke="rgba(255, 112, 0, 0.85)" strokeWidth="0.9" filter="url(#orangeGlow)" />
        <circle cx="138" cy="122" r="22" fill="none" stroke="rgba(255, 112, 0, 0.85)" strokeWidth="0.9" filter="url(#orangeGlow)" />
        <circle cx="100" cy="144" r="22" fill="none" stroke="rgba(255, 112, 0, 0.85)" strokeWidth="0.9" filter="url(#orangeGlow)" />
        <circle cx="62" cy="122" r="22" fill="none" stroke="rgba(255, 112, 0, 0.85)" strokeWidth="0.9" filter="url(#orangeGlow)" />
        <circle cx="62" cy="78" r="22" fill="none" stroke="rgba(255, 112, 0, 0.85)" strokeWidth="0.9" filter="url(#orangeGlow)" />

        {/* Additional circles for complete pattern */}
        <circle cx="119" cy="67" r="22" fill="none" stroke="rgba(255, 112, 0, 0.75)" strokeWidth="0.8" filter="url(#orangeGlow)" />
        <circle cx="138" cy="100" r="22" fill="none" stroke="rgba(255, 112, 0, 0.75)" strokeWidth="0.8" filter="url(#orangeGlow)" />
        <circle cx="119" cy="133" r="22" fill="none" stroke="rgba(255, 112, 0, 0.75)" strokeWidth="0.8" filter="url(#orangeGlow)" />
        <circle cx="81" cy="133" r="22" fill="none" stroke="rgba(255, 112, 0, 0.75)" strokeWidth="0.8" filter="url(#orangeGlow)" />
        <circle cx="62" cy="100" r="22" fill="none" stroke="rgba(255, 112, 0, 0.75)" strokeWidth="0.8" filter="url(#orangeGlow)" />
        <circle cx="81" cy="67" r="22" fill="none" stroke="rgba(255, 112, 0, 0.75)" strokeWidth="0.8" filter="url(#orangeGlow)" />
      </svg>

      <style jsx>{`
        @keyframes spinFast {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(720deg); }
        }
        
        @keyframes pulseOrange {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(255, 112, 0, 0.4));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(255, 112, 0, 0.9));
          }
        }
      `}</style>
    </div>
  );
};

export default FlowerOfLife;