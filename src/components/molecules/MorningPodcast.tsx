import React from 'react';
import { Podcast, AlarmClock } from "lucide-react";
import { Badge } from "@/components/atoms/Badge.tsx";

const MorningPodcast: React.FC = () => {
  return (
    <div className="rounded-lg p-3.5 bg-gradient-to-r from-black/90 to-black/80 hover:from-atmo-orange/10 hover:to-black/90 transition-colors cursor-pointer backdrop-blur-md border border-white/10 hover:border-atmo-orange/30 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <Podcast className="w-4 h-4 text-atmo-orange" />
        <h4 className="text-xs font-medium text-white">MORNING PODCAST</h4>
      </div>
      <p className="text-[10px] text-white/90 mb-2.5 font-montserrat">
        5-minute productivity boost to start your day right
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-atmo-orange/20 border border-atmo-orange/30">
            <AlarmClock className="w-3 h-3 text-atmo-orange" />
          </div>
          <span className="text-[9px] text-white/80">5:23</span>
        </div>
        <Badge variant="outline" className="text-[8px] bg-atmo-orange/20 text-white border-atmo-orange/30">
          NEW
        </Badge>
      </div>
    </div>
  );
};

export default MorningPodcast;
