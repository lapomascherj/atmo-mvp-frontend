import React, { useState } from 'react';
import { AtmoCard } from '@/components/molecules/AtmoCard';
import { CardContent, CardHeader } from '@/components/atoms/Card';
import SphereChat from '@/components/atoms/SphereChat';
import { User, BarChart3, Brain, Lightbulb, ChevronUp, TrendingUp, Target, Zap, Star } from 'lucide-react';
import { SchedulerView } from '@/components/scheduler/SchedulerView';
import { type SchedulerEvent } from '@/types/scheduler';

const DigitalBrain: React.FC = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<SchedulerEvent[]>([
    {
      id: 'event-1',
      title: 'Morning Meeting',
      startTime: '08:00',
      duration: 30,
    },
    {
      id: 'event-2',
      title: 'Project Planning',
      startTime: '09:00',
      duration: 60,
    },
    {
      id: 'event-3',
      title: 'Team Sync',
      startTime: '10:00',
      duration: 45,
    },
    {
      id: 'event-4',
      title: 'Lunch Break',
      startTime: '12:00',
      duration: 60,
    },
    {
      id: 'event-5',
      title: 'Design Review',
      startTime: '14:00',
      duration: 90,
    },
    {
      id: 'event-6',
      title: 'Client Call',
      startTime: '16:00',
      duration: 45,
    },
    {
      id: 'event-7',
      title: 'Wrap Up',
      startTime: '17:00',
      duration: 30,
    },
  ]);

  const handleQuickCapture = () => {
    setIsCapturing(!isCapturing);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-fixed opacity-[0.01] pointer-events-none" />
      <div className="fixed top-[20%] right-[25%] -z-10 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] animate-pulse-soft" />
      <div className="fixed top-[60%] left-[15%] -z-10 w-96 h-96 bg-orange-500/3 rounded-full blur-[120px] animate-pulse-soft" />

      {/* Left Section - Cards Grid */}
      <div className="flex-1 h-full flex flex-col p-6 pl-8 pr-4">
        {/* Page Title - Top Left */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white mb-1">Digital Brain</h1>
          <p className="text-white/60 text-xs">Your personal knowledge ecosystem</p>
        </div>

        {/* 2x2 Grid of Cards - Smaller */}
        <div className="grid grid-cols-2 grid-rows-2 gap-4 max-h-[calc(100vh-140px)]">

          {/* Card 1 - User Profile (Lapo's Design) */}
          <AtmoCard variant="purple" className="w-full h-full p-4" hover={true}>
            <div className="h-full flex flex-col">

              {/* Header Section */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3 flex-1">
                  {/* User Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    L
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white">Lapo</h3>
                    <p className="text-xs text-white/70 leading-relaxed mt-1 pr-2">
                      Tech founder building GrowIn, focusing on AI transformation & digital branding.
                      Specialized in scaling startups through innovative technology solutions and strategic growth hacking.
                    </p>
                  </div>
                </div>

                {/* Top Right Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Growth Portfolio Badge */}
                  <button className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-md border border-purple-500/30 hover:bg-purple-500/30 transition-colors">
                    Growth Portfolio
                  </button>
                  {/* Expand Arrow */}
                  <button className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <ChevronUp size={12} className="text-white/60" />
                  </button>
                </div>
              </div>

              {/* Skills & USP Section */}
              <div className="mb-4 px-3 py-2 bg-white/5 rounded-lg border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={12} className="text-purple-400" />
                  <span className="text-xs font-medium text-purple-400">Why I'm Special</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-300 text-xs rounded-full border border-purple-500/20">
                    AI Strategy
                  </span>
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-300 text-xs rounded-full border border-purple-500/20">
                    Growth Hacking
                  </span>
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-300 text-xs rounded-full border border-purple-500/20">
                    Product Vision
                  </span>
                </div>
              </div>

              {/* Visual Section - Growth Mountain */}
              <div className="flex-1 flex items-center justify-center mb-4">
                <div className="w-full h-16 relative">
                  {/* Simple Mountain Line Visual */}
                  <svg viewBox="0 0 200 60" className="w-full h-full">
                    <defs>
                      <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgb(168 85 247 / 0.3)" />
                        <stop offset="100%" stopColor="rgb(168 85 247 / 0.1)" />
                      </linearGradient>
                    </defs>
                    {/* Mountain path */}
                    <path
                      d="M10,50 L30,35 L50,30 L80,20 L120,15 L160,25 L190,20"
                      stroke="rgb(168 85 247 / 0.8)"
                      strokeWidth="2"
                      fill="none"
                      className="drop-shadow-sm"
                    />
                    {/* Fill area under mountain */}
                    <path
                      d="M10,50 L30,35 L50,30 L80,20 L120,15 L160,25 L190,20 L190,50 Z"
                      fill="url(#mountainGradient)"
                    />
                    {/* Current position dot */}
                    <circle cx="160" cy="25" r="3" fill="rgb(168 85 247)" className="animate-pulse" />
                  </svg>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="flex justify-between items-end">
                {/* Left: Progress Tracker */}
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-purple-400" />
                  <div>
                    <p className="text-xs font-medium text-white">Level 7</p>
                    <p className="text-xs text-white/50">142 steps climbed</p>
                  </div>
                </div>

                {/* Right: Key Metrics */}
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-white/60">Notes this week</span>
                    <span className="text-xs font-medium text-purple-400">23</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-white/60">Insights explored</span>
                    <span className="text-xs font-medium text-purple-400">12</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-white/60">Active projects</span>
                    <span className="text-xs font-medium text-purple-400">3</span>
                  </div>
                </div>
              </div>
            </div>
          </AtmoCard>

          {/* Card 2 - AI Insights */}
          <AtmoCard variant="orange" className="w-full h-full" hover={true}>
            <CardHeader className="px-6 py-4">
              <h3 className="text-lg font-semibold text-white text-center">AI Insights</h3>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center text-white/60">
                <Lightbulb size={32} className="mx-auto mb-2 text-orange-400" />
                <p className="text-sm">Coming soon</p>
              </div>
            </CardContent>
          </AtmoCard>

          {/* Card 3 - Knowledge Graph */}
          <AtmoCard variant="blue" className="w-full h-full" hover={true}>
            <CardHeader className="px-6 py-4">
              <h3 className="text-lg font-semibold text-white text-center">Knowledge Graph</h3>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center text-white/60">
                <Brain size={32} className="mx-auto mb-2 text-blue-400" />
                <p className="text-sm">Coming soon</p>
              </div>
            </CardContent>
          </AtmoCard>

          {/* Card 4 - Analytics with Scheduler */}
          <AtmoCard variant="gold" className="w-full h-full overflow-hidden" hover={true}>
            <SchedulerView
              events={events}
              onEventsChange={setEvents}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </AtmoCard>

        </div>
      </div>

      {/* Right Panel - Avatar */}
      <div className="w-64 h-full flex flex-col items-center justify-start p-6 pt-32">
        <div
          className="relative"
          style={{
            filter: 'drop-shadow(0 0 15px rgba(204, 85, 0, 0.15))',
          }}
        >
          <SphereChat
            size={90}
            isActive={isCapturing}
            isListening={isCapturing}
            onClick={handleQuickCapture}
            voiceSupported={true}
          />

          {/* Subtle glow effects */}
          <div className={`absolute inset-0 -z-10 bg-[#CC5500]/10 rounded-full blur-xl transition-all duration-300 ${
            isCapturing ? 'animate-pulse scale-110' : 'animate-pulse-soft'
          }`}></div>
          <div className={`absolute inset-0 -z-20 bg-[#CC5500]/5 rounded-full blur-2xl scale-150 transition-all duration-300 ${
            isCapturing ? 'animate-pulse scale-125' : 'animate-pulse-soft'
          }`}></div>
        </div>

        {/* Voice Control X Button */}
        {isCapturing && (
          <div className="mt-16">
            <button
              onClick={() => setIsCapturing(false)}
              className="w-9 h-9 rounded-full bg-slate-800/60 hover:bg-slate-700/80 border border-slate-600/40 text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm shadow-lg flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalBrain;
