import React, { useEffect, useState } from 'react';
import { Brain } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import useMockAuth from '@/hooks/useMockAuth';
import { usePocketBase } from '@/hooks/useMockPocketBase';
import PageHeader from "@/components/atoms/PageHeader";

const KnowledgeOrganiserSimple: React.FC = () => {
    const { user } = useMockAuth();
    const pb = usePocketBase();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('🔍 Simple KnowledgeOrganiser: Component mounted', { user: user?.nickname, pb: !!pb });

        const initializeData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Simulate some async operations that the original component does
                console.log('🔄 Simple KnowledgeOrganiser: Simulating data load...');
                await new Promise(resolve => setTimeout(resolve, 100));

                console.log('✅ Simple KnowledgeOrganiser: Data loaded successfully');
                setLoading(false);
            } catch (err) {
                console.error('❌ Simple KnowledgeOrganiser: Error loading data:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
                setLoading(false);
            }
        };

        initializeData();
    }, [user, pb]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
                    <div className="max-w-4xl mx-auto ml-[70px] lg:ml-[70px] xl:ml-auto 2xl:ml-auto">
                        <div className="text-center py-24">
                            <Brain className="w-16 h-16 text-[#FF7000]/60 mx-auto mb-4 animate-pulse" />
                            <p className="text-slate-400 text-lg">Loading Digital Brain...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
                    <div className="max-w-4xl mx-auto ml-[70px] lg:ml-[70px] xl:ml-auto 2xl:ml-auto">
                        <div className="text-center py-24">
                            <p className="text-red-400 text-lg mb-4">Error: {error}</p>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                            >
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
                <div className="max-w-4xl mx-auto ml-[70px] lg:ml-[70px] xl:ml-auto 2xl:ml-auto">
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-8">
                            <PageHeader title="Digital Brain" subTitle="Your centralized knowledge workspace and AI insights"/>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <section className="bg-slate-800/10 rounded-2xl border border-slate-700/20 p-8">
                            <h2 className="text-2xl font-light text-white mb-6">Welcome to Digital Brain</h2>
                            <div className="text-center py-12">
                                <div className="mb-6">
                                    <Brain className="w-16 h-16 text-[#FF7000]/60 mx-auto mb-4"/>
                                    <p className="text-slate-400 text-lg mb-2">Your Digital Brain is ready!</p>
                                    <p className="text-slate-500 text-sm">This simplified version is working correctly.</p>
                                    <p className="text-slate-600 text-xs mt-2">User: {user?.nickname || 'Unknown'}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button
                                        className="bg-[#FF7000]/20 hover:bg-[#FF7000]/30 text-[#FF7000] border border-[#FF7000]/30"
                                    >
                                        <Brain className="w-4 h-4 mr-2"/>
                                        Test Button
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeOrganiserSimple;
