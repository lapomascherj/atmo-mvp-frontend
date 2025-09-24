import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '../atoms/Button';
import { AtmoCard } from './AtmoCard';
import { CardHeader, CardContent } from '../atoms/Card';
import { useDailySnapshotStore, MOOD_OPTIONS } from '@/stores/dailySnapshotStore';
import { promptStore } from '@/stores/promptStore';

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

// Fixed questions
const FIXED_QUESTIONS = [
  "What do you want to focus on today?",
  "What could create stress or tension today?"
];

interface CompactDailySnapshotProps {
  // Props for backend integration
  highlightText?: string;
  onOpenChat?: (question: string) => void;
}

const CompactDailySnapshot: React.FC<CompactDailySnapshotProps> = ({
  highlightText,
  onOpenChat
}) => {
  // Daily snapshot store
  const {
    initializeToday,
    getQuestionsAnswered,
    getCurrentMood,
    getHighlight,
    markQuestionAnswered,
    setMood,
    generateSmartHighlight,
    recordQuestionInteraction
  } = useDailySnapshotStore();

  // Prompt store for chat integration
  const {
    addMessageToPrompt,
    addAvatarMessage,
    toggleConversationStarted,
    isConversationStarted
  } = promptStore();

  // Local state
  const [dynamicQuestion, setDynamicQuestion] = useState(QUESTION_POOL[0]);
  const [showMoodPicker, setShowMoodPicker] = useState(false);

  // Initialize store on mount
  useEffect(() => {
    initializeToday();
  }, [initializeToday]);

  // Get current state
  const questionsAnswered = getQuestionsAnswered();
  const { mood } = getCurrentMood();
  const highlight = highlightText || getHighlight();

  // Function to get random question from pool
  const getRandomQuestion = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * QUESTION_POOL.length);
    setDynamicQuestion(QUESTION_POOL[randomIndex]);
  }, []);

  // Initialize with random question on component mount
  useEffect(() => {
    getRandomQuestion();
  }, [getRandomQuestion]);

  // Generate smart highlight if none exists
  useEffect(() => {
    if (!highlightText && !getHighlight()) {
      generateSmartHighlight();
    }
  }, [highlightText, generateSmartHighlight, getHighlight]);

  // Handle switch question click
  const handleSwitchQuestion = () => {
    getRandomQuestion();
  };

  // Generate smart contextual answer starters based on questions
  const getSmartAnswerStarter = (question: string): string => {
    const starters: { [key: string]: string } = {
      "What do you want to focus on today?": "Today, I want to focus on...",
      "What could create stress or tension today?": "I'm concerned that...",
      "What's one small win you'd like to achieve before the day ends?": "Before the day ends, I'd like to...",
      "What's the hardest decision you expect to face today?": "The hardest decision I'm facing is...",
      "If someone could help you today, what would you ask them?": "I would ask for help with...",
      "What's one thing you want to avoid getting distracted by?": "I want to avoid getting distracted by...",
      "What would make today feel like a success for you?": "Today would feel successful if...",
      "What's one step you can take today toward your long-term goals?": "One step I can take toward my goals is...",
      "Who is one person you'd like to connect with or reach out to today?": "I'd like to connect with...",
      "What's one thing you can do today to recharge your energy?": "To recharge my energy, I can...",
      "What's the most important conversation you need to have today?": "The most important conversation I need to have is...",
      "What's something you've been postponing that you could start today?": "Something I've been postponing is...",
      "What's one thing you're grateful for this morning?": "This morning, I'm grateful for...",
      "How do you want to show up for others today?": "I want to show up for others by...",
      "What's one way you could make today easier for yourself?": "I could make today easier by...",
      "What's something exciting you're looking forward to today?": "I'm looking forward to...",
      "What's one challenge you want to approach differently today?": "I want to approach this challenge differently by...",
      "If today had a theme, what would you call it?": "Today's theme would be...",
      "What's one thing you want to learn or discover today?": "I want to learn about...",
      "What would your 'best self' do first this morning?": "My best self would start by..."
    };

    return starters[question] || "My thoughts on this: ";
  };

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
  const handleOpenInChat = (question: string, questionIndex?: number) => {
    // Record interaction
    recordQuestionInteraction(question, true);

    // Mark question as answered if index provided
    if (typeof questionIndex === 'number') {
      markQuestionAnswered(questionIndex);
    }

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

    console.log(`Opening chat for question: ${question} with starter: ${smartStarter}`);
  };

  // Handle mood selection
  const handleMoodSelect = (selectedMood: number) => {
    setMood(selectedMood);
    setShowMoodPicker(false);
  };

  // Get all questions including dynamic one
  const allQuestions = [...FIXED_QUESTIONS, dynamicQuestion];

  return (
    <AtmoCard variant="orange" className="w-full max-w-sm mx-auto overflow-hidden max-h-[800px] flex flex-col" hover={true}>
      <CardHeader className="pb-3 pt-4 px-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Daily Snapshot</span>
          </div>
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
              {allQuestions.map((question, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className={`w-3 h-3 rounded-full border-2 mt-1 shrink-0 transition-all duration-200 ${
                    questionsAnswered[index]
                      ? 'bg-orange-500 border-orange-500 shadow-sm shadow-orange-500/30'
                      : 'border-orange-500/60 hover:border-orange-500'
                  }`} />
                  <div className="flex items-start justify-between gap-2 flex-1">
                    <div className="flex items-start gap-2 flex-1">
                      <p className="text-xs text-white/90 flex-1 leading-relaxed">
                        {question}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleOpenInChat(question, index)}
                      size="sm"
                      variant="ghost"
                      className="shrink-0 h-6 px-2 text-xs text-[#FF5F1F] hover:text-white hover:bg-[#FF5F1F]/20 border border-[#FF5F1F]/30 hover:border-[#FF5F1F]/50 transition-all duration-200"
                    >
                      <MessageCircle size={10} className="mr-1" />
                      Chat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2️⃣ Mood Check Section */}
          <div className="bg-black/30 rounded-lg p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-[#FF5F1F] mb-3 text-center">Mood Check</h3>

            {mood && !showMoodPicker ? (
              // Mood selected - Professional display
              <div className="text-center py-3">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-left flex-1">
                      <p className="text-sm text-white font-medium">
                        {MOOD_OPTIONS.find(m => m.value === mood)?.label}
                      </p>
                      <p className="text-xs text-white/60">Current mood level</p>
                    </div>
                    <button
                      onClick={() => setShowMoodPicker(true)}
                      className="text-xs text-[#FF5F1F] hover:text-white transition-colors px-2 py-1 rounded border border-[#FF5F1F]/30 hover:border-[#FF5F1F]/50"
                    >
                      Change
                    </button>
                  </div>

                  {/* Professional mood scale indicator */}
                  <div className="flex items-center gap-1">
                    {MOOD_OPTIONS.map((option, index) => (
                      <div
                        key={option.value}
                        className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                          option.value <= mood
                            ? `bg-gradient-to-r ${option.color} shadow-sm`
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-white/40">Low</span>
                    <span className="text-xs text-white/40">High</span>
                  </div>
                </div>
              </div>
            ) : (
              // No mood selected - Professional scale picker
              <div className="text-center py-2">
                {showMoodPicker ? (
                  <div className="space-y-4">
                    <p className="text-xs text-white/70 mb-3">How are you feeling today?</p>

                    {/* Professional mood scale selector */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1">
                        {MOOD_OPTIONS.map((option, index) => (
                          <button
                            key={option.value}
                            onClick={() => handleMoodSelect(option.value)}
                            className={`h-8 flex-1 rounded transition-all duration-200 hover:scale-105 ${
                              `bg-gradient-to-r ${option.color} hover:shadow-lg`
                            }`}
                            title={option.label}
                          />
                        ))}
                      </div>

                      {/* Scale labels */}
                      <div className="flex justify-between px-1">
                        {MOOD_OPTIONS.map((option) => (
                          <span key={option.value} className={`text-xs ${option.textColor} font-medium`}>
                            {option.label}
                          </span>
                        ))}
                      </div>

                      <div className="flex justify-between">
                        <span className="text-xs text-white/40">1</span>
                        <span className="text-xs text-white/40">2</span>
                        <span className="text-xs text-white/40">3</span>
                        <span className="text-xs text-white/40">4</span>
                        <span className="text-xs text-white/40">5</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowMoodPicker(false)}
                      className="text-xs text-white/40 hover:text-white/60 transition-colors mt-3"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowMoodPicker(true)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 hover:bg-white/10 hover:border-[#FF5F1F]/30 transition-all duration-200 group"
                  >
                    <div className="text-center">
                      <p className="text-sm text-white/90 group-hover:text-white">Check your mood</p>
                      <p className="text-xs text-white/60">Rate how you're feeling today</p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 3️⃣ Daily Highlight Section */}
          <div className="bg-black/30 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-[#FF5F1F] text-center">Daily Highlight</h3>
              <button
                onClick={generateSmartHighlight}
                className="p-1 text-[#FF5F1F]/60 hover:text-[#FF5F1F] transition-colors"
                title="Generate new highlight"
              >
                <Sparkles size={12} />
              </button>
            </div>
            <div className="bg-[#FF5F1F]/10 border border-[#FF5F1F]/30 rounded-lg p-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#FF5F1F]/50 to-transparent" />
              <p className="text-xs text-white/90 leading-relaxed relative z-10">
                {highlight}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </AtmoCard>
  );
};

export default React.memo(CompactDailySnapshot);