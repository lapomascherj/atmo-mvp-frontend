import React from 'react';
import { Sprout, TrendingUp, Sparkles } from 'lucide-react';
import { AtmoCard } from '../molecules/AtmoCard';
import { CardContent } from '../atoms/Card';

// Question bank for each phase - 5 questions per phase
const PHASE_QUESTIONS = {
  Seed: [
    "What single outcome would make today a success?",
    "What 5-minute micro-action unlocks the rest?",
    "What will you remove from the calendar to protect 90 minutes of deep focus?",
    "Which decision will you close by noon, and what minimum evidence do you need?",
    "Where can you create 10× leverage today, and whom will you contact now to accelerate it?"
  ],
  Growth: [
    "What have you truly completed so far, and what are you merely moving around?",
    "Are your next three tasks ordered by impact or by urgency?",
    "What will you delegate to ATMO now, and what is the three-line brief (objective, context, output)?",
    "Which process do you repeat, and how will you automate it today?",
    "What risk threatens tomorrow's delivery, and what countermeasure will you prepare now?"
  ],
  Bloom: [
    "What concrete result did you produce today, and what will you repeat tomorrow?",
    "What mistake did you make, and what micro-correction will you apply tomorrow?",
    "What is tomorrow morning's first task, with time slot and definition of done?",
    "What is the key lesson that will still matter in 30 days?",
    "Which habit held, and which will you cut now to regain energy?"
  ]
};

// Random question selector
const getRandomQuestion = (phase: 'Seed' | 'Growth' | 'Bloom'): string => {
  const questions = PHASE_QUESTIONS[phase];
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
};

interface TodaysActionsCardProps {
  onOpenChat?: (question: string, color: "green" | "yellow" | "purple") => void;
}

const TodaysActionsCard: React.FC<TodaysActionsCardProps> = ({ onOpenChat }) => {
  // Log when component mounts
  React.useEffect(() => {
    console.log('✅ TodaysActionsCard mounted', { hasCallback: !!onOpenChat });
  }, [onOpenChat]);

  const handleSeedClick = () => {
    console.log('🌱 Seed button clicked');
    const question = getRandomQuestion('Seed');
    console.log('📝 Selected question:', question);
    if (onOpenChat) {
      onOpenChat(question, "green");
    } else {
      console.error('❌ onOpenChat callback NOT PROVIDED - buttons will not work!');
    }
  };

  const handleGrowthClick = () => {
    console.log('📈 Growth button clicked');
    const question = getRandomQuestion('Growth');
    console.log('📝 Selected question:', question);
    if (onOpenChat) {
      onOpenChat(question, "yellow");
    } else {
      console.error('❌ onOpenChat callback NOT PROVIDED - buttons will not work!');
    }
  };

  const handleBloomClick = () => {
    console.log('🌸 Bloom button clicked');
    const question = getRandomQuestion('Bloom');
    console.log('📝 Selected question:', question);
    if (onOpenChat) {
      onOpenChat(question, "purple");
    } else {
      console.error('❌ onOpenChat callback NOT PROVIDED - buttons will not work!');
    }
  };

  return (
    <AtmoCard className="w-72 h-[420px]" variant="gold">
      <CardContent className="h-full flex flex-col p-3">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-base font-semibold text-white">Today's Actions</h3>
        </div>

        {/* Phase Buttons - Compact Design */}
        <div className="flex-1 flex flex-col justify-center gap-2.5">
          {/* Seed Button */}
          <button
            onClick={handleSeedClick}
            className="group relative w-full p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 hover:border-green-500/40 transition-all duration-200 hover:shadow-md hover:shadow-green-500/10"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                <Sprout size={18} className="text-green-400" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-semibold text-white group-hover:text-green-300 transition-colors">
                  Seed
                </h4>
                <p className="text-xs text-white/40 leading-tight">
                  Plant new ideas
                </p>
              </div>
            </div>
          </button>

          {/* Growth Button */}
          <button
            onClick={handleGrowthClick}
            className="group relative w-full p-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-600/5 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-200 hover:shadow-md hover:shadow-yellow-500/10"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                <TrendingUp size={18} className="text-yellow-400" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-semibold text-white group-hover:text-yellow-300 transition-colors">
                  Growth
                </h4>
                <p className="text-xs text-white/40 leading-tight">
                  Build momentum
                </p>
              </div>
            </div>
          </button>

          {/* Bloom Button */}
          <button
            onClick={handleBloomClick}
            className="group relative w-full p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-600/5 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-200 hover:shadow-md hover:shadow-purple-500/10"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <Sparkles size={18} className="text-purple-400" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                  Bloom
                </h4>
                <p className="text-xs text-white/40 leading-tight">
                  Celebrate achievements
                </p>
              </div>
            </div>
          </button>
        </div>
      </CardContent>
    </AtmoCard>
  );
};

export default TodaysActionsCard;
