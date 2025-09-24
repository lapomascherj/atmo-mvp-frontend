import React from 'react';
import { Brain } from 'lucide-react';
import { useAuth } from "@/hooks/useMockAuth";

const KnowledgeOrganiser: React.FC = () => {
    const { user } = useAuth();

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
                {/* Simplified background effects */}
                <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-fixed opacity-[0.01] pointer-events-none"></div>
                <div className="fixed top-[20%] right-[25%] -z-10 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] animate-pulse-soft"/>

                <div className="px-4 sm:px-6 lg:px-8 py-8">
                    {/* Left Content Column - Fixed width, left-anchored with generous right space */}
                    <div className="ml-[70px]" style={{ marginLeft: 'max(70px, 8vw)' }}>
                        <div className="max-w-2xl">
                            {/* Hero Header - Reduced top padding, left-anchored */}
                            <div className="mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/30">
                                        <Brain className="w-7 h-7 text-[#FF7000]"/>
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-light text-white mb-2">Digital Brain</h1>
                                        <p className="text-slate-400">Your centralized knowledge workspace and AI insights</p>
                                    </div>
                                </div>
                            </div>

                            {/* Your Personal Profile Card - Matches column width */}
                            <div className="mb-8">
                                <div className="bg-slate-800/10 rounded-2xl border border-slate-700/20 p-8">
                                    <h2 className="text-2xl font-light text-white mb-6">Your Personal Profile</h2>
                                    {/* Profile content will be added in future iterations */}
                                <div className="text-center py-12">
                                        <div className="text-slate-400">
                                            <p>Profile information will be displayed here</p>
                                            {user?.nickname && (
                                                <p className="mt-2 text-slate-300">Welcome back, {user.nickname}!</p>
                                            )}
                                    </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reserved Right Space - 40-50% open area for future content */}
                    <div className="absolute top-8 right-8 w-2/5 h-32 opacity-20 pointer-events-none">
                        <div className="text-slate-600 text-sm text-center mt-16">
                            {/* Future content area - analytics, widgets, insights */}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default KnowledgeOrganiser;
