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
      {/* Animated outer glow rings with CSS animations */}
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

      {/* Main Jupiter sphere container with CSS animations */}
      <div
        className={`relative rounded-full overflow-hidden transition-all duration-300 animate-pulse ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
        onClick={onClick}
        style={{
          width: size,
          height: size,
          background: `
            repeating-linear-gradient(90deg, 
              rgba(140, 60, 10, 0.8) 0%,
              rgba(180, 80, 15, 0.9) 6%,
              rgba(100, 40, 8, 0.7) 12%,
              rgba(200, 90, 20, 0.85) 18%,
              rgba(160, 70, 12, 0.8) 24%,
              rgba(220, 100, 25, 0.9) 30%,
              rgba(120, 50, 10, 0.75) 36%,
              rgba(190, 85, 18, 0.85) 42%
            )
          `,
          boxShadow: `
            0 0 60px rgba(255, 112, 0, 0.4),
            inset 0 0 60px rgba(255, 140, 0, 0.2),
            inset 20px 20px 60px rgba(208, 73, 7, 0.3),
            inset -20px -20px 60px rgba(255, 140, 0, 0.1)
          `,
          border: '1px solid rgba(255, 140, 0, 0.3)',
          animation: 'jupiterRotate 15s linear infinite',
        }}
        onMouseEnter={(e) => {
          if (onClick) {
            e.currentTarget.style.filter = 'brightness(1.1) saturate(1.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (onClick) {
            e.currentTarget.style.filter = 'brightness(1) saturate(1)';
          }
        }}
      >
        {/* Jupiter atmospheric layers */}
        <div
          className="absolute inset-2 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(180, 80, 15, 0.4) 0%, transparent 35%),
              radial-gradient(circle at 80% 30%, rgba(220, 100, 25, 0.3) 0%, transparent 40%),
              radial-gradient(circle at 30% 85%, rgba(140, 60, 10, 0.25) 0%, transparent 45%),
              radial-gradient(circle at 70% 75%, rgba(200, 90, 20, 0.2) 0%, transparent 35%)
            `,
            filter: 'blur(15px)',
          }}
        />

        {/* Jupiter storm systems */}
        <div
          className="absolute inset-4 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 60% 40%, rgba(255, 140, 0, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 40% 70%, rgba(180, 80, 15, 0.25) 0%, transparent 45%),
              radial-gradient(circle at 80% 80%, rgba(220, 100, 25, 0.2) 0%, transparent 40%)
            `,
            filter: 'blur(8px)',
          }}
        />

        {/* Central core */}
        {voiceSupported && (
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(255, 140, 0, 1) 0%, rgba(255, 112, 0, 0.8) 70%)',
              boxShadow: '0 0 20px rgba(255, 140, 0, 0.8), 0 0 40px rgba(255, 112, 0, 0.4)',
            }}
          />
        )}

        {/* Mic icon when voice not supported */}
        {!voiceSupported && (
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{
              width: size * 0.6,
              height: size * 0.6,
            }}
          >
            <MicOff 
              size={size * 0.3}
              className="text-white/90" 
              strokeWidth={1.5}
            />
          </div>
        )}

        {/* Surface texture overlay */}
        <div
          className="absolute inset-0 rounded-full opacity-30"
          style={{
            background: `
              repeating-conic-gradient(
                from 0deg at 50% 50%,
                transparent 0deg,
                rgba(255, 140, 0, 0.1) 2deg,
                transparent 4deg
              )
            `,
          }}
        />

        {/* Highlight reflection */}
        <div
          className="absolute top-4 left-4 w-16 h-16 rounded-full opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%)',
            filter: 'blur(8px)',
          }}
        />
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

      <style jsx>{`
        @keyframes jupiterRotate {
          0% { background-position-x: 0%; }
          100% { background-position-x: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SphereChat;