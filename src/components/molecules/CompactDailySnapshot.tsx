import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, MessageCircle } from 'lucide-react';
import { Button } from '../atoms/Button';
import { AtmoCard } from './AtmoCard';
import { CardHeader, CardContent } from '../atoms/Card';

// Question pool for dynamic third question
const QUESTION_POOL = [
  "What do you want to focus on today?",
  "What's one small win you'd like to achieve before the day ends?",
  "What could create stress or tension for you today?",
  "What's the hardest decision you expect to face today?",
  "If someone could help you today, what would you ask them?",
  "What's one thing you want to avoid getting distracted by?",
  "What would make today feel like a success for you?",
  "What's one step you can take today toward your long-term goals?",
  "Who is one person you'd like to connect with or reach out to today?",
  "What's one thing you can do today to recharge your energy?",
  "What's the most important conversation you need to have today?",
  "What's something you've been postponing that you could start today?",
  "What's one thing you're grateful for this morning?",
  "How do you want to show up for others today?",
  "What's one way you could make today easier for yourself?",
  "What's something exciting you're looking forward to today?",
  "What's one challenge you want to approach differently today?",
  "If today had a theme, what would you call it?",
  "What's one thing you want to learn or discover today?",
  "What would your 'best self' do first this morning?"
];

interface CompactDailySnapshotProps {
  // Props for backend integration
  highlightText?: string;
  onOpenChat?: (question: string) => void;
  // Props for question answered state
  answered?: boolean[];
}

const CompactDailySnapshot: React.FC<CompactDailySnapshotProps> = ({ 
  highlightText, 
  onOpenChat,
  answered = [false, false, false] // Default to all questions unanswered
}) => {
  // State for dynamic question
  const [dynamicQuestion, setDynamicQuestion] = useState(QUESTION_POOL[0]);

  // Mock highlight text if not provided
  const defaultHighlight = "Yesterday you drafted 2 new ideas. Let's make one real today.";
  const displayHighlight = highlightText || defaultHighlight;

  // Function to get random question from pool
  const getRandomQuestion = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * QUESTION_POOL.length);
    setDynamicQuestion(QUESTION_POOL[randomIndex]);
  }, []);

  // Initialize with random question on component mount
  useEffect(() => {
    getRandomQuestion();
  }, [getRandomQuestion]);

  // Handle switch question click
  const handleSwitchQuestion = () => {
    getRandomQuestion();
  };

  // Handle open in chat click
  const handleOpenInChat = (question: string) => {
    if (onOpenChat) {
      onOpenChat(question);
    } else {
      // TODO: Integrate with chat system
      console.log(`Opening chat with question: ${question}`);
    }
  };

  return (
    <AtmoCard variant="orange" className="w-full max-w-sm mx-auto overflow-hidden max-h-[800px] flex flex-col" hover={true}>
      <CardHeader className="pb-3 pt-4 px-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Daily Snapshot</span>
          <span className="text-xs text-white/60">
            {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0 flex-1 flex flex-col overflow-hidden">
        <div className="space-y-4 overflow-y-auto">
          {/* 1️⃣ Morning Actions Section */}
          <div className="bg-black/30 rounded-lg p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-[#FF5F1F] mb-3 text-center">Morning Actions</h3>
            
            <div className="space-y-3">
              {/* Question 1 - Fixed */}
              <div className="flex items-start gap-2">
                <div className={`w-3 h-3 rounded-full border-2 mt-1 shrink-0 ${
                  answered[0] ? 'bg-purple-500 border-purple-500' : 'border-purple-500'
                }`} />
                <div className="flex items-start justify-between gap-2 flex-1">
                  <p className="text-xs text-white/90 flex-1 leading-relaxed">
                    What do you want to focus on today?
                  </p>
                  <Button
                    onClick={() => handleOpenInChat("What do you want to focus on today?")}
                    size="sm"
                    variant="ghost"
                    className="shrink-0 h-6 px-2 text-xs text-[#FF5F1F] hover:text-white hover:bg-[#FF5F1F]/20 border border-[#FF5F1F]/30 hover:border-[#FF5F1F]/50"
                  >
                    <MessageCircle size={10} className="mr-1" />
                    Chat
                  </Button>
                </div>
              </div>

              {/* Question 2 - Fixed */}
              <div className="flex items-start gap-2">
                <div className={`w-3 h-3 rounded-full border-2 mt-1 shrink-0 ${
                  answered[1] ? 'bg-purple-500 border-purple-500' : 'border-purple-500'
                }`} />
                <div className="flex items-start justify-between gap-2 flex-1">
                  <p className="text-xs text-white/90 flex-1 leading-relaxed">
                    What could create stress or tension today?
                  </p>
                  <Button
                    onClick={() => handleOpenInChat("What could create stress or tension today?")}
                    size="sm"
                    variant="ghost"
                    className="shrink-0 h-6 px-2 text-xs text-[#FF5F1F] hover:text-white hover:bg-[#FF5F1F]/20 border border-[#FF5F1F]/30 hover:border-[#FF5F1F]/50"
                  >
                    <MessageCircle size={10} className="mr-1" />
                    Chat
                  </Button>
                </div>
              </div>

              {/* Question 3 - Dynamic */}
              <div className="flex items-start gap-2">
                <div className={`w-3 h-3 rounded-full border-2 mt-1 shrink-0 ${
                  answered[2] ? 'bg-purple-500 border-purple-500' : 'border-purple-500'
                }`} />
                <div className="flex items-start justify-between gap-2 flex-1">
                  <div className="flex items-start gap-2 flex-1">
                    <p className="text-xs text-white/90 flex-1 leading-relaxed">
                      {dynamicQuestion}
                    </p>
                    <button
                      onClick={handleSwitchQuestion}
                      className="shrink-0 p-1 text-[#FF5F1F] hover:text-white hover:bg-[#FF5F1F]/20 rounded transition-colors"
                      title="Switch question"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>
                  <Button
                    onClick={() => handleOpenInChat(dynamicQuestion)}
                    size="sm"
                    variant="ghost"
                    className="shrink-0 h-6 px-2 text-xs text-[#FF5F1F] hover:text-white hover:bg-[#FF5F1F]/20 border border-[#FF5F1F]/30 hover:border-[#FF5F1F]/50"
                  >
                    <MessageCircle size={10} className="mr-1" />
                    Chat
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 2️⃣ Mood Check Section */}
          <div className="bg-black/30 rounded-lg p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-[#FF5F1F] mb-3 text-center">Mood Check</h3>
            <div className="text-center py-6">
              <p className="text-xs text-white/50">
                Interactive mood interface coming soon
              </p>
            </div>
          </div>

          {/* 3️⃣ Daily Highlight Section */}
          <div className="bg-black/30 rounded-lg p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-[#FF5F1F] mb-3 text-center">Daily Highlight</h3>
            <div className="bg-[#FF5F1F]/10 border border-[#FF5F1F]/30 rounded-lg p-3">
              <p className="text-xs text-white/90 leading-relaxed">
                {displayHighlight}
              </p>
            </div>
            
            {/* TODO: Backend integration note */}
            {!highlightText && (
              <p className="text-xs text-white/40 mt-2">
                {/* TODO: Connect to backend API for daily highlight */}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </AtmoCard>
  );
};

export default React.memo(CompactDailySnapshot);