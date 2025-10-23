import React from 'react';
import { MessageCircle, Headphones, Play, Pause } from 'lucide-react';
import { Button } from '../atoms/Button';
import { AtmoCard } from '../molecules/AtmoCard';
import { promptStore } from '@/stores/promptStore.ts';
import AtmoOutputsCard from './AtmoOutputsCard';

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
    <div className="space-y-3">
      {/* 1️⃣ ATMO Outputs Card - Shows today's AI-generated content */}
      <AtmoOutputsCard />

      {/* 2️⃣ Morning AI Podcast Card - Simplified */}
      <AtmoCard variant="orange" className="p-3 w-72 h-[200px]" hover={true} glow={true}>
        <div className="relative h-full flex flex-col">
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
      <AtmoCard variant="orange" className="p-3 w-72 h-[100px]" hover={true} glow={true}>
        <div className="relative h-full flex flex-col">
          {/* Card Title */}
          <h3 className="text-lg font-semibold text-white mb-3">Coming Soon</h3>

          {/* Compact Placeholder Content */}
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-white/60">
              Additional feature coming soon
            </p>
          </div>
        </div>
      </AtmoCard>

    </div>
  );
};

export default React.memo(DailySnapshot);