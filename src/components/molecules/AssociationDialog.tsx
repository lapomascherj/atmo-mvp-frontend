import React, { useState } from 'react';
import { Link, Unlink, FileText, Mic, MessageSquare, FolderOpen, Brain } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/Dialog';
import { KnowledgeItem } from '@/models/KnowledgeItem';
import { Project } from '@/models/Project';

interface AssociationItem {
  id: string;
  name: string;
  description?: string;
  type?: string;
  color?: string;
  priority?: string;
  source?: string;
  date?: string;
}

interface AssociationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  items: AssociationItem[];
  selectedItemIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onConfirm: (selectedIds: string[]) => void;
  onCancel: () => void;
  confirmButtonText?: string;
  itemType: 'project' | 'knowledge-item';
  isLoading?: boolean;
}

const AssociationDialog: React.FC<AssociationDialogProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  items,
  selectedItemIds,
  onSelectionChange,
  onConfirm,
  onCancel,
  confirmButtonText = 'Associate',
  itemType,
  isLoading = false
}) => {
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedItemIds);

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'voice':
        return <Mic className="w-4 h-4" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4" />;
      case 'integration':
        return <FolderOpen className="w-4 h-4" />;
      case 'summary':
        return <Brain className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleToggleSelection = (itemId: string) => {
    const newSelection = localSelectedIds.includes(itemId)
      ? localSelectedIds.filter(id => id !== itemId)
      : [...localSelectedIds, itemId];
    
    setLocalSelectedIds(newSelection);
    onSelectionChange(newSelection);
  };

  const handleConfirm = () => {
    onConfirm(localSelectedIds);
    // Reset local state after confirmation
    setLocalSelectedIds([]);
  };

  const handleCancel = () => {
    setLocalSelectedIds(selectedItemIds);
    onCancel();
  };

  const isSelected = (itemId: string) => localSelectedIds.includes(itemId);

  // Sort items by date (most recent first) or name
  const sortedItems = [...items].sort((a, b) => {
    if (itemType === 'knowledge-item' && a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (itemType === 'project') {
      // For projects, sort by last update (most recent first)
      const dateA = new Date(a.date || Date.now());
      const dateB = new Date(b.date || Date.now());
      return dateB.getTime() - dateA.getTime();
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800/10 backdrop-blur-xl border-slate-700/20 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#FF7000] text-lg font-medium">{title}</DialogTitle>
          <DialogDescription className="text-slate-400 text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-700/20 inline-block mb-4">
                <FileText className="w-8 h-8 text-slate-500 mx-auto" />
              </div>
              <p className="text-slate-400 text-sm font-medium">No items available</p>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                {itemType === 'project' 
                  ? 'No projects are available to associate with this item.' 
                  : 'No knowledge items are available to link to this project.'}
              </p>
            </div>
          ) : (
            sortedItems.map(item => {
              const selected = isSelected(item.id);
              return (
                <div
                  key={item.id}
                  className={`group bg-slate-800/20 rounded-xl border transition-all duration-200 p-4 cursor-pointer ${
                    selected 
                      ? 'border-[#FF7000]/50 bg-[#FF7000]/10 hover:border-[#FF7000]/60' 
                      : 'border-slate-700/20 hover:border-[#FF7000]/30'
                  }`}
                  onClick={() => handleToggleSelection(item.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`text-slate-400 mt-1 flex-shrink-0 transition-colors ${selected ? 'text-[#FF7000]' : ''}`}>
                      {itemType === 'project' ? (
                        <div className={`w-3 h-3 rounded-full ${item.color || 'bg-slate-500'}`} />
                      ) : (
                        getItemIcon(item.type || 'document')
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-white font-medium text-sm truncate group-hover:text-[#FF7000] transition-colors ${selected ? 'text-[#FF7000]' : ''}`}>
                        {item.name}
                      </h4>
                      
                      {/* Metadata row */}
                      <div className="flex items-center gap-2 mt-1">
                        {itemType === 'knowledge-item' && item.date && (
                          <span className="text-xs text-slate-500">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        )}
                        {item.source && (
                          <>
                            {itemType === 'knowledge-item' && item.date && <span className="text-xs text-slate-500">•</span>}
                            <span className="text-xs text-slate-500 truncate">{item.source}</span>
                          </>
                        )}
                        {item.priority && (
                          <>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="px-2 py-1 text-xs rounded-full bg-slate-700/30 text-slate-400 flex-shrink-0">
                              {item.priority}
                            </span>
                          </>
                        )}
                      </div>
                      
                      {/* Description */}
                      {item.description && (
                        <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Selection Icon - Always visible with orange color */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 w-8 p-0 flex-shrink-0 transition-all duration-200 ${
                        selected 
                          ? 'text-[#FF7000] hover:text-[#FF7000]/80 hover:bg-[#FF7000]/10' 
                          : 'text-[#FF7000]/70 hover:text-[#FF7000] hover:bg-[#FF7000]/10'
                      }`}
                    >
                      {/* Show Link when selected (will be linked), Unlink when not selected (currently unlinked) */}
                      {selected ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="gap-2 pt-4 border-t border-slate-700/30">
          <Button
            onClick={handleCancel}
            className="bg-slate-800/30 border border-slate-700/30 text-white hover:bg-slate-700/30 hover:text-white"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={localSelectedIds.length === 0 || isLoading}
            className="bg-[#FF7000] hover:bg-[#FF7000]/90 text-white border border-[#FF7000]/30 hover:border-[#FF7000]/40"
          >
            {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
            {confirmButtonText} {localSelectedIds.length > 0 ? `(${localSelectedIds.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssociationDialog; 