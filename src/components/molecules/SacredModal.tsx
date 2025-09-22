import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw } from 'lucide-react';

interface SacredModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

const SacredModal: React.FC<SacredModalProps> = ({ isOpen, onClose, children }) => {
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

  // Daily mantras (would be personalized over time)
  const mantras = [
    "I am connected to the infinite wisdom of the universe",
    "Sacred geometry flows through my being, aligning me with divine order", 
    "Today I embrace the perfect patterns that guide my path",
    "I am one with the cosmic dance of creation and manifestation",
    "The flower of life blooms within me, revealing new possibilities"
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-96 bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl transform transition-all duration-400 scale-100"
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(20,20,20,0.8) 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 215, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glass effect overlay */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 via-transparent to-gold-500/5" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 flex items-center justify-center group z-10"
          >
            <X size={16} className="text-white/70 group-hover:text-white" />
          </button>
          
          {/* Content */}
          <div className="p-6 h-full">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold-400/20 to-gold-600/20 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 animate-pulse" />
              </div>
              <h3 className="text-white text-lg font-light mb-2">Sacred Moments</h3>
              <p className="text-white/60 text-sm">
                Nurture your soul with meditation and daily wisdom
              </p>
            </div>

            {/* Meditation Podcast Section */}
            <div className="mb-6">
              <h4 className="text-gold-400 text-sm font-medium mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold-400 animate-pulse"></div>
                Meditation Podcast
              </h4>
              
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h5 className="text-white text-sm font-medium">Morning Sacred Geometry</h5>
                    <p className="text-white/60 text-xs">10 min • Daily meditation</p>
                  </div>
                  <button
                    onClick={handlePlayPause}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                  >
                    {isPlaying ? 
                      <Pause size={16} className="text-black" /> : 
                      <Play size={16} className="text-black ml-0.5" />
                    }
                  </button>
                </div>
                
                <p className="text-white/70 text-xs mb-3">
                  Connect with the divine patterns of creation through guided meditation
                </p>
                
                {/* Progress bar */}
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-gold-500 to-gold-600 rounded-full transition-all duration-500"
                    style={{ width: isPlaying ? '60%' : '0%' }}
                  />
                </div>
              </div>
            </div>

            {/* Daily Mantra Flip Card */}
            <div className="mb-4">
              <h4 className="text-gold-400 text-sm font-medium mb-3 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isNewMantra ? 'bg-gold-400 animate-pulse' : 'bg-gold-400/60'}`}></div>
                Daily Mantra
                {isNewMantra && <span className="text-xs text-gold-400 animate-pulse">• New</span>}
              </h4>
              
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
                    className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-xl border border-white/10 flex items-center justify-center backface-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="text-center">
                      <RotateCcw size={20} className="text-gold-400 mx-auto mb-2 group-hover:rotate-180 transition-transform duration-500" />
                      <p className="text-white/80 text-sm">Tap for your daily mantra</p>
                    </div>
                  </div>
                  
                  {/* Back of card */}
                  <div 
                    className="absolute inset-0 w-full h-full bg-gradient-to-br from-gold-900/40 to-orange-900/40 rounded-xl border border-gold-400/20 flex items-center justify-center p-4 rotate-y-180 backface-hidden"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <p className="text-gold-200 text-sm text-center leading-relaxed font-light italic">
                      "{currentMantra}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom glow */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent rounded-full" />
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

export default SacredModal;