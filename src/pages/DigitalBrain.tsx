import React, { useState } from 'react';
import { AtmoCard } from '@/components/molecules/AtmoCard';
import { CardContent, CardHeader } from '@/components/atoms/Card';
import SphereChat from '@/components/atoms/SphereChat';
import { User, BarChart3, Brain, Lightbulb } from 'lucide-react';

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
            <AtmoCard variant="purple" className="w-full h-full" hover={true}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <User size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Card 1 - User Profile</h3>
                    <p className="text-xs text-white/60">Data & Growth</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/70">Notes</span>
                    <span className="text-purple-400 font-medium">127</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/70">Insights</span>
                    <span className="text-purple-400 font-medium">45</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/70">Projects</span>
                    <span className="text-purple-400 font-medium">8</span>
                  </div>
                  <div className="mt-4">
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-purple-400 rounded-full"></div>
                    </div>
                    <p className="text-xs text-white/50 mt-1">Weekly Growth</p>
                  </div>
                </div>
              </CardContent>
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
