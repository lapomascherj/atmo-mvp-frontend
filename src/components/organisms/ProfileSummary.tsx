import React, {useState} from 'react';
import {Target, TrendingUp, Zap} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {useProjectsStore} from "@/stores/useProjectsStore.ts";
import {UserInsights} from "@/models/UserInsights.ts";

interface UserProfileProps {
    profile: UserInsights
}

const ProfileSummary: React.FC<UserProfileProps> = ({profile}) => {
    const navigate = useNavigate();
    const {projects, addProjects} = useProjectsStore();
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [showKnowledgeItems, setShowKnowledgeItems] = useState(false);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [newProject, setNewProject] = useState({
        name: '',
        description: '',
        priority: 'medium' as 'high' | 'medium' | 'low'
    });


    return (
        <>
            <div className="bg-slate-800/10 rounded-2xl border border-slate-700/20 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Top Skills */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-slate-300 flex items-center gap-2">
                            <Target className="w-5 h-5 text-green-400"/>
                            Top Skills
                        </h3>
                        <div className="space-y-3">
                            {profile.topSkills?.slice(0, 3).map((skill, index) => (
                                <div key={skill.name} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white">{skill.name}</span>
                                        <span className="text-xs text-slate-400">{skill.level}%</span>
                                    </div>
                                    <div className="w-full bg-slate-700/30 rounded-full h-1">
                                        <div
                                            className="bg-gradient-to-r from-green-500 to-[#FF7000] h-1 rounded-full transition-all duration-300"
                                            style={{width: `${skill.level}%`}}
                                        />
                                    </div>
                                </div>
                            )) || (
                                <div className="text-sm text-slate-400">No skills data available</div>
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
                            {profile.topicsOfInterest?.slice(0, 3).map((topic, index) => (
                                <div key={topic.topic} className="flex items-center justify-between">
                                    <div>
                                        <span className="text-sm text-white">{topic.topic}</span>
                                        <p className="text-xs text-slate-400">{topic.frequency} interactions</p>
                                    </div>
                                </div>
                            )) || (
                                <div className="text-sm text-slate-400">No topics data available</div>
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
                            {profile.interactions?.slice(0, 3).map((interaction, index) => (
                                <div key={interaction.id}
                                     className="flex items-center justify-between">
                                    <span className="text-sm text-white">{interaction.name}</span>
                                    <span className="text-xs text-slate-400">{interaction.usage}%</span>
                                </div>
                            )) || (
                                <div className="text-sm text-slate-400">No interactions available</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfileSummary;
