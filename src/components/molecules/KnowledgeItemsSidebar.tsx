import React, { useState } from 'react';
import { X, Plus, FileText, Mic, MessageSquare, FolderOpen, Brain, Link, Unlink, Star, Tag } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/Dialog';
import AssociationDialog from '@/components/molecules/AssociationDialog';
import { KnowledgeItem } from '@/models/KnowledgeItem';
import { Project } from '@/models/Project';

interface KnowledgeItemsSidebarProps {
  knowledgeItems: KnowledgeItem[];
  onRemoveItem: (knowledgeItemId: string) => void;
  onAddItems?: () => void;
  onAssociateItems?: (knowledgeItemIds: string[]) => void;
  availableKnowledgeItems?: KnowledgeItem[];
  isLoading?: boolean;
  
  // New props for KnowledgeOrganizer functionality
  projects?: Project[];
  onAssociateItem?: (item: KnowledgeItem) => void;
  onDeleteItem?: (knowledgeItemId: string) => void;
  onDragStart?: (item: KnowledgeItem) => void;
  onDragEnd?: () => void;
  mode?: 'project' | 'organizer'; // Determines which mode to use
}

const KnowledgeItemsSidebar: React.FC<KnowledgeItemsSidebarProps> = ({
  knowledgeItems,
  onRemoveItem,
  onAddItems,
  onAssociateItems,
  availableKnowledgeItems = [],
  isLoading = false,
  projects = [],
  onAssociateItem,
  onDeleteItem,
  onDragStart,
  onDragEnd,
  mode = 'project'
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<KnowledgeItem | null>(null);
  const [showAssociationDialog, setShowAssociationDialog] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

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

  const handleDeleteClick = (item: KnowledgeItem) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      if (mode === 'organizer' && onDeleteItem) {
        onDeleteItem(itemToDelete.id);
      } else {
        onRemoveItem(itemToDelete.id);
      }
      setItemToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const handleCancelDelete = () => {
    setItemToDelete(null);
    setShowDeleteDialog(false);
  };

  const handleShowAssociationDialog = () => {
    console.log("🔗 KNOWLEDGE SIDEBAR: handleShowAssociationDialog called", {
      hasAssociateHandler: !!onAssociateItems,
      availableItemsLength: availableKnowledgeItems.length,
      availableItems: availableKnowledgeItems.map(item => ({ id: item.id, name: item.name }))
    });
    
    if (onAssociateItems) {
      console.log("🔗 KNOWLEDGE SIDEBAR: Opening association dialog");
      setShowAssociationDialog(true);
      setSelectedItems(new Set());
    } else if (onAddItems) {
      console.log("🔗 KNOWLEDGE SIDEBAR: No associate handler, calling onAddItems");
      // Fallback to original behavior if no association handler provided
      onAddItems();
    }
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedItems(new Set(selectedIds));
  };

  const handleConfirmAssociation = (selectedIds: string[]) => {
    if (onAssociateItems && selectedIds.length > 0) {
      onAssociateItems(selectedIds);
      setSelectedItems(new Set());
      setShowAssociationDialog(false);
    }
  };

  const handleCancelAssociation = () => {
    setSelectedItems(new Set());
    setShowAssociationDialog(false);
  };

  // Filter out already associated items (for project mode)
  const unassociatedItems = availableKnowledgeItems.filter(
    item => !knowledgeItems.some(associatedItem => associatedItem.id === item.id)
  );

  // Sort items by date (most recent first)
  const sortedItems = knowledgeItems
    .slice()
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });

  return (
    <>
      <div className="w-80 lg:w-96 bg-slate-800/10 border-l border-slate-700/20 p-6 flex flex-col h-full flex-shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-white">Knowledge Items</h3>
          <span className="text-sm text-slate-500">{knowledgeItems.length} items</span>
        </div>

        {/* Add Items CTA - Only show in project mode or when handlers are available */}
        {(mode === 'project' || onAssociateItems || onAddItems) && (
          <Button
            onClick={handleShowAssociationDialog}
            disabled={isLoading}
            className="w-full mb-6 bg-[#FF7000]/20 hover:bg-[#FF7000]/30 text-[#FF7000] border border-[#FF7000]/30 gap-2"
          >
            <Link className="w-4 h-4" />
            {mode === 'organizer' ? 'Associate with Project' : 'Link Knowledge Items'}
          </Button>
        )}

        {/* Knowledge Items List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-[#FF7000] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Loading knowledge items...</p>
            </div>
          ) : knowledgeItems.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                {mode === 'organizer' ? 'No knowledge items found' : 'No knowledge items linked'}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                {mode === 'organizer' 
                  ? 'Knowledge items will appear here once synced' 
                  : 'Click "Link Knowledge Items" to add some'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  draggable={!!onDragStart}
                  onDragStart={(e) => {
                    if (onDragStart) {
                      onDragStart(item);
                      e.dataTransfer.effectAllowed = 'copy';
                      e.dataTransfer.setData('text/plain', item.id);
                    }
                  }}
                  onDragEnd={() => {
                    if (onDragEnd) {
                      onDragEnd();
                    }
                  }}
                  className={`group bg-slate-800/20 rounded-xl border border-slate-700/20 hover:border-[#FF7000]/20 transition-all duration-200 p-4 ${
                    onDragStart ? 'cursor-move' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="text-slate-400 mt-1 flex-shrink-0">
                      {getItemIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-white font-medium text-sm truncate group-hover:text-[#FF7000] transition-colors">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Star icon for organizer mode */}
                          {mode === 'organizer' && item.starred && (
                            <Star className="w-4 h-4 text-[#FF7000] fill-current" />
                          )}
                          {/* Associate button for organizer mode */}
                          {mode === 'organizer' && onAssociateItem && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onAssociateItem(item)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-[#FF7000] opacity-0 group-hover:opacity-100 transition-all duration-200"
                            >
                              <Link className="w-4 h-4" />
                            </Button>
                          )}
                          {/* Remove/Delete Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(item)}
                            disabled={isLoading}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                        {item.source && (
                          <>
                            <span>•</span>
                            <span className="truncate">{item.source}</span>
                          </>
                        )}
                      </div>
                      
                      {/* Show associated projects (organizer mode only) */}
                      {mode === 'organizer' && item.projects && item.projects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.projects.map(projectId => {
                            const project = projects.find(p => p.id === projectId);
                            return project ? (
                              <span
                                key={projectId}
                                className="px-2 py-1 bg-[#FF7000]/10 rounded text-xs text-[#FF7000] border border-[#FF7000]/20"
                              >
                                {project.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                      
                      {item.content && (
                        <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                          {item.content}
                        </p>
                      )}
                      
                      {/* Show tags if available (organizer mode only) */}
                      {mode === 'organizer' && item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className="flex items-center gap-1 px-2 py-1 bg-slate-700/30 rounded text-xs text-slate-400"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 2 && (
                            <span className="text-xs text-slate-500">
                              +{item.tags.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {mode === 'organizer' ? 'Delete Knowledge Item' : 'Remove Knowledge Item'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {mode === 'organizer' 
                ? `Are you sure you want to permanently delete "${itemToDelete?.name}"? This action cannot be undone and will remove the knowledge item from all projects.`
                : `Are you sure you want to remove "${itemToDelete?.name}" from this project? This will only remove the association, not delete the knowledge item itself.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {mode === 'organizer' ? 'Delete' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Association Dialog */}
      <AssociationDialog
        isOpen={showAssociationDialog}
        onOpenChange={setShowAssociationDialog}
        title={mode === 'organizer' ? 'Associate with Project' : 'Link Knowledge Items'}
        description={mode === 'organizer' 
          ? `Select projects to associate with "${itemToDelete?.name}"`
          : "Select knowledge items to associate with this project"
        }
        items={unassociatedItems.map(item => ({
          id: item.id,
          name: item.name,
          description: item.content,
          type: item.type,
          source: item.source,
          date: item.date
        }))}
        selectedItemIds={Array.from(selectedItems)}
        onSelectionChange={handleSelectionChange}
        onConfirm={handleConfirmAssociation}
        onCancel={handleCancelAssociation}
        confirmButtonText={mode === 'organizer' ? 'Associate' : 'Link Items'}
        itemType="knowledge-item"
        isLoading={isLoading}
      />
    </>
  );
};

export default KnowledgeItemsSidebar; 