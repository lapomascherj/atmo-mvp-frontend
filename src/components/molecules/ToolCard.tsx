import React from 'react';
import {Switch} from '@/components/atoms/Switch.tsx';
import {Button} from '@/components/atoms/Button.tsx';
import {AtmoCard} from '@/components/molecules/AtmoCard.tsx';
import {ArrowRight, ExternalLink} from 'lucide-react';
import {cn} from '@/utils/utils.ts';

interface ToolCardProps {
    name: string;
    icon: React.ReactNode;
    description: string;
    connected: boolean;
    onToggleConnection: (connected: boolean) => void;
    onOpenTool: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({
                                               name,
                                               icon,
                                               description,
                                               connected,
                                               onToggleConnection,
                                               onOpenTool
                                           }) => {
    return (
        <AtmoCard
            variant={connected ? 'orange' : 'default'}
            className={cn(
                "transition-all duration-500 ease-out",
                connected && "border-l-2 border-l-[#FF5F1F]"
            )}
            hover={true}
            glow={connected}
        >
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2.5 rounded-lg",
                            connected ? "bg-[#FF5F1F]/20" : "bg-black/40"
                        )}>
                            {React.cloneElement(icon as React.ReactElement, {
                                className: "w-5 h-5 text-[#FF5F1F]"
                            })}
                        </div>
                        <h3 className={cn(
                            "text-xl font-semibold",
                            connected ? "text-[#FF5F1F]" : "text-white"
                        )}>
                            {name}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 mr-2">{connected ? 'Connected' : 'Disconnected'}</span>
                        <Switch
                            checked={connected}
                            onCheckedChange={onToggleConnection}
                            className={connected ? "data-[state=checked]:bg-[#FF5F1F]" : ""}
                        />
                    </div>
                </div>

                <p className="text-white/70 mb-5">{description}</p>

                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        onClick={onOpenTool}
                        className={cn(
                            "group bg-black/40 border-white/20 hover:bg-black/60",
                            connected ? "text-[#FF5F1F] hover:text-[#FF5F1F]" : "text-white/70"
                        )}
                    >
                        {connected ? (
                            <>
                                Open Tool
                                <ExternalLink
                                    className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5"/>
                            </>
                        ) : (
                            <>
                                Connect
                                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5"/>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </AtmoCard>
    );
};

export default ToolCard;
