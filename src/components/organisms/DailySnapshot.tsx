import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, MessageCircle } from 'lucide-react';
import { Button } from '../atoms/Button';

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

interface DailySnapshotProps {
  // Props for backend integration
  highlightText?: string;
  onOpenChat?: (question: string) => void;
}

const DailySnapshot: React.FC<DailySnapshotProps> = ({ 
  highlightText, 
  onOpenChat 
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
    <div className="w-full space-y-4">
      {/* 1️⃣ Morning Actions Card */}
      <div className="rounded-xl p-4 bg-[#010000]/80 border border-white/5 hover:border-[#D04907]/20 transition-all duration-300 shadow-md hover:shadow-[0_4px_12px_rgba(208,73,7,0.15)] relative overflow-hidden">
        {/* Background subtle glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#D04907]/5 blur-xl opacity-70"></div>
        
        <div className="relative">
          {/* Card Title */}
          <h3 className="text-lg font-semibold text-[#E3E3E3] mb-4">Morning Actions</h3>
          
          {/* Questions List */}
          <div className="space-y-4">
            {/* Question 1 - Fixed */}
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-[#E3E3E3]/90 flex-1">
                What do you want to focus on today?
              </p>
              <Button
                onClick={() => handleOpenInChat("What do you want to focus on today?")}
                size="sm"
                variant="ghost"
                className="shrink-0 h-8 px-3 text-xs text-[#D04907] hover:text-[#E3E3E3] hover:bg-[#D04907]/10 border border-[#D04907]/20 hover:border-[#D04907]/40"
              >
                <MessageCircle size={12} className="mr-1" />
                Open in chat
              </Button>
            </div>

            {/* Question 2 - Fixed */}
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-[#E3E3E3]/90 flex-1">
                What could create stress or tension today?
              </p>
              <Button
                onClick={() => handleOpenInChat("What could create stress or tension today?")}
                size="sm"
                variant="ghost"
                className="shrink-0 h-8 px-3 text-xs text-[#D04907] hover:text-[#E3E3E3] hover:bg-[#D04907]/10 border border-[#D04907]/20 hover:border-[#D04907]/40"
              >
                <MessageCircle size={12} className="mr-1" />
                Open in chat
              </Button>
            </div>

            {/* Question 3 - Dynamic */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 flex-1">
                <p className="text-sm text-[#E3E3E3]/90 flex-1">
                  {dynamicQuestion}
                </p>
                <button
                  onClick={handleSwitchQuestion}
                  className="shrink-0 p-1 text-[#D04907] hover:text-[#E3E3E3] hover:bg-[#D04907]/10 rounded transition-colors"
                  title="Switch question"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <Button
                onClick={() => handleOpenInChat(dynamicQuestion)}
                size="sm"
                variant="ghost"
                className="shrink-0 h-8 px-3 text-xs text-[#D04907] hover:text-[#E3E3E3] hover:bg-[#D04907]/10 border border-[#D04907]/20 hover:border-[#D04907]/40"
              >
                <MessageCircle size={12} className="mr-1" />
                Open in chat
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2️⃣ Mood Check Card */}
      <div className="rounded-xl p-4 bg-[#010000]/80 border border-white/5 hover:border-[#D04907]/20 transition-all duration-300 shadow-md hover:shadow-[0_4px_12px_rgba(208,73,7,0.15)] relative overflow-hidden">
        {/* Background subtle glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#D04907]/5 blur-xl opacity-70"></div>
        
        <div className="relative">
          {/* Card Title */}
          <h3 className="text-lg font-semibold text-[#E3E3E3] mb-4">Mood Check</h3>
          
          {/* Empty content area - placeholder for future mood interface */}
          <div className="text-center py-8">
            <p className="text-sm text-[#E3E3E3]/50">
              Interactive mood interface coming soon
            </p>
          </div>
        </div>
      </div>

      {/* 3️⃣ Daily Highlight Card */}
      <div className="rounded-xl p-4 bg-[#010000]/80 border border-white/5 hover:border-[#D04907]/20 transition-all duration-300 shadow-md hover:shadow-[0_4px_12px_rgba(208,73,7,0.15)] relative overflow-hidden">
        {/* Background subtle glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#D04907]/5 blur-xl opacity-70"></div>
        
        <div className="relative">
          {/* Card Title */}
          <h3 className="text-lg font-semibold text-[#E3E3E3] mb-4">Daily Highlight</h3>
          
          {/* Highlight Text */}
          <div className="bg-[#D04907]/10 border border-[#D04907]/20 rounded-lg p-4">
            <p className="text-sm text-[#E3E3E3]/90 leading-relaxed">
              {displayHighlight}
            </p>
          </div>
          
          {/* TODO: Backend integration note */}
          {!highlightText && (
            <p className="text-xs text-[#E3E3E3]/40 mt-2">
              {/* TODO: Connect to backend API for daily highlight */}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailySnapshot;