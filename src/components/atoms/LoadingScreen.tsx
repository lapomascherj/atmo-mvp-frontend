import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Loading ATMO" }) => {
  const [pulseSize, setPulseSize] = useState(false);
  
  useEffect(() => {
    // Create pulsing effect
    const interval = setInterval(() => {
      setPulseSize(prev => !prev);
    }, 1500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a21] z-50 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-fixed opacity-10"></div>
      
      <div className="flex flex-col items-center gap-6 z-10">
        {/* Orb */}
        <div className="relative flex items-center justify-center">
          {/* Main orb glow */}
          <div className={`w-48 h-48 rounded-full bg-gradient-to-br from-[#5447ff] via-[#9747ff] to-[#ff5f1f] opacity-40 blur-3xl transition-all duration-1000 ${pulseSize ? 'scale-110' : 'scale-100'}`}></div>
          
          {/* Inner orb */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-[#FF5F1F] to-[#FF8159] flex items-center justify-center shadow-lg">
            <span className="text-white text-4xl font-bold">A</span>
          </div>
          
          {/* Rotating ring */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-white/10 animate-spin-slow"></div>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-light text-white mb-2">{message}</h2>
          <p className="text-white/60 text-sm">Preparing your digital experience</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 