import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import SphereChat from '@/components/atoms/SphereChat';

interface VoiceModeUIProps {
  isListening: boolean;
  isSupported: boolean;
  onSphereClick: () => void;
  onStopVoiceMode: () => void;
}

const VoiceModeUI: React.FC<VoiceModeUIProps> = ({
  isListening,
  isSupported,
  onSphereClick,
  onStopVoiceMode
}) => {
  return (
    <div className="flex flex-col items-center space-y-4 animate-in fade-in-0 duration-300">
      {/* Smaller, elegant Avatar when in voice mode */}
      <div className="relative">
        <SphereChat
          size={120} // Reduced size for voice mode - minimal and elegant
          onClick={onSphereClick}
          voiceSupported={isSupported}
          isListening={isListening}
          isActive={true}
        />
        
        {/* Subtle halo effect for listening state */}
        {isListening && (
          <div className="absolute inset-0 -z-10 bg-[#FF7000]/20 rounded-full blur-xl animate-pulse-soft"></div>
        )}
      </div>

      {/* Stop Control - Clearly visible X button */}
      <div className="flex items-center space-x-3">
        <Button
          onClick={onStopVoiceMode}
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-all duration-200"
          aria-label="Stop Voice Mode"
        >
          <X className="w-4 h-4 text-red-400" />
        </Button>
        
        {/* Status Text */}
        <div className="text-center">
          <p className="text-slate-300 text-lg font-medium">
            {isListening ? 'Listening...' : 'Voice Mode Active'}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {isListening ? 'Speak now or click X to stop' : 'Click Avatar to speak'}
          </p>
        </div>
      </div>

      {/* Visual indicator for listening state */}
      {isListening && (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      )}
    </div>
  );
};

export default VoiceModeUI; 