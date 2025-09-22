import React from 'react';

interface StatsProps {
  totalHours?: number;
  allocatedHours?: number;
  freeHours?: number;
  automationPercentage?: number;
}

const StatsSection: React.FC<StatsProps> = ({ 
  totalHours = 8, 
  allocatedHours = 5.5, 
  freeHours = 2.5, 
  automationPercentage = 34 
}) => {
  return (
    <div className="rounded-lg p-4 bg-gradient-to-br from-black/90 to-black/80 border border-white/10 hover:border-atmo-orange/30 backdrop-blur-md shadow-lg">
      <div className="flex justify-between items-start">
        <div className="space-y-1.5">
          <p className="text-sm text-white font-montserrat font-medium">Hours Available</p>
          <div className="flex items-end">
            <span className="text-3xl font-medium text-white">{totalHours}</span>
            <span className="text-xs ml-1 mb-1 text-white/80">hrs</span>
          </div>
          <div className="space-y-1 mt-1">
            <div className="flex items-center">
              <span className="text-xs text-atmo-orange font-medium">{allocatedHours} hrs</span>
              <span className="text-xs text-white/80 ml-1.5">allocated</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-white font-medium">{freeHours} hrs</span>
              <span className="text-xs text-white/80 ml-1.5">free</span>
            </div>
          </div>
        </div>

        <div className="relative w-16 h-16">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3"></circle>
            <circle cx="18" cy="18" r="16" fill="none" stroke="#FF5F1F" strokeWidth="3" strokeDasharray={`${automationPercentage} 100`} strokeLinecap="round" transform="rotate(-90 18 18)"></circle>
          </svg>
          <div className="absolute bottom-0 right-0 w-full text-right text-xs">
            <span className="text-white/80">Automated</span>
            <div className="text-atmo-orange font-medium">{automationPercentage}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsSection;
