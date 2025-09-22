import React, { useState, useEffect, useRef } from 'react';
import { MicOff } from 'lucide-react';

interface SphereChatProps {
  size?: number;
  isActive?: boolean;
  isListening?: boolean;
  isThinking?: boolean;
  isResponding?: boolean;
  onClick?: () => void;
  voiceSupported?: boolean;
}

const SphereChat: React.FC<SphereChatProps> = ({
  size = 180,
  isActive = false,
  isListening = false,
  isThinking = false,
  isResponding = false,
  onClick,
  voiceSupported = true
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [clickRipples, setClickRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const sphereRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for subtle movement effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate relative position (normalized to -1 to 1)
        const relativeX = (e.clientX - centerX) / (rect.width / 2);
        const relativeY = (e.clientY - centerY) / (rect.height / 2);

        // Limit movement range and apply subtle offset
        const maxOffset = 8;
        setMousePosition({
          x: Math.max(-maxOffset, Math.min(maxOffset, relativeX * maxOffset)),
          y: Math.max(-maxOffset, Math.min(maxOffset, relativeY * maxOffset))
        });
      }
    };

    if (isHovered && onClick) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHovered, onClick]);

  // Click ripple effect
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newRipple = { id: Date.now(), x, y };
      setClickRipples(prev => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setClickRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 1000);

      onClick();
    }
  };

  // Dynamic animation based on state
  const getAnimationClass = () => {
    if (isListening) return 'animate-pulse-fast';
    if (isThinking) return 'animate-spin-slow';
    if (isResponding) return 'animate-bounce-gentle';
    return 'animate-breathe';
  };

  const getGlowIntensity = () => {
    if (isListening) return 0.9;
    if (isThinking || isResponding) return 0.7;
    if (isHovered) return 0.6;
    return 0.4;
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 0, y: 0 });
      }}
    >
      {/* Dynamic outer glow rings based on state */}
      <div
        className={`absolute rounded-full transition-all duration-500 ${getAnimationClass()}`}
        style={{
          width: size + 80,
          height: size + 80,
          background: `radial-gradient(circle, rgba(255, 112, 0, ${0.15 * getGlowIntensity()}) 0%, transparent 70%)`,
          filter: `blur(${isListening ? '30px' : '20px'})`,
          transform: `translate(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px)`,
        }}
      />

      <div
        className={`absolute rounded-full transition-all duration-500 ${getAnimationClass()}`}
        style={{
          width: size + 40,
          height: size + 40,
          background: `radial-gradient(circle, rgba(255, 140, 0, ${0.2 * getGlowIntensity()}) 0%, transparent 60%)`,
          filter: `blur(${isListening ? '20px' : '15px'})`,
          transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
        }}
      />

      {/* Enhanced Interactive Avatar */}
      <div
        ref={sphereRef}
        className={`relative rounded-full transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${getAnimationClass()}`}
        onClick={handleClick}
        style={{
          width: size,
          height: size,
          background: isListening
            ? 'linear-gradient(45deg, #FF7000, #FF8C00, #FF7000)'
            : '#FF7000',
          boxShadow: `
            0 0 ${isListening ? '80px' : '60px'} rgba(255, 112, 0, ${getGlowIntensity()}),
            0 0 30px rgba(255, 112, 0, 0.4),
            inset 0 0 20px rgba(255, 140, 0, 0.3)
          `,
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px) scale(${isHovered && onClick ? 1.05 : 1})`,
          filter: isHovered && onClick ? 'brightness(1.15)' : 'brightness(1)',
        }}
      >
        {/* Click ripple effects */}
        {clickRipples.map((ripple) => (
          <div
            key={ripple.id}
            className="absolute rounded-full pointer-events-none animate-ping"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
              background: 'rgba(255, 112, 0, 0.6)',
              animationDuration: '1s',
            }}
          />
        ))}

        {/* Subtle indicator when voice not supported */}
        {!voiceSupported && (
          <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-red-500/80 border border-red-300/50 animate-pulse-gentle"
               title="Voice not supported in this browser" />
        )}

        {/* Subtle inner glow for depth */}
        <div
          className="absolute inset-4 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(255, 140, 0, 0.4) 0%, transparent 70%)',
            filter: 'blur(8px)',
          }}
        />
      </div>

      {/* Enhanced Activity indicator ring */}
      {(isActive || isListening) && (
        <div
          className="absolute rounded-full border-2 transition-all duration-300"
          style={{
            width: size + 20,
            height: size + 20,
            borderColor: isListening ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255, 140, 0, 0.8)',
            borderStyle: isListening ? 'solid' : 'dashed',
            animation: isListening ? 'pulse-ring 1.5s ease-in-out infinite' : 'pulse 2s ease-in-out infinite',
            transform: `translate(${mousePosition.x * 0.2}px, ${mousePosition.y * 0.2}px)`,
          }}
        />
      )}

      <style jsx>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.02);
            opacity: 0.9;
          }
        }

        @keyframes pulse-fast {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.1);
            opacity: 0;
          }
        }

        .animate-breathe {
          animation: breathe 4s ease-in-out infinite;
        }

        .animate-pulse-fast {
          animation: pulse-fast 1s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 1s ease-in-out infinite;
        }

        .animate-pulse-gentle {
          animation: pulse-gentle 2s ease-in-out infinite;
        }

        @keyframes pulse-gentle {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
};

export default SphereChat;