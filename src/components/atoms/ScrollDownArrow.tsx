import React from 'react';
import { ChevronDown } from 'lucide-react';

const ScrollDownArrow: React.FC = () => {
  const scrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 animate-pulse-soft">
      <p className="text-xs text-white/50">Scroll Down</p>
      <button
        onClick={scrollDown}
        aria-label="Scroll down"
        className="p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <ChevronDown className="h-5 w-5 text-white/80" />
      </button>
    </div>
  );
};

export default ScrollDownArrow;
