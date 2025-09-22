import React, {useEffect, useState} from 'react';
import {Sparkles, Target} from 'lucide-react';
import {Button} from "@/components/atoms/Button.tsx";
import { usePocketBase } from "@/hooks/useMockPocketBase";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/atoms/Tooltip.tsx';

const DailyMapButton: React.FC = () => {
    const {toggleDailyMap, isDailyMapOpen, activities} = useGlobalStore();
    const [isHovered, setIsHovered] = useState(false);
    const [completionPercentage, setCompletionPercentage] = useState(0);

    // Calculate completion percentage
    useEffect(() => {
        if (activities.length > 0) {
            const completed = activities.filter(a => a.completed).length;
            const percentage = Math.round((completed / activities.length) * 100);
            setCompletionPercentage(percentage);
        }
    }, [activities]);

    const handleButtonClick = () => {
        console.log('DailyMapButton clicked, current state:', isDailyMapOpen);
        toggleDailyMap();
    };

    useEffect(() => {
        console.log('DailyMapButton rendered, isDailyMapOpen:', isDailyMapOpen);
    }, [isDailyMapOpen]);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={handleButtonClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className={`fixed bottom-6 right-6 rounded-full w-16 h-16 flex items-center justify-center shadow-2xl transition-all duration-500 z-50 backdrop-blur-xl border-2 group ${
                            isDailyMapOpen
                                ? 'border-[#FF7000]/60 bg-gradient-to-br from-[#FF7000]/20 to-[#FF7000]/30 text-[#FF7000] shadow-[0_0_30px_rgba(255,112,0,0.4)]'
                                : 'border-[#FF7000]/30 bg-gradient-to-br from-slate-800/80 to-slate-900/80 text-[#FF7000] hover:border-[#FF7000]/50 hover:shadow-[0_0_25px_rgba(255,112,0,0.3)]'
                        } ${isHovered ? 'scale-110' : 'scale-100'}`}
                        aria-label="Toggle Daily Warmup"
                    >
                        {/* Background glow effect */}
                        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
                            isDailyMapOpen
                                ? 'bg-[#FF7000]/10 animate-pulse'
                                : 'bg-[#FF7000]/5 group-hover:bg-[#FF7000]/10'
                        }`}></div>

                        {/* Progress ring */}
                        {completionPercentage > 0 && (
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                                <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    fill="none"
                                    stroke="rgba(148, 163, 184, 0.2)"
                                    strokeWidth="2"
                                />
                                <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    fill="none"
                                    stroke={isDailyMapOpen ? "rgba(255, 112, 0, 0.8)" : "rgba(255, 112, 0, 0.7)"}
                                    strokeWidth="2"
                                    strokeDasharray={`${(completionPercentage / 100) * 175.93} 175.93`}
                                    strokeLinecap="round"
                                    className="transition-all duration-700 ease-out"
                                />
                            </svg>
                        )}

                        {/* Icon with animation */}
                        <div className="relative z-10 flex items-center justify-center">
                            {isDailyMapOpen ? (
                                <div className="relative">
                                    <Sparkles
                                        className={`w-7 h-7 transition-all duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}/>
                                    <div className="absolute inset-0 animate-ping">
                                        <Sparkles className="w-7 h-7 opacity-30"/>
                                    </div>
                                </div>
                            ) : (
                                <Target
                                    className={`w-7 h-7 transition-all duration-300 ${isHovered ? 'scale-110 rotate-12' : 'scale-100 rotate-0'}`}/>
                            )}
                        </div>

                        {/* Completion percentage indicator */}
                        {completionPercentage > 0 && !isDailyMapOpen && (
                            <div
                                className="absolute -top-2 -right-2 w-6 h-6 bg-[#FF7000] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg animate-in zoom-in-50 duration-300 border border-[#FF7000]/50">
                                {completionPercentage}
                            </div>
                        )}

                        {/* Floating particles effect */}
                        {isHovered && (
                            <>
                                <div className="absolute top-2 right-2 w-1 h-1 bg-[#FF7000] rounded-full animate-ping"
                                     style={{animationDelay: '0ms'}}></div>
                                <div className="absolute bottom-3 left-3 w-1 h-1 bg-[#FF7000] rounded-full animate-ping"
                                     style={{animationDelay: '200ms'}}></div>
                                <div className="absolute top-4 left-2 w-1 h-1 bg-[#FF7000] rounded-full animate-ping"
                                     style={{animationDelay: '400ms'}}></div>
                            </>
                        )}

                        <span className="sr-only">Toggle Daily Warmup</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left"
                                className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 text-white border-slate-600/30 backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#FF7000]"/>
                        <div>
                            <p className="font-medium">Daily Warmup</p>
                            {completionPercentage > 0 && (
                                <p className="text-xs text-slate-400">{completionPercentage}% completed</p>
                            )}
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default DailyMapButton;
