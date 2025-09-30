import React from 'react';
import { MessageCircle, Headphones, Play, Pause } from 'lucide-react';
import { Button } from '../atoms/Button';
import { AtmoCard } from '../molecules/AtmoCard';
import { promptStore } from '@/stores/promptStore.ts';

interface DailySnapshotProps {
  // Props for backend integration
  onOpenChat?: (question: string) => void;
}

const DailySnapshot: React.FC<DailySnapshotProps> = ({ 
  onOpenChat 
}) => {
  // Prompt store for avatar-driven conversations
  const {
    addAvatarMessage,
    toggleConversationStarted,
    isConversationStarted
  } = promptStore();

  // Podcast state
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Avatar greeting templates for morning actions
  const getAvatarGreeting = (question: string): string => {
    const greetings = [
      "Good morning! Let's set the tone for today. ",
      "Hey, ready to start the day right? ",
      "Let's plan your day together. "
    ];

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    return randomGreeting + question;
  };

  // Handle open in chat click - Updated for avatar-driven conversations
  const handleOpenInChat = (question: string) => {
    // Create avatar-initiated conversation with warm greeting + question
    const avatarMessage = getAvatarGreeting(question);
    addAvatarMessage(avatarMessage);

    // Start conversation if not started
    if (!isConversationStarted) {
      toggleConversationStarted();
    }

    // Call custom handler if provided
    if (onOpenChat) {
      onOpenChat(question);
    }
  };

  // Handle podcast play/pause
  const handlePodcastToggle = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement actual podcast play/pause logic
    console.log(isPlaying ? 'Pausing podcast' : 'Playing podcast');
  };

  return (
    <div className="w-full space-y-3">
      {/* 1️⃣ Today Inspo Card - Compact */}
      <AtmoCard variant="orange" className="p-3" hover={true} glow={true}>
        <div className="relative">
          {/* Card Title */}
          <h3 className="text-lg font-semibold text-white mb-3">Today Inspo</h3>
          
          {/* User Routine Type */}
          <div className="mb-4 pb-3 border-b border-white/10">
            <p className="text-sm text-white/70 mb-1">Your routine</p>
            <p className="text-sm font-medium text-[#FF5F1F]">Busy 9–5 worker</p>
          </div>
          
          {/* Day Phases - Compact */}
          <div className="space-y-2">
            {/* Seed - Morning */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-[#FF5F1F]/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-sm font-medium text-white">Seed</span>
                  <span className="text-xs text-white/60">morning</span>
                </div>
                <Button
                  onClick={() => handleOpenInChat("Morning seed action")}
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-[#FF5F1F] hover:text-white hover:bg-[#FF5F1F]/10"
                >
                  <MessageCircle size={10} className="mr-1" />
                  Start
                </Button>
              </div>
            </div>

            {/* Grow - Afternoon */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-[#FF5F1F]/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span className="text-sm font-medium text-white">Grow</span>
                  <span className="text-xs text-white/60">afternoon</span>
                </div>
                <Button
                  onClick={() => handleOpenInChat("Afternoon grow action")}
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-[#FF5F1F] hover:text-white hover:bg-[#FF5F1F]/10"
                >
                  <MessageCircle size={10} className="mr-1" />
                  Start
                </Button>
              </div>
            </div>

            {/* Bloom - Evening */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-[#FF5F1F]/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <span className="text-sm font-medium text-white">Bloom</span>
                  <span className="text-xs text-white/60">evening</span>
                </div>
                <Button
                  onClick={() => handleOpenInChat("Evening bloom action")}
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-[#FF5F1F] hover:text-white hover:bg-[#FF5F1F]/10"
                >
                  <MessageCircle size={10} className="mr-1" />
                  Start
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AtmoCard>

      {/* 2️⃣ Morning AI Podcast Card - Simplified */}
      <AtmoCard variant="orange" className="p-3" hover={true} glow={true}>
        <div className="relative">
          {/* Card Title */}
          <h3 className="text-lg font-semibold text-white mb-3">Morning AI Podcast</h3>
          
          {/* Podcast Focus */}
          <p className="text-sm text-white/80 mb-4">Productivity Strategies for Busy 9-5 Workers</p>
          
          {/* Compact Audio Player */}
          <div className="bg-[#FF5F1F]/10 rounded-lg p-3 border border-[#FF5F1F]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#FF5F1F]/20 flex items-center justify-center">
                  <Headphones size={12} className="text-[#FF5F1F]" />
                </div>
                <span className="text-sm text-white/70">8 min</span>
              </div>
              <Button
                onClick={handlePodcastToggle}
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-[#FF5F1F] hover:text-white hover:bg-[#FF5F1F]/10 rounded-full"
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              </Button>
            </div>
          </div>
        </div>
      </AtmoCard>

      {/* 3️⃣ Second Card - Compact */}
      <AtmoCard variant="orange" className="p-3" hover={true} glow={true}>
        <div className="relative">
          {/* Card Title */}
          <h3 className="text-lg font-semibold text-white mb-3">Coming Soon</h3>
          
          {/* Compact Placeholder Content */}
          <div className="text-center py-4">
            <p className="text-sm text-white/60">
              Additional feature coming soon
            </p>
          </div>
        </div>
      </AtmoCard>

    </div>
  );
};

export default DailySnapshot;