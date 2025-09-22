import React from 'react';
import { Target, TrendingUp, Zap } from 'lucide-react';
import { UserInsights } from '@/models/UserInsights';

interface InsightWidgetsProps {
  profile?: UserInsights;
}

const InsightWidgets: React.FC<InsightWidgetsProps> = ({
  profile
}) => {
  console.log("🎯 INSIGHT WIDGETS: Rendering with profile data:", {
    hasProfile: !!profile,
    topSkillsCount: profile?.topSkills?.length || 0,
    topicsCount: profile?.topicsOfInterest?.length || 0,
    interactionsCount: profile?.interactions?.length || 0,
    hasInteractionPattern: !!profile?.interactionPattern,
    interactions: profile?.interactions?.map(i => ({ name: i.name, usage: i.usage })) || []
  });

  return (
    <div className="bg-slate-800/10 rounded-2xl border border-slate-700/20 p-6 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Skills */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-300 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400"/>
            Top Skills
          </h3>
          <div className="space-y-2">
            {profile?.topSkills && profile.topSkills.length > 0 ? (
              profile.topSkills.slice(0, 3).map((skill, index) => (
                <div key={`skill-${skill.name}-${index}`} className="flex items-center gap-3">
                  <span className="text-sm text-white font-medium flex-shrink-0 min-w-0 truncate">{skill.name}</span>
                  <div className="flex-1 bg-slate-700/30 rounded-full h-1.5 min-w-[60px]">
                    <div
                      className="bg-gradient-to-r from-green-500 to-[#FF7000] h-1.5 rounded-full transition-all duration-500"
                      style={{width: `${skill.level}%`}}
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-semibold flex-shrink-0 w-8 text-right">{skill.level}%</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400">No data available</div>
            )}
          </div>
        </div>

        {/* Key Topics */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400"/>
            Key Topics
          </h3>
          <div className="space-y-3">
            {profile?.topicsOfInterest && profile.topicsOfInterest.length > 0 ? (
              profile.topicsOfInterest.slice(0, 3).map((topic, index) => (
                <div key={`topic-${topic.topic}-${index}`} className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium">{topic.topic}</span>
                  <span className="text-xs text-slate-400">{topic.frequency}</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400">No data available</div>
            )}
          </div>
        </div>

        {/* Active Integrations */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-300 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#FF7000]"/>
            Integrations
          </h3>
          <div className="space-y-3">
            {profile?.interactions && profile.interactions.length > 0 ? (
              profile.interactions.slice(0, 3).map((interaction, index) => (
                <div key={`interaction-${interaction.id}-${index}`}
                     className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium">{interaction.name}</span>
                  <span className="text-xs text-slate-400 text-center min-w-[3rem] font-semibold">{interaction.usage}%</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightWidgets; 