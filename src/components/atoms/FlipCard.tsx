import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FlipCardProps {
  id: string;
  flippedCard: string | null;
  toggleCardFlip: (id: string) => void;
  frontIcon: LucideIcon;
  frontTitle: string;
  frontBgFrom: string;
  frontBgTo: string;
  backBgFrom: string;
  backBgTo: string;
  backContent: React.ReactNode;
}

const FlipCard: React.FC<FlipCardProps> = ({
  id,
  flippedCard,
  toggleCardFlip,
  frontIcon: FrontIcon,
  frontTitle,
  frontBgFrom,
  frontBgTo,
  backBgFrom,
  backBgTo,
  backContent
}) => {
  return (
    <div
      className={`relative w-full h-[85px] cursor-pointer perspective-500 ${flippedCard === id ? 'flipped' : ''}`}
      onClick={() => toggleCardFlip(id)}
    >
      <div className="absolute w-full h-full transition-all duration-500 transform-gpu preserve-3d">
        <div className={`absolute w-full h-full backface-hidden rounded-lg p-2.5 bg-gradient-to-br ${frontBgFrom} ${frontBgTo} flex flex-col items-center justify-center ${flippedCard === id ? 'opacity-0' : 'opacity-100'}`}>
          <FrontIcon className="w-5 h-5 text-white mb-1.5" />
          <p className="text-[10px] text-white font-medium text-center">
            {frontTitle}
          </p>
        </div>
        <div className={`absolute w-full h-full backface-hidden rounded-lg p-2.5 bg-gradient-to-br ${backBgFrom} ${backBgTo} backdrop-blur-md border border-white/10 flex flex-col justify-center ${flippedCard === id ? 'opacity-100' : 'opacity-0'}`}>
          {backContent}
        </div>
      </div>
    </div>
  );
};

export default FlipCard;
