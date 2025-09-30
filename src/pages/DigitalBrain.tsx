import React, { useState } from 'react';
import { AtmoCard } from '@/components/molecules/AtmoCard';
import { CardContent, CardHeader } from '@/components/atoms/Card';
import SphereChat from '@/components/atoms/SphereChat';
import { User, BarChart3, Brain, Lightbulb, ChevronUp, TrendingUp, Target, Zap, Star } from 'lucide-react';

const DigitalBrain: React.FC = () => {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleQuickCapture = () => {
    setIsCapturing(!isCapturing);
    // TODO: Implement quick capture functionality
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-fixed opacity-[0.01] pointer-events-none" />
      <div className="fixed top-[20%] right-[25%] -z-10 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] animate-pulse-soft" />
      <div className="fixed top-[60%] left-[15%] -z-10 w-96 h-96 bg-orange-500/3 rounded-full blur-[120px] animate-pulse-soft" />

      <div className="container mx-auto px-4 py-8 h-screen">
        {/* Page Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Digital Brain</h1>
          <p className="text-white/60">Your personal knowledge ecosystem</p>
        </div>

        {/* Main Layout - 4 Cards Around Center Sphere */}
        <div className="relative h-[calc(100vh-200px)] flex items-center justify-center">
          
          {/* Card 1 - Top Left (User Profile) */}
          <div className="absolute top-0 left-0 w-[45%] h-[45%]">
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
          </div>

          {/* Card 3 - Top Right (AI Insights Feed) */}
          <div className="absolute top-0 right-0 w-[45%] h-[45%]">
            <AtmoCard variant="orange" className="w-full h-full" hover={true}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Lightbulb size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Card 3 - AI Insights</h3>
                    <p className="text-xs text-white/60">Feed</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 overflow-y-auto">
                <div className="space-y-3">
                  {/* Favourites Section */}
                  <div>
                    <h4 className="text-xs font-medium text-orange-400 mb-2">Favourites</h4>
                    <div className="space-y-2">
                      <div className="p-2 bg-black/20 rounded-lg border border-orange-500/20">
                        <p className="text-xs text-white/80">Insight placeholder</p>
                        <div className="flex gap-1 mt-1">
                          <span className="px-1 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">Tag</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* New Section */}
                  <div>
                    <h4 className="text-xs font-medium text-orange-400 mb-2">New</h4>
                    <div className="space-y-2">
                      <div className="p-2 bg-black/20 rounded-lg border border-orange-500/20">
                        <p className="text-xs text-white/80">Latest insight</p>
                        <div className="flex gap-1 mt-1">
                          <span className="px-1 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">Fresh</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </AtmoCard>
          </div>

          {/* Card 2 - Bottom Left (Knowledge Graph) */}
          <div className="absolute bottom-0 left-0 w-[45%] h-[45%]">
            <AtmoCard variant="blue" className="w-full h-full" hover={true}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Brain size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Card 2 - Knowledge Graph</h3>
                    <p className="text-xs text-white/60">Interactive nodes</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 h-full">
                <div className="h-full flex items-center justify-center border-2 border-dashed border-blue-400/30 rounded-lg">
                  <div className="text-center">
                    <Brain size={32} className="text-blue-400/60 mx-auto mb-2" />
                    <p className="text-white/60 text-sm mb-1">Knowledge Graph</p>
                    <p className="text-white/40 text-xs">Coming soon</p>
                  </div>
                </div>
              </CardContent>
            </AtmoCard>
          </div>

          {/* Card 4 - Bottom Right (Analytics) */}
          <div className="absolute bottom-0 right-0 w-[45%] h-[45%]">
            <AtmoCard variant="gold" className="w-full h-full" hover={true}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <BarChart3 size={20} className="text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Card 4 - Analytics</h3>
                    <p className="text-xs text-white/60">Usage insights</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-xl font-bold text-yellow-400">2.5h</p>
                    <p className="text-xs text-white/60">Today's usage</p>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/70">This week</span>
                    <span className="text-yellow-400 font-medium">18.2h</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/70">Projects</span>
                    <span className="text-yellow-400 font-medium">8</span>
                  </div>
                </div>
              </CardContent>
            </AtmoCard>
          </div>

          {/* Orange Sphere - Exactly in the Center */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <SphereChat
              size={80}
              isActive={isCapturing}
              isListening={isCapturing}
              onClick={handleQuickCapture}
              voiceSupported={true}
            />

            {/* Voice Control X Button */}
            {isCapturing && (
              <div className="absolute -bottom-24 -left-6">
                <button
                  onClick={() => setIsCapturing(false)}
                  className="w-10 h-10 rounded-full bg-slate-800/60 hover:bg-slate-700/80 border border-slate-600/40 text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm shadow-lg flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalBrain;
