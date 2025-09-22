import React from 'react';
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

  return (
    <div className="relative flex items-center justify-center">
      {/* Animated outer glow rings */}
      <div
        className="absolute rounded-full animate-pulse"
        style={{
          width: size + 80,
          height: size + 80,
          background: 'radial-gradient(circle, rgba(255, 112, 0, 0.15) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      <div
        className="absolute rounded-full animate-pulse"
        style={{
          width: size + 40,
          height: size + 40,
          background: 'radial-gradient(circle, rgba(255, 140, 0, 0.2) 0%, transparent 60%)',
          filter: 'blur(15px)',
        }}
      />

      {/* Simple Orange Dot */}
      <div
        className={`relative rounded-full transition-all duration-300 ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
        onClick={onClick}
        style={{
          width: size,
          height: size,
          background: '#FF7000',
          boxShadow: `
            0 0 60px rgba(255, 112, 0, 0.6),
            0 0 30px rgba(255, 112, 0, 0.4),
            inset 0 0 20px rgba(255, 140, 0, 0.3)
          `,
        }}
        onMouseEnter={(e) => {
          if (onClick) {
            e.currentTarget.style.filter = 'brightness(1.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (onClick) {
            e.currentTarget.style.filter = 'brightness(1)';
          }
        }}
      >
        {/* Mic icon when voice not supported */}
        {!voiceSupported && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <MicOff
              size={size * 0.3}
              className="text-white/90"
              strokeWidth={1.5}
            />
          </div>
        )}
      </div>

      {/* Activity indicator ring */}
      {(isActive || isListening) && (
        <div
          className="absolute rounded-full border-2 animate-pulse"
          style={{
            width: size + 20,
            height: size + 20,
            borderColor: isListening ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 140, 0, 0.6)',
            borderStyle: 'dashed',
          }}
        />
      )}
    </div>
  );
};

export default SphereChat;