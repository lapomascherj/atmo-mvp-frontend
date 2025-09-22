import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw } from 'lucide-react';

interface GetCenteredCardProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

const GetCenteredCard: React.FC<GetCenteredCardProps> = ({ isOpen, onClose, children }) => {
  const [showMantra, setShowMantra] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMantra, setCurrentMantra] = useState('');
  const [isNewMantra, setIsNewMantra] = useState(false);

  // Meditation podcasts data
  const meditationPodcasts = [
    {
      title: "Morning Sacred Geometry",
      duration: "10 min",
      description: "Connect with the divine patterns of creation",
      audioUrl: "/audio/sacred-geometry-meditation.mp3"
    },
    {
      title: "Flower of Life Journey", 
      duration: "15 min",
      description: "Deep meditation on the interconnectedness of all life",
      audioUrl: "/audio/flower-of-life-meditation.mp3"
    },
    {
      title: "Golden Ratio Breathing",
      duration: "8 min", 
      description: "Harmonize your breath with the universe's rhythm",
      audioUrl: "/audio/golden-ratio-breathing.mp3"
    }
  ];

  // Daily mantras - authentic and meaningful
  const mantras = [
    "I am centered, calm, and present in this moment",
    "I breathe in peace, I breathe out love",
    "I trust the journey and embrace each step with grace",
    "I am grounded in my truth and open to growth",
    "I choose peace over worry, love over fear",
    "I am exactly where I need to be right now",
    "My heart is open and my mind is clear",
    "I radiate compassion and kindness to all beings",
    "I find strength in stillness and wisdom in silence",
    "I am grateful for this moment and all it offers"
  ];

  // Check for new mantra (6am daily)
  useEffect(() => {
    const checkForNewMantra = () => {
      const today = new Date().toDateString();
      const lastMantraDate = localStorage.getItem('lastMantraDate');
      
      if (lastMantraDate !== today) {
        // New day - generate new mantra
        const randomMantra = mantras[Math.floor(Math.random() * mantras.length)];
        setCurrentMantra(randomMantra);
        setIsNewMantra(true);
        localStorage.setItem('lastMantraDate', today);
        localStorage.setItem('currentMantra', randomMantra);
      } else {
        // Same day - use stored mantra
        const storedMantra = localStorage.getItem('currentMantra') || mantras[0];
        setCurrentMantra(storedMantra);
        setIsNewMantra(false);
      }
    };

    if (isOpen) {
      checkForNewMantra();
    }
  }, [isOpen]);

  const handleFlipCard = () => {
    setShowMantra(!showMantra);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // Here you would integrate with actual audio player
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="relative w-[500px] h-[600px] bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl transform transition-all duration-400 scale-100 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(15,15,20,0.9) 50%, rgba(10,10,15,0.95) 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 112, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Enhanced glass effect overlay */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/8 via-transparent to-orange-500/8" />
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-orange-500/5 via-transparent to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 flex items-center justify-center group z-20"
          >
            <X size={16} className="text-white/70 group-hover:text-white" />
          </button>

          {/* Content */}
          <div className="relative p-8 h-full flex flex-col z-10">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-400/30 to-orange-600/30 flex items-center justify-center relative">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 animate-pulse" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400/20 to-transparent animate-pulse" />
              </div>
              <h3 className="text-white text-2xl font-light tracking-wide">Center</h3>
              <div className="w-10 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent mx-auto mt-2" />
            </div>

            {/* Meditation Section */}
            <div className="flex-1 mb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse shadow-lg shadow-orange-400/50" />
                <h4 className="text-orange-400 text-base font-medium tracking-wide">Meditation</h4>
              </div>

              <div className="bg-gradient-to-br from-black/40 to-black/20 rounded-2xl p-5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="text-white text-base font-medium mb-1">Daily Centering</h5>
                    <p className="text-white/60 text-sm">10 min • Guided meditation</p>
                  </div>
                  <button
                    onClick={handlePlayPause}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-xl shadow-orange-500/30"
                  >
                    {isPlaying ?
                      <Pause size={18} className="text-white" /> :
                      <Play size={18} className="text-white ml-1" />
                    }
                  </button>
                </div>

                <p className="text-white/70 text-sm mb-4 leading-relaxed">
                  Find your center through mindful breathing and presence
                </p>

                {/* Enhanced Progress bar */}
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: isPlaying ? '60%' : '0%' }}
                  />
                </div>
              </div>
            </div>

            {/* Daily Mantra Section */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${isNewMantra ? 'bg-orange-400 animate-pulse shadow-lg shadow-orange-400/50' : 'bg-orange-400/60'}`} />
                <h4 className="text-orange-400 text-base font-medium tracking-wide">Daily Mantra</h4>
                {isNewMantra && <span className="text-xs text-orange-400 animate-pulse font-medium">• New</span>}
              </div>

              <div
                className="relative h-24 cursor-pointer group"
                onClick={handleFlipCard}
              >
                <div 
                  className={`absolute inset-0 w-full h-full transition-transform duration-700 preserve-3d ${showMantra ? 'rotate-y-180' : ''}`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front of card */}
                  <div
                    className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-white/20 flex items-center justify-center backface-hidden backdrop-blur-sm"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="text-center px-4">
                      <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-400/20 to-orange-600/20 flex items-center justify-center">
                        <RotateCcw size={18} className="text-orange-400 group-hover:rotate-180 transition-transform duration-500" />
                      </div>
                      <p className="text-white/90 text-sm font-medium">Tap for your daily mantra</p>
                    </div>
                  </div>

                  {/* Back of card */}
                  <div
                    className="absolute inset-0 w-full h-full bg-gradient-to-br from-orange-900/60 to-orange-800/50 rounded-xl border border-orange-400/30 flex items-center justify-center p-5 rotate-y-180 backface-hidden backdrop-blur-sm"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <p className="text-orange-100 text-sm text-center leading-relaxed font-light italic">
                      "{currentMantra}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced bottom accents */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-orange-500/60 to-transparent rounded-full" />
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent rounded-full" />

          {/* Subtle corner accents */}
          <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-transparent rounded-tl-3xl" />
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-tr-3xl" />
        </div>
      </div>

      <style jsx>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </>
  );
};

export default GetCenteredCard;