import React, { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/atoms/ScrollArea.tsx";
import { Button } from "@/components/atoms/Button.tsx";
import { ChevronDown, ChevronUp, FileText, CheckSquare, MessageSquare, Calendar, Brain, Clock, ExternalLink } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/atoms/Collapsible.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/atoms/Dialog.tsx";
import { format } from 'date-fns';

interface OutputItem {
  id: string;
  title: string;
  content: string;
  type: 'summary' | 'note' | 'task' | 'message' | 'document';
  timestamp: Date;
}

const AIOutputFeed: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OutputItem | null>(null);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [outputItems, setOutputItems] = useState<OutputItem[]>([
    {
      id: '1',
      title: 'Project Planning Summary',
      content: 'Generated comprehensive project roadmap with 5 key milestones and resource allocation strategy. This includes timeline management, resource optimization, and risk assessment protocols for the next quarter.',
      type: 'summary',
      timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
    },
    {
      id: '2',
      title: 'Weekly Goals Analysis',
      content: 'Analyzed your progress patterns and suggested optimization for productivity cycles. Identified peak performance hours and recommended task scheduling adjustments.',
      type: 'note',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
    },
    {
      id: '3',
      title: 'Task: Review Code Architecture',
      content: 'Created task to review and refactor the main application architecture for better scalability. Focus on microservices transition and performance optimization.',
      type: 'task',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 hours ago
    },
    {
      id: '4',
      title: 'Meeting Notes: Team Sync',
      content: 'Automatically captured and summarized key points from your team synchronization meeting. Action items assigned and deadlines established for project deliverables.',
      type: 'document',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6) // 6 hours ago
    }
  ]);

  const getTypeIcon = (type: string, size: number = 10) => {
    switch (type) {
      case 'summary': return <FileText size={size} className="text-blue-400" />;
      case 'note': return <Brain size={size} className="text-purple-400" />;
      case 'task': return <CheckSquare size={size} className="text-green-400" />;
      case 'message': return <MessageSquare size={size} className="text-[#FF5F1F]" />;
      case 'document': return <Calendar size={size} className="text-yellow-400" />;
      default: return <FileText size={size} className="text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'summary': return 'text-blue-400';
      case 'note': return 'text-purple-400';
      case 'task': return 'text-green-400';
      case 'message': return 'text-[#FF5F1F]';
      case 'document': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const handleItemClick = (item: OutputItem) => {
    setSelectedItem(item);
  };

  const handleViewAll = () => {
    setIsViewAllOpen(true);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <div className="w-full bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-2xl border border-slate-700/30 backdrop-blur-xl shadow-lg hover:border-slate-600/30 transition-all duration-300">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full p-4 flex justify-between items-center hover:bg-white/5 rounded-t-2xl"
              onClick={handleToggleCollapse}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#FF5F1F]/20 border border-[#FF5F1F]/20">
                  <Brain className="w-4 h-4 text-[#FF5F1F]" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-medium text-white">ATMO Output</h3>
                  <p className="text-xs text-white/60">{outputItems.length} items today</p>
                </div>
              </div>
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-white/60" />
              ) : (
                <ChevronUp className="w-4 h-4 text-white/60" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4">
              <ScrollArea className="h-[280px]">
                <div className="space-y-2 pr-2">
                  {outputItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-black/20 border border-slate-600/30 hover:border-slate-500/50 hover:bg-black/30 transition-all duration-200 cursor-pointer group"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex-shrink-0">
                          {getTypeIcon(item.type, 12)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-medium text-white/90 truncate group-hover:text-white">
                              {item.title}
                            </h4>
                            <span className={`text-[9px] uppercase font-medium ${getTypeColor(item.type)} flex-shrink-0 ml-1`}>
                              {item.type}
                            </span>
                          </div>

                          <p className="text-[10px] text-white/60 line-clamp-2 mb-1 group-hover:text-white/70">
                            {item.content}
                          </p>

                          <div className="flex items-center gap-1 text-[9px] text-white/40">
                            <Clock size={9} />
                            <span>{format(item.timestamp, 'HH:mm')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="mt-3 pt-3 border-t border-slate-600/20">
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>Generated content</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-xs text-[#FF5F1F] hover:text-[#FF5F1F]/80"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewAll();
                    }}
                  >
                    View All
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* View All Dialog */}
      <Dialog open={isViewAllOpen} onOpenChange={setIsViewAllOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-gradient-to-br from-slate-900 to-slate-950 border border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Brain className="w-5 h-5 text-[#FF5F1F]" />
              ATMO Output - All Generated Content
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {outputItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg bg-black/20 border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    setSelectedItem(item);
                    setIsViewAllOpen(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getTypeIcon(item.type, 16)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-white">{item.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs uppercase font-medium ${getTypeColor(item.type)}`}>
                            {item.type}
                          </span>
                          <span className="text-xs text-white/50">
                            {format(item.timestamp, 'MMM d, HH:mm')}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed">{item.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Item Detail Dialog */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-lg bg-gradient-to-br from-slate-900 to-slate-950 border border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                {getTypeIcon(selectedItem.type, 16)}
                {selectedItem.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-white/60">
                <span className={`uppercase font-medium ${getTypeColor(selectedItem.type)}`}>
                  {selectedItem.type}
                </span>
                <span>{format(selectedItem.timestamp, 'MMMM d, yyyy • HH:mm')}</span>
              </div>

              <p className="text-white/90 leading-relaxed">{selectedItem.content}</p>

              <div className="flex gap-2 pt-4">
                <Button
                  size="sm"
                  className="bg-[#FF5F1F] hover:bg-[#FF5F1F]/90 text-white"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedItem.content);
                    setSelectedItem(null);
                  }}
                >
                  Copy Content
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => setSelectedItem(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AIOutputFeed;
