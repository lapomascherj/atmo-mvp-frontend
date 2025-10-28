import React, { useRef, useEffect, useState, useCallback } from 'react';
import SphereChat from '@/components/atoms/SphereChat';
import { X } from 'lucide-react';
import { usePersonasStore } from '@/stores/usePersonasStore';
import { useChatSessionsStore } from '@/stores/chatSessionsStore';
import { updateUserProfile } from '@/services/supabaseDataService';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  isCapturing: boolean;
  setIsCapturing: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  isOpen,
  onClose,
  chatMessages,
  setChatMessages,
  chatInput,
  setChatInput,
  isCapturing,
  setIsCapturing,
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // State for dragging and blur - SIMPLIFIED
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isBlurred, setIsBlurred] = useState(true);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const [initialModalPos, setInitialModalPos] = useState({ x: 0, y: 0 });

  // BULLETPROOF DRAG SYSTEM - SIMPLE AND CLEAN
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only allow dragging from header, but exclude buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.no-drag')) {
      return;
    }
    
    if (headerRef.current && headerRef.current.contains(e.target as Node)) {
      e.preventDefault();
      e.stopPropagation();
      
      // Store initial positions - NO OFFSET CALCULATION
      setInitialMousePos({ x: e.clientX, y: e.clientY });
      setInitialModalPos({ x: position.x, y: position.y });
      setIsDragging(true);
    }
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      
      // Calculate how much the mouse has moved from initial position
      const deltaX = e.clientX - initialMousePos.x;
      const deltaY = e.clientY - initialMousePos.y;
      
      // Add the movement to the initial modal position
      const newX = initialModalPos.x + deltaX;
      const newY = initialModalPos.y + deltaY;
      
      // Get viewport dimensions and modal dimensions dynamically
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const modalRect = modalRef.current?.getBoundingClientRect();
      const modalWidth = modalRect?.width || 600;
      const modalHeight = modalRect?.height || 700;
      
      // Allow movement to all edges with minimal padding (5px)
      const padding = 5;
      const minX = -modalWidth + padding; // Allow moving mostly off-screen to the left
      const maxX = viewportWidth - padding; // Allow moving mostly off-screen to the right
      const minY = -modalHeight + 100; // Keep header visible when moving up
      const maxY = viewportHeight - padding; // Allow moving mostly off-screen down
      
      const boundedX = Math.max(minX, Math.min(maxX, newX));
      const boundedY = Math.max(minY, Math.min(maxY, newY));
      
      // Use requestAnimationFrame for ultra-smooth 60fps movement
      requestAnimationFrame(() => {
        setPosition({ x: boundedX, y: boundedY });
      });
    }
  }, [isDragging, initialMousePos, initialModalPos]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    }
  }, [isDragging]);

  // Touch handlers - SIMPLIFIED
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.no-drag')) {
      return;
    }
    
    if (headerRef.current && headerRef.current.contains(e.target as Node)) {
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      setInitialMousePos({ x: touch.clientX, y: touch.clientY });
      setInitialModalPos({ x: position.x, y: position.y });
      setIsDragging(true);
    }
  }, [position]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      
      // Calculate movement delta
      const deltaX = touch.clientX - initialMousePos.x;
      const deltaY = touch.clientY - initialMousePos.y;
      
      // Apply to initial position
      const newX = initialModalPos.x + deltaX;
      const newY = initialModalPos.y + deltaY;
      
      // Get viewport dimensions and modal dimensions dynamically
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const modalRect = modalRef.current?.getBoundingClientRect();
      const modalWidth = modalRect?.width || 600;
      const modalHeight = modalRect?.height || 700;
      
      // Allow movement to all edges with minimal padding (5px)
      const padding = 5;
      const minX = -modalWidth + padding; // Allow moving mostly off-screen to the left
      const maxX = viewportWidth - padding; // Allow moving mostly off-screen to the right
      const minY = -modalHeight + 100; // Keep header visible when moving up
      const maxY = viewportHeight - padding; // Allow moving mostly off-screen down
      
      const boundedX = Math.max(minX, Math.min(maxX, newX));
      const boundedY = Math.max(minY, Math.min(maxY, newY));
      
      // Use requestAnimationFrame for ultra-smooth touch movement
      requestAnimationFrame(() => {
        setPosition({ x: boundedX, y: boundedY });
      });
    }
  }, [isDragging, initialMousePos, initialModalPos]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    }
  }, [isDragging]);
  const handleHeaderDoubleClick = useCallback((e: React.MouseEvent) => {
    const currentTime = Date.now();
    if (currentTime - lastClickTime < 300) {
      setIsBlurred(!isBlurred);
    }
    setLastClickTime(currentTime);
  }, [lastClickTime, isBlurred]);

  // Reset position when modal opens
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Ultra-smooth event listeners with performance optimizations
  useEffect(() => {
    if (isDragging) {
      const options = { passive: false, capture: true };
      
      document.addEventListener('mousemove', handleMouseMove, options);
      document.addEventListener('mouseup', handleMouseUp, options);
      document.addEventListener('touchmove', handleTouchMove, options);
      document.addEventListener('touchend', handleTouchEnd, options);
      
      // Enhanced drag styling for better performance
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      document.body.style.WebkitUserSelect = 'none';
      document.body.style.MozUserSelect = 'none';
      document.body.style.msUserSelect = 'none';
      document.body.style.WebkitTouchCallout = 'none';
      document.body.style.pointerEvents = 'none';
      
      // Optimize rendering during drag
      document.body.style.textRendering = 'optimizeSpeed';
      document.body.style.imageRendering = 'auto';
      
      if (modalRef.current) {
        modalRef.current.style.pointerEvents = 'auto';
      }
    }

    return () => {
      const options = { passive: false, capture: true };
      document.removeEventListener('mousemove', handleMouseMove, options);
      document.removeEventListener('mouseup', handleMouseUp, options);
      document.removeEventListener('touchmove', handleTouchMove, options);
      document.removeEventListener('touchend', handleTouchEnd, options);
      
      // Reset all styles
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.WebkitUserSelect = '';
      document.body.style.MozUserSelect = '';
      document.body.style.msUserSelect = '';
      document.body.style.WebkitTouchCallout = '';
      document.body.style.pointerEvents = '';
      document.body.style.textRendering = '';
      document.body.style.imageRendering = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const focusChatInput = () => {
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleQuickCapture = () => {
    setIsCapturing(!isCapturing);
  };

  const sendChatMessage = usePersonasStore(state => state.sendChatMessage);
  const [isLoading, setIsLoading] = useState(false);
  const initializeChatSessions = useChatSessionsStore((state) => state.initialize);
  const refreshActiveSession = useChatSessionsStore((state) => state.refreshActiveSession);
  const activeSessionMessages = useChatSessionsStore((state) => state.messages);
  const chatMessagesRef = useRef(chatMessages);

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  useEffect(() => {
    if (!isOpen) return;

    const hydrateSession = async () => {
      try {
        await initializeChatSessions();
        await refreshActiveSession({ force: false });
      } catch (error) {
        console.error('ChatOverlay: Failed to hydrate active session', error);
      }
    };

    void hydrateSession();
  }, [isOpen, initializeChatSessions, refreshActiveSession]);

  useEffect(() => {
    if (!isOpen) return;

    // CRITICAL FIX: Only sync from store if we're NOT currently loading (sending a message)
    // This prevents race conditions where local messages get wiped while waiting for server response
    if (isLoading) {
      console.log('[ChatOverlay] Skipping message sync - message in flight');
      return;
    }

    if (activeSessionMessages.length === 0) {
      // Avoid wiping locally queued messages (e.g. when an invocation fails)
      if (chatMessagesRef.current.length > 0) {
        console.log('[ChatOverlay] Preserving local messages, store is empty');
        return;
      }
      setChatMessages([]);
      return;
    }

    const normalizedMessages: ChatMessage[] = activeSessionMessages.map((msg) => ({
      id: msg.id,
      text: msg.content,
      sender: msg.role === 'user' ? 'user' : 'ai',
      timestamp: new Date(msg.createdAt),
    }));

    // Only update if messages have actually changed
    const currentMessages = chatMessagesRef.current;
    if (currentMessages.length === normalizedMessages.length) {
      const isSame = currentMessages.every((msg, idx) =>
        msg.id === normalizedMessages[idx].id && msg.text === normalizedMessages[idx].text
      );
      if (isSame) {
        return; // No changes, skip update
      }
    }

    console.log('[ChatOverlay] Syncing messages from store:', normalizedMessages.length);
    setChatMessages(normalizedMessages);
  }, [isOpen, activeSessionMessages, setChatMessages, isLoading]);

  // Helper: Normalize status strings to enum values
  const normalizeStatus = (status: string): string => {
    const normalized = status.toLowerCase().replace(/[_-]/g, ' ');
    if (normalized.includes('complete') || normalized === 'done') return 'Completed';
    if (normalized.includes('progress') || normalized === 'active' || normalized === 'ongoing') return 'In Progress';
    return 'Planned';
  };

  // Helper: Normalize flexible date formats
  const normalizeDate = (dateStr: string): string => {
    const today = new Date();

    if (/tomorrow/i.test(dateStr)) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    if (/next\s+week/i.test(dateStr)) {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      return nextWeek.toISOString().split('T')[0];
    }

    // Try parsing as ISO or natural date
    try {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    } catch {}

    return ''; // Invalid date
  };

  // Helper: Check if string is a status keyword
  const isStatus = (str: string): boolean => {
    return /^(planned|in.?progress|complete|completed|done|active|ongoing)$/i.test(str);
  };

  // Helper: Resolve project by name with intelligent matching and fallback
  const resolveProject = (projectName: string, projects: any[]) => {
    // Filter active projects
    const activeProjects = projects.filter(p =>
      p.status !== 'deleted' && p.status !== 'completed'
    );

    if (activeProjects.length === 0) {
      return { project: null, error: 'no_active_projects' as const };
    }

    // Exact match (case-insensitive)
    const exactMatches = activeProjects.filter(p =>
      p.name.toLowerCase() === projectName.toLowerCase()
    );

    if (exactMatches.length === 1) {
      return { project: exactMatches[0], error: null };
    }

    if (exactMatches.length > 1) {
      // Multiple exact matches: pick most recently updated
      const mostRecent = exactMatches.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || 0);
        const dateB = new Date(b.updated_at || b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      })[0];

      return {
        project: mostRecent,
        error: null,
        ambiguous: true,
        matchCount: exactMatches.length
      };
    }

    // No exact matches - try partial matching
    const partialMatches = activeProjects.filter(p => {
      const projectLower = p.name.toLowerCase();
      const searchLower = projectName.toLowerCase();
      return projectLower.includes(searchLower) || searchLower.includes(projectLower);
    });

    if (partialMatches.length === 1) {
      return { 
        project: partialMatches[0], 
        error: null,
        fuzzyMatch: true
      };
    }

    // INTELLIGENT FALLBACK: If only one active project exists, suggest it
    if (activeProjects.length === 1) {
      return {
        project: activeProjects[0],
        error: null,
        suggestedFallback: true,
        message: `No project named "${projectName}" found. Would you like to add this to your only active project "${activeProjects[0].name}"?`
      };
    }

    return { 
      project: null, 
      error: 'not_found' as const,
      suggestions: activeProjects.slice(0, 3).map(p => p.name) // Suggest top 3 active projects
    };
  };

  // Proactive Intelligence: Helper functions for contextual analysis

  // Analyze project health and completeness
  const analyzeProjectHealth = (project: any) => ({
    hasGoals: (project.goals?.length || 0) > 0,
    hasMilestones: (project.milestones?.length || 0) > 0,
    hasTasks: project.goals?.some((g: any) => (g.tasks?.length || 0) > 0) || false,
    goalsCount: project.goals?.length || 0,
    milestonesCount: project.milestones?.length || 0,
    tasksCount: project.goals?.flatMap((g: any) => g.tasks || []).length || 0,
    isActive: project.status !== 'completed' && project.status !== 'deleted',
  });

  // Analyze deadline proximity for tasks/goals/milestones
  const analyzeDeadlines = (entity: any) => {
    const targetDate = entity.targetDate || entity.target_date || entity.due_date || entity.dueDate;
    if (!targetDate) return null;

    const deadline = new Date(targetDate);
    const now = new Date();
    const daysUntil = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      isOverdue: daysUntil < 0,
      isUrgent: daysUntil >= 0 && daysUntil <= 3,
      isApproaching: daysUntil > 3 && daysUntil <= 7,
      daysUntil,
      formattedDate: targetDate
    };
  };

  // Analyze workload across all projects
  const analyzeWorkload = (allProjects: any[]) => {
    const activeProjects = allProjects.filter(p =>
      p.status === 'In Progress' || p.status === 'Planned'
    );
    const allTasks = allProjects.flatMap(p =>
      (p.goals || []).flatMap((g: any) => g.tasks || [])
    ).filter((t: any) => !t.completed && !t.archived_at);

    return {
      activeProjectCount: activeProjects.length,
      totalActiveTasks: allTasks.length,
      tasksPerProject: activeProjects.length > 0 ? Math.round(allTasks.length / activeProjects.length) : 0,
      isOverloaded: activeProjects.length > 5 || allTasks.length > 20,
    };
  };

  // Generate proactive suggestions based on entity type and action
  const generateProactiveSuggestions = (
    entityType: 'project' | 'goal' | 'task' | 'milestone',
    action: 'created' | 'updated' | 'deleted' | 'completed',
    entityData: {
      name: string;
      entity?: any;
      project?: any;
      goal?: any;
      allProjects?: any[];
      focusAreas?: string[];
      mainPriority?: string;
      oldStatus?: string;
      newStatus?: string;
    }
  ): string[] => {
    const suggestions: string[] = [];

    // PROJECT CREATED
    if (entityType === 'project' && action === 'created' && entityData.entity) {
      const health = analyzeProjectHealth(entityData.entity);
      if (!health.hasGoals) {
        suggestions.push(`Add initial goals to track "${entityData.name}" progress?`);
      }
      if (!health.hasMilestones) {
        suggestions.push(`Create milestones with deadlines to structure this project?`);
      }
      if (entityData.focusAreas && entityData.focusAreas.length > 0) {
        suggestions.push(`Align this with your Focus Areas: ${entityData.focusAreas.slice(0, 2).join(', ')}?`);
      }
    }

    // PROJECT UPDATED
    if (entityType === 'project' && action === 'updated' && entityData.project) {
      const health = analyzeProjectHealth(entityData.project);
      if (entityData.newStatus === 'In Progress' && !health.hasMilestones) {
        suggestions.push(`Add milestones to track progress on "${entityData.name}"?`);
      }
      if (entityData.newStatus === 'In Progress' && !health.hasTasks) {
        suggestions.push(`Break down goals into actionable tasks to get started?`);
      }
      if (entityData.newStatus === 'Completed') {
        suggestions.push(`🎉 Celebrate this win! Archive completed tasks and review learnings?`);
      }
      if (entityData.allProjects) {
        const workload = analyzeWorkload(entityData.allProjects);
        if (workload.isOverloaded) {
          suggestions.push(`You have ${workload.activeProjectCount} active projects—want to prioritize or archive some?`);
        }
      }
    }

    // PROJECT DELETED
    if (entityType === 'project' && action === 'deleted') {
      if (entityData.allProjects) {
        const workload = analyzeWorkload(entityData.allProjects);
        suggestions.push(`You now have ${workload.activeProjectCount} active projects. Want to review priorities?`);
      }
    }

    // GOAL CREATED
    if (entityType === 'goal' && action === 'created' && entityData.goal && entityData.project) {
      const goalTaskCount = entityData.goal.tasks?.length || 0;
      if (goalTaskCount === 0) {
        suggestions.push(`Break "${entityData.name}" into specific tasks to make it actionable?`);
      }

      const deadline = analyzeDeadlines(entityData.goal);
      if (!deadline) {
        suggestions.push(`Set a target completion date for "${entityData.name}"?`);
      } else if (deadline.daysUntil > 30) {
        suggestions.push(`"${entityData.name}" is ${deadline.daysUntil} days away—create milestone checkpoints?`);
      } else if (deadline.isUrgent) {
        suggestions.push(`"${entityData.name}" is due in ${deadline.daysUntil} days—prioritize tasks as High?`);
      }

      const projectGoals = entityData.project.goals?.length || 0;
      if (projectGoals > 3) {
        suggestions.push(`${projectGoals} goals in this project—want to prioritize focus areas?`);
      }
    }

    // GOAL UPDATED
    if (entityType === 'goal' && action === 'updated' && entityData.goal) {
      if (entityData.newStatus === 'In Progress') {
        const taskCount = entityData.goal.tasks?.length || 0;
        if (taskCount === 0) {
          suggestions.push(`Started "${entityData.name}"—create tasks to track execution?`);
        }
      }
      if (entityData.newStatus === 'Completed') {
        suggestions.push(`🎉 Goal "${entityData.name}" achieved! Create a new goal to maintain momentum?`);
      }
    }

    // TASK CREATED
    if (entityType === 'task' && action === 'created' && entityData.entity && entityData.goal) {
      const task = entityData.entity;
      if (!task.priority || task.priority === 'Medium') {
        if (entityData.focusAreas && entityData.focusAreas.length > 0) {
          suggestions.push(`Prioritize "${entityData.name}" based on Focus: ${entityData.focusAreas[0]}?`);
        } else {
          suggestions.push(`Set priority for "${entityData.name}" (High/Medium/Low)?`);
        }
      }

      const deadline = analyzeDeadlines(task);
      if (!deadline) {
        const goalDeadline = analyzeDeadlines(entityData.goal);
        if (goalDeadline && goalDeadline.daysUntil > 0) {
          suggestions.push(`"${entityData.goal.name}" is due in ${goalDeadline.daysUntil} days—set task deadline?`);
        } else {
          suggestions.push(`Set a due date to stay on track?`);
        }
      }

      const goalTasks = entityData.goal.tasks?.length || 0;
      if (goalTasks > 5) {
        suggestions.push(`${goalTasks} tasks in "${entityData.goal.name}"—break into smaller sub-goals?`);
      }
    }

    // TASK PRIORITIZED
    if (entityType === 'task' && action === 'updated' && entityData.entity) {
      const deadline = analyzeDeadlines(entityData.entity);
      if (!deadline) {
        suggestions.push(`Task is now ${entityData.entity.priority}—set a due date to match urgency?`);
      }
      if (entityData.entity.priority === 'High') {
        suggestions.push(`High priority task—want to create subtasks or checkpoints?`);
      }
    }

    // MILESTONE CREATED
    if (entityType === 'milestone' && action === 'created' && entityData.entity && entityData.project) {
      const milestone = entityData.entity;
      const deadline = analyzeDeadlines(milestone);
      if (!deadline) {
        suggestions.push(`Set a deadline for "${entityData.name}" milestone?`);
      }

      const projectTasks = entityData.project.goals?.flatMap((g: any) => g.tasks || []) || [];
      const relevantTasks = projectTasks.filter((t: any) => !t.completed && !t.archived_at).length;
      if (relevantTasks === 0) {
        suggestions.push(`Create tasks to achieve "${entityData.name}" milestone?`);
      }

      const milestoneCount = entityData.project.milestones?.length || 0;
      if (deadline && deadline.daysUntil > 14 && milestoneCount < 3) {
        suggestions.push(`"${entityData.name}" is ${deadline.daysUntil} days away—add intermediate milestones?`);
      }
    }

    // MILESTONE COMPLETED
    if (entityType === 'milestone' && action === 'completed' && entityData.project) {
      suggestions.push(`🎉 Milestone achieved! Review progress and plan next steps?`);

      const remainingMilestones = entityData.project.milestones?.filter(
        (m: any) => m.status !== 'Completed' && m.status !== 'deleted'
      ).length || 0;
      if (remainingMilestones > 0) {
        suggestions.push(`${remainingMilestones} milestones remaining—want to prioritize the next one?`);
      } else {
        suggestions.push(`All milestones complete! Update project status or create new goals?`);
      }
    }

    return suggestions.slice(0, 3); // Max 3 suggestions
  };

  // Helper: Extract project context from recent conversation
  const extractProjectContext = () => {
    const recentMessages = chatMessages.slice(-10); // Look at last 10 messages
    const projectNames = new Set<string>();
    
    for (const message of recentMessages) {
      // Look for project mentions in recent messages
      const projectMentions = message.text.match(/project\s+["']?([^"'\n,]+)["']?/gi);
      if (projectMentions) {
        projectMentions.forEach(mention => {
          const match = mention.match(/project\s+["']?([^"'\n,]+)["']?/i);
          if (match) {
            projectNames.add(match[1].trim());
          }
        });
      }
      
      // Look for "working on X" or "focusing on X" patterns
      const workingOnMatches = message.text.match(/(?:working on|focusing on|building|developing)\s+["']?([^"'\n,]+)["']?/gi);
      if (workingOnMatches) {
        workingOnMatches.forEach(mention => {
          const match = mention.match(/(?:working on|focusing on|building|developing)\s+["']?([^"'\n,]+)["']?/i);
          if (match) {
            projectNames.add(match[1].trim());
          }
        });
      }
    }
    
    return Array.from(projectNames);
  };

  const handleSendMessage = async () => {
    console.log('🔵 [ChatOverlay] handleSendMessage called');
    console.log('🔵 [ChatOverlay] chatInput:', chatInput);
    console.log('🔵 [ChatOverlay] isLoading:', isLoading);

    if (chatInput.trim() && !isLoading) {
      const userMessageText = chatInput.trim();
      console.log('🔵 [ChatOverlay] Processing message:', userMessageText);

      // Add user message
      const newMessage = {
        id: Date.now().toString(),
        text: userMessageText,
        sender: 'user' as const,
        timestamp: new Date()
      };
      console.log('🔵 [ChatOverlay] Adding user message to chat');
      setChatMessages(prev => [...prev, newMessage]);
      setChatInput('');
      setIsLoading(true);

      try {
        // Local command parsing - handle delete project commands
        const deleteProjectMatch = userMessageText.match(/^(delete|remove)\s+project\s+(.+)$/i);
        if (deleteProjectMatch) {
          const projectIdentifier = deleteProjectMatch[2].trim();
          const { getProjects, removeProject } = usePersonasStore.getState();
          const projects = getProjects();

          // Match by ID or exact name (case-insensitive)
          const projectToDelete = projects.find(p =>
            p.id === projectIdentifier ||
            p.name.toLowerCase() === projectIdentifier.toLowerCase()
          );

          if (projectToDelete) {
            // Idempotent check - ensure project isn't already deleted
            if (projectToDelete.status === 'deleted') {
              const alreadyDeletedMessage = {
                id: (Date.now() + 1).toString(),
                text: `⚠️ Project "${projectToDelete.name}" is already deleted.`,
                sender: 'ai' as const,
                timestamp: new Date()
              };
              setChatMessages(prev => [...prev, alreadyDeletedMessage]);
              setIsLoading(false);
              return;
            }

            // Delete project
            const projectName = projectToDelete.name;
            await removeProject(null, projectToDelete.id);
            const successMessage = {
              id: (Date.now() + 1).toString(),
              text: `✅ Deleted project: **${projectName}**`,
              sender: 'ai' as const,
              timestamp: new Date()
            };
            setChatMessages(prev => [...prev, successMessage]);

            // Proactive suggestions after project deletion
            const { getProjects: getProjectsFresh } = usePersonasStore.getState();
            const remainingProjects = getProjectsFresh();
            const suggestions = generateProactiveSuggestions('project', 'deleted', {
              name: projectName,
              allProjects: remainingProjects
            });

            if (suggestions.length > 0) {
              setChatMessages(prev => [...prev, {
                id: (Date.now() + 2).toString(),
                text: `**Next steps you might want:**\n${suggestions.map(s => `• ${s}`).join('\n')}`,
                sender: 'ai' as const,
                timestamp: new Date()
              }]);
            }

            setIsLoading(false);
            return;
          } else {
            const notFoundMessage = {
              id: (Date.now() + 1).toString(),
              text: `❌ Project "${projectIdentifier}" not found.`,
              sender: 'ai' as const,
              timestamp: new Date()
            };
            setChatMessages(prev => [...prev, notFoundMessage]);
            setIsLoading(false);
            return;
          }
        }

        // Local command parsing - handle project creation/update/delete commands
        const projectPatterns = [
          // create project '{name}' for {purpose/description}
          { regex: /(?:create|add|start)\s+(?:a\s+)?project\s+['"](.+?)['"]\s+for\s+(.+)$/i, action: 'create' as const },
          // create project '{name}' with priority {priority}
          { regex: /(?:create|add|start)\s+(?:a\s+)?project\s+['"](.+?)['"]\s+(?:with\s+)?(?:priority\s+)?(\w+)$/i, action: 'create' as const, hasPriority: true },
          // create project '{name}' (simple)
          { regex: /(?:create|add|start)\s+(?:a\s+)?project\s+['"](.+?)['"]$/i, action: 'create' as const, simple: true },
          // update project '{name}' status to {status}
          { regex: /(?:update|change)\s+project\s+['"](.+?)['"]\s+status\s+(?:to\s+)?(\w+[-\s\w]*)$/i, action: 'update' as const, field: 'status' },
          // update project '{name}' priority to {priority}
          { regex: /(?:update|change)\s+project\s+['"](.+?)['"]\s+priority\s+(?:to\s+)?(\w+)$/i, action: 'update' as const, field: 'priority' },
        ];

        let parsedProjectCommand: {
          action: 'create' | 'update';
          projectName: string;
          description?: string;
          priority?: string;
          status?: string;
          field?: string;
        } | null = null;

        for (const pattern of projectPatterns) {
          const match = userMessageText.match(pattern.regex);
          if (match) {
            if (pattern.simple) {
              parsedProjectCommand = {
                action: 'create',
                projectName: match[1].trim(),
              };
            } else if (pattern.hasPriority) {
              parsedProjectCommand = {
                action: 'create',
                projectName: match[1].trim(),
                priority: normalizeStatus(match[2].trim()),
              };
            } else if (pattern.field === 'status') {
              parsedProjectCommand = {
                action: 'update',
                projectName: match[1].trim(),
                status: normalizeStatus(match[2].trim()),
                field: 'status',
              };
            } else if (pattern.field === 'priority') {
              parsedProjectCommand = {
                action: 'update',
                projectName: match[1].trim(),
                priority: match[2].trim(),
                field: 'priority',
              };
            } else {
              // Full form with description
              parsedProjectCommand = {
                action: 'create',
                projectName: match[1].trim(),
                description: match[2].trim(),
              };
            }
            break;
          }
        }

        if (parsedProjectCommand) {
          console.log(`📊 [${new Date().toLocaleTimeString()}] Parsed project command:`, parsedProjectCommand);

          const { getProjects, addProject, updateProject } = usePersonasStore.getState();
          const projects = getProjects();

          try {
            if (parsedProjectCommand.action === 'create') {
              // Idempotent check: verify project doesn't already exist
              const existingProject = projects.find(p =>
                p.name.toLowerCase() === parsedProjectCommand!.projectName.toLowerCase() &&
                p.status !== 'deleted'
              );

              if (existingProject) {
                setChatMessages(prev => [...prev, {
                  id: (Date.now() + 1).toString(),
                  text: `ℹ️ Project **"${parsedProjectCommand.projectName}"** already exists. Use 'update project' to modify it.`,
                  sender: 'ai' as const,
                  timestamp: new Date()
                }]);
                setIsLoading(false);
                return;
              }

              // Create new project with stable UUID
              const projectId = crypto.randomUUID();
              const newProject: any = {
                id: projectId,
                name: parsedProjectCommand.projectName,
                description: parsedProjectCommand.description || '',
                status: 'Planned',
                priority: parsedProjectCommand.priority || 'Medium',
                active: true,
                color: '#3b82f6',
                goals: [],
                milestones: [],
                items: [],
              };

              await addProject(null, newProject);

              console.log(`✅ [${new Date().toLocaleTimeString()}] Project created:`, { projectId, projectName: newProject.name });

              setChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: `✅ Created project **"${parsedProjectCommand.projectName}"**${parsedProjectCommand.description ? ` for ${parsedProjectCommand.description}` : ''}`,
                sender: 'ai' as const,
                timestamp: new Date()
              }]);

              // Proactive suggestions after project creation
              const { profileSnapshot } = usePersonasStore.getState();
              const suggestions = generateProactiveSuggestions('project', 'created', {
                name: newProject.name,
                entity: newProject,
                allProjects: projects,
                focusAreas: profileSnapshot?.focusAreas || [],
                mainPriority: profileSnapshot?.mainPriority
              });

              if (suggestions.length > 0) {
                setChatMessages(prev => [...prev, {
                  id: (Date.now() + 2).toString(),
                  text: `**Next steps you might want:**\n${suggestions.map(s => `• ${s}`).join('\n')}`,
                  sender: 'ai' as const,
                  timestamp: new Date()
                }]);
              }

              setIsLoading(false);
              return;
            }

            if (parsedProjectCommand.action === 'update') {
              // Find project by name
              const projectToUpdate = projects.find(p =>
                p.name.toLowerCase() === parsedProjectCommand!.projectName.toLowerCase() &&
                p.status !== 'deleted'
              );

              if (!projectToUpdate) {
                setChatMessages(prev => [...prev, {
                  id: (Date.now() + 1).toString(),
                  text: `❌ Project **"${parsedProjectCommand.projectName}"** not found.`,
                  sender: 'ai' as const,
                  timestamp: new Date()
                }]);
                setIsLoading(false);
                return;
              }

              // Update project
              const oldStatus = projectToUpdate.status;
              const updates: any = {};
              if (parsedProjectCommand.status) updates.status = parsedProjectCommand.status;
              if (parsedProjectCommand.priority) updates.priority = parsedProjectCommand.priority;

              await updateProject(null, projectToUpdate.id, updates);

              setChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: `✅ Updated project **"${parsedProjectCommand.projectName}"** ${parsedProjectCommand.field}`,
                sender: 'ai' as const,
                timestamp: new Date()
              }]);

              // Proactive suggestions after project update
              const { profileSnapshot: profileSnap } = usePersonasStore.getState();
              const updatedProjects = getProjects(); // Get fresh data
              const updatedProject = updatedProjects.find(p => p.id === projectToUpdate.id);
              if (updatedProject) {
                const suggestions = generateProactiveSuggestions('project', 'updated', {
                  name: updatedProject.name,
                  project: updatedProject,
                  allProjects: updatedProjects,
                  oldStatus,
                  newStatus: updates.status,
                  focusAreas: profileSnap?.focusAreas || []
                });

                if (suggestions.length > 0) {
                  setChatMessages(prev => [...prev, {
                    id: (Date.now() + 2).toString(),
                    text: `**Next steps you might want:**\n${suggestions.map(s => `• ${s}`).join('\n')}`,
                    sender: 'ai' as const,
                    timestamp: new Date()
                  }]);
                }
              }

              setIsLoading(false);
              return;
            }
          } catch (error) {
            const errorMessage = {
              id: (Date.now() + 1).toString(),
              text: `❌ Failed to ${parsedProjectCommand.action} project: ${error instanceof Error ? error.message : 'Unknown error'}`,
              sender: 'ai' as const,
              timestamp: new Date()
            };
            setChatMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
            return;
          }
        }

        // Local command parsing - handle growth tracker update commands
        const growthTrackerMatch = userMessageText.match(/^(update|set)\s+growth\s+tracker:?\s+(.+)$/i);
        if (growthTrackerMatch) {
          const growthTrackerText = growthTrackerMatch[2].trim();
          const { profileSnapshot } = usePersonasStore.getState();

          if (profileSnapshot?.id) {
            try {
              await updateUserProfile(profileSnapshot.id, { growthTracker: growthTrackerText });
              const successMessage = {
                id: (Date.now() + 1).toString(),
                text: `✅ Growth Tracker updated to: **${growthTrackerText}**`,
                sender: 'ai' as const,
                timestamp: new Date()
              };
              setChatMessages(prev => [...prev, successMessage]);
              setIsLoading(false);
              return;
            } catch (error) {
              const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: `❌ Failed to update Growth Tracker: ${error instanceof Error ? error.message : 'Unknown error'}`,
                sender: 'ai' as const,
                timestamp: new Date()
              };
              setChatMessages(prev => [...prev, errorMessage]);
              setIsLoading(false);
              return;
            }
          }
        }

        // Local command parsing - handle goal creation/update commands with entity extraction
        // Pattern 1: add a goal '{title}' to {projectName} [with] [status {status}] [due/by/target {date}]
        // Pattern 2: add a goal to {projectName} named '{title}' [due/by {date}]
        // Pattern 3: edit/update goal '{title}' in {projectName} [status {status}]
        // Pattern 4: edit/update goal '{title}' in {projectName} [due/by/target {date}]

        const goalPatterns = [
          // add a goal '{title}' to {project} with status {status} due {date}
          { regex: /add\s+a\s+goal\s+['"](.+?)['"]\s+to\s+(.+?)(?:\s+with)?(?:\s+status\s+(\w+[-\s\w]*?))?(?:\s+(?:due|by|target)\s+(.+?))?$/i, action: 'create' as const },
          // add a goal to {project} named '{title}' due {date}
          { regex: /add\s+a\s+goal\s+to\s+(.+?)\s+named\s+['"](.+?)['"'](?:\s+(?:due|by|target)\s+(.+?))?$/i, action: 'create' as const, swap: true },
          // edit/update goal '{title}' in {project} status {status}
          { regex: /(?:edit|update)\s+goal\s+['"](.+?)['"]\s+in\s+(.+?)\s+status\s+(\w+[-\s\w]*)$/i, action: 'update' as const },
          // edit/update goal '{title}' in {project} due/by/target {date}
          { regex: /(?:edit|update)\s+goal\s+['"](.+?)['"]\s+in\s+(.+?)\s+(?:due|by|target)\s+(.+?)$/i, action: 'update' as const, isDate: true },
          // Fallback: add a goal to {project} (simple form)
          { regex: /add\s+a\s+goal\s+to\s+(.+?)$/i, action: 'create' as const, simple: true },
        ];

        let parsedGoalCommand: {
          action: 'create' | 'update';
          goalTitle: string;
          projectName: string;
          status?: string;
          targetDate?: string;
        } | null = null;

        for (const pattern of goalPatterns) {
          const match = userMessageText.match(pattern.regex);
          if (match) {
            if (pattern.simple) {
              // Simple form: add a goal to {project}
              parsedGoalCommand = {
                action: 'create',
                goalTitle: 'New Goal',
                projectName: match[1].trim(),
              };
            } else if (pattern.swap) {
              // Swapped order: project before title
              parsedGoalCommand = {
                action: pattern.action,
                goalTitle: match[2]?.trim() || 'New Goal',
                projectName: match[1]?.trim(),
                targetDate: match[3] ? normalizeDate(match[3].trim()) : undefined,
              };
            } else if (pattern.isDate) {
              // Update with date
              parsedGoalCommand = {
                action: pattern.action,
                goalTitle: match[1]?.trim(),
                projectName: match[2]?.trim(),
                targetDate: match[3] ? normalizeDate(match[3].trim()) : undefined,
              };
            } else {
              // Full form with title, project, optional status and date
              const goalTitle = match[1]?.trim() || 'New Goal';
              const projectName = match[2]?.trim();
              const statusRaw = match[3]?.trim();
              const dateRaw = match[4]?.trim();

              parsedGoalCommand = {
                action: pattern.action,
                goalTitle,
                projectName,
                status: statusRaw ? normalizeStatus(statusRaw) : undefined,
                targetDate: dateRaw ? normalizeDate(dateRaw) : undefined,
              };
            }
            break;
          }
        }

        if (parsedGoalCommand) {
          console.log(`🎯 [${new Date().toLocaleTimeString()}] Parsed goal command:`, parsedGoalCommand);

          const { getProjects, addGoal, updateGoal } = usePersonasStore.getState();
          const projects = getProjects();

          console.log(`📊 [${new Date().toLocaleTimeString()}] Available projects:`, projects.map(p => ({ id: p.id, name: p.name, status: p.status })));

          // Resolve project by name with improved intelligence
          const resolution = resolveProject(parsedGoalCommand.projectName, projects);
          const { project: matchedProject, error, ambiguous, matchCount, fuzzyMatch, suggestedFallback, message, suggestions } = resolution;

          console.log(`🔍 [${new Date().toLocaleTimeString()}] Project resolution:`, { matchedProject: matchedProject?.name, error, ambiguous, matchCount, fuzzyMatch, suggestedFallback });

          if (error === 'no_active_projects') {
            setChatMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              text: `❌ No active projects found. Please create a project first before adding goals.`,
              sender: 'ai' as const,
              timestamp: new Date()
            }]);
            setIsLoading(false);
            return;
          }

          if (error === 'not_found') {
            const suggestionText = suggestions && suggestions.length > 0 
              ? `\n\nYour active projects:\n${suggestions.map((name, i) => `${i + 1}. ${name}`).join('\n')}`
              : '';
            setChatMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              text: `❌ Project **"${parsedGoalCommand.projectName}"** not found.${suggestionText}\n\nPlease use an exact project name or create the project first.`,
              sender: 'ai' as const,
              timestamp: new Date()
            }]);
            setIsLoading(false);
            return;
          }

          // Handle suggested fallback
          if (suggestedFallback && message) {
            setChatMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              text: message,
              sender: 'ai' as const,
              timestamp: new Date()
            }]);
            setIsLoading(false);
            return;
          }

          if (ambiguous) {
            setChatMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              text: `⚠️ Found ${matchCount} projects named **"${parsedGoalCommand.projectName}"**. Using the most recently updated one: **${matchedProject?.name}**.`,
              sender: 'ai' as const,
              timestamp: new Date()
            }]);
          }

          if (fuzzyMatch) {
            setChatMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              text: `ℹ️ No exact match for **"${parsedGoalCommand.projectName}"** found. Using similar project: **${matchedProject?.name}**.`,
              sender: 'ai' as const,
              timestamp: new Date()
            }]);
          }

          try {
            if (parsedGoalCommand.action === 'create') {
              // Check if goal with same name already exists (idempotent upsert)
              const existingGoal = matchedProject.goals?.find((g: any) =>
                g.name.toLowerCase() === parsedGoalCommand!.goalTitle.toLowerCase() &&
                g.status !== 'deleted'
              );

              if (existingGoal) {
                // Update existing goal instead of creating duplicate
                const updates: any = {};
                if (parsedGoalCommand.status) updates.status = parsedGoalCommand.status;
                if (parsedGoalCommand.targetDate) updates.targetDate = parsedGoalCommand.targetDate;

                if (Object.keys(updates).length > 0) {
                  await updateGoal(null, existingGoal.id, updates);
                  setChatMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    text: `✅ Updated existing goal **"${parsedGoalCommand.goalTitle}"** in project **${matchedProject.name}**`,
                    sender: 'ai' as const,
                    timestamp: new Date()
                  }]);
                } else {
                  setChatMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    text: `ℹ️ Goal **"${parsedGoalCommand.goalTitle}"** already exists in project **${matchedProject.name}**`,
                    sender: 'ai' as const,
                    timestamp: new Date()
                  }]);
                }
                setIsLoading(false);
                return;
              }

              // Create new goal
              const goalId = crypto.randomUUID();
              const newGoal: any = {
                id: goalId,
                name: parsedGoalCommand.goalTitle,
                description: '',
                targetDate: parsedGoalCommand.targetDate || '',
                status: parsedGoalCommand.status || 'Planned',
                priority: 'Medium',
                order: (matchedProject.goals?.length || 0) + 1,
                tasks: []
              };

              await addGoal(null, matchedProject.id, newGoal);

              console.log(`✅ [${new Date().toLocaleTimeString()}] Goal created successfully:`, {
                goalId: newGoal.id,
                goalName: newGoal.name,
                projectId: matchedProject.id,
                projectName: matchedProject.name
              });

              const dateInfo = parsedGoalCommand.targetDate ? ` (due ${parsedGoalCommand.targetDate})` : '';
              setChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: `✅ Added goal **"${parsedGoalCommand.goalTitle}"** to project **${matchedProject.name}**${dateInfo}`,
                sender: 'ai' as const,
                timestamp: new Date()
              }]);

              // Proactive suggestions after goal creation
              const { profileSnapshot: profSnap } = usePersonasStore.getState();
              const suggestions = generateProactiveSuggestions('goal', 'created', {
                name: newGoal.name,
                goal: newGoal,
                project: matchedProject,
                focusAreas: profSnap?.focusAreas || []
              });

              if (suggestions.length > 0) {
                setChatMessages(prev => [...prev, {
                  id: (Date.now() + 2).toString(),
                  text: `**Next steps you might want:**\n${suggestions.map(s => `• ${s}`).join('\n')}`,
                  sender: 'ai' as const,
                  timestamp: new Date()
                }]);
              }

              setIsLoading(false);
              return;
            }

            if (parsedGoalCommand.action === 'update') {
              // Find existing goal by name
              const existingGoal = matchedProject.goals?.find((g: any) =>
                g.name.toLowerCase() === parsedGoalCommand!.goalTitle.toLowerCase() &&
                g.status !== 'deleted'
              );

              if (!existingGoal) {
                setChatMessages(prev => [...prev, {
                  id: (Date.now() + 1).toString(),
                  text: `❌ Goal **"${parsedGoalCommand.goalTitle}"** not found in project **${matchedProject.name}**`,
                  sender: 'ai' as const,
                  timestamp: new Date()
                }]);
                setIsLoading(false);
                return;
              }

              // Update existing goal
              const oldGoalStatus = existingGoal.status;
              const updates: any = {};
              if (parsedGoalCommand.status) updates.status = parsedGoalCommand.status;
              if (parsedGoalCommand.targetDate) updates.targetDate = parsedGoalCommand.targetDate;

              await updateGoal(null, existingGoal.id, updates);

              setChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: `✅ Updated goal **"${parsedGoalCommand.goalTitle}"** in project **${matchedProject.name}**`,
                sender: 'ai' as const,
                timestamp: new Date()
              }]);

              // Proactive suggestions after goal update
              const updatedGoal = { ...existingGoal, ...updates };
              const suggestions = generateProactiveSuggestions('goal', 'updated', {
                name: updatedGoal.name,
                goal: updatedGoal,
                oldStatus: oldGoalStatus,
                newStatus: updates.status
              });

              if (suggestions.length > 0) {
                setChatMessages(prev => [...prev, {
                  id: (Date.now() + 2).toString(),
                  text: `**Next steps you might want:**\n${suggestions.map(s => `• ${s}`).join('\n')}`,
                  sender: 'ai' as const,
                  timestamp: new Date()
                }]);
              }

              setIsLoading(false);
              return;
            }
          } catch (error) {
            const errorMessage = {
              id: (Date.now() + 1).toString(),
              text: `❌ Failed to ${parsedGoalCommand.action} goal: ${error instanceof Error ? error.message : 'Unknown error'}`,
              sender: 'ai' as const,
              timestamp: new Date()
            };
            setChatMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
            return;
          }
        }

        // Local command parsing - handle focus areas update commands
        // Enhanced regex to match multiple natural language patterns
        const focusAreasMatch =
          // Pattern 1: "change/update/set [my] focus areas to X, Y, Z"
          userMessageText.match(/(?:change|update|set)\s+(?:my\s+)?focus\s+areas?\s+(?:to|:)?\s+(.+?)$/i) ||
          // Pattern 2: "my focus [areas] should be X, Y, Z"
          userMessageText.match(/my\s+focus(?:\s+areas?)?\s+should\s+be\s+(.+?)$/i) ||
          // Pattern 3: "I want to focus on X, Y, Z" or "focus on X, Y, Z" (only if comma-separated list)
          userMessageText.match(/(?:I\s+(?:want|need)\s+to\s+)?focus\s+on\s+(.+,.+)$/i) ||
          // Pattern 4: Original pattern for backwards compatibility
          userMessageText.match(/^(update|set)\s+focus\s+areas?:?\s+(.+)$/i);

        if (focusAreasMatch) {
          // Pattern 4 has capture group 2, others have capture group 1
          const focusAreasText = (focusAreasMatch[2] || focusAreasMatch[1]).trim();
          const { profileSnapshot } = usePersonasStore.getState();

          if (profileSnapshot?.id) {
            // Parse comma-separated focus areas, trim, deduplicate
            const areas = focusAreasText
              .split(',')
              .map(a => a.trim())
              .filter(Boolean);
            const uniqueAreas = Array.from(new Set(areas));

            if (uniqueAreas.length === 0) {
              const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: `❌ Focus areas cannot be empty. Please provide at least one area.`,
                sender: 'ai' as const,
                timestamp: new Date()
              };
              setChatMessages(prev => [...prev, errorMessage]);
              setIsLoading(false);
              return;
            }

            try {
              await updateUserProfile(profileSnapshot.id, { focusAreas: uniqueAreas });
              const areaChips = uniqueAreas.map(a => `\`${a}\``).join(' ');
              const successMessage = {
                id: (Date.now() + 1).toString(),
                text: `✅ Focus areas updated to: ${areaChips}`,
                sender: 'ai' as const,
                timestamp: new Date()
              };
              setChatMessages(prev => [...prev, successMessage]);
              setIsLoading(false);
              return;
            } catch (error) {
              const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: `❌ Failed to update Focus areas: ${error instanceof Error ? error.message : 'Unknown error'}`,
                sender: 'ai' as const,
                timestamp: new Date()
              };
              setChatMessages(prev => [...prev, errorMessage]);
              setIsLoading(false);
              return;
            }
          }
        }

        // Local command parsing - handle task-to-goal linking commands
        const taskPatterns = [
          // add task '{name}' to goal '{goalName}' in {project}
          { regex: /(?:add|create)\s+(?:a\s+)?task\s+['"](.+?)['"]\s+to\s+goal\s+['"](.+?)['"]\s+in\s+(.+)$/i, action: 'create' as const, withGoal: true },
          // add task '{name}' to goal '{goalName}' (without project)
          { regex: /(?:add|create)\s+(?:a\s+)?task\s+['"](.+?)['"]\s+to\s+goal\s+['"](.+?)['"]$/i, action: 'create' as const, simpleGoal: true },
          // add task '{name}' with priority {priority} to goal '{goalName}'
          { regex: /(?:add|create)\s+(?:a\s+)?task\s+['"](.+?)['"]\s+(?:with\s+)?(?:priority\s+)?(\w+)\s+to\s+goal\s+['"](.+?)['"]$/i, action: 'create' as const, withPriority: true },
          // prioritize task '{name}' as {priority}
          { regex: /(?:prioritize|set\s+priority)\s+task\s+['"](.+?)['"]\s+(?:as|to)\s+(\w+)$/i, action: 'prioritize' as const },
        ];

        let parsedTaskCommand: {
          action: 'create' | 'prioritize';
          taskName: string;
          goalName?: string;
          projectName?: string;
          priority?: string;
        } | null = null;

        for (const pattern of taskPatterns) {
          const match = userMessageText.match(pattern.regex);
          if (match) {
            if (pattern.withGoal) {
              parsedTaskCommand = {
                action: 'create',
                taskName: match[1].trim(),
                goalName: match[2].trim(),
                projectName: match[3].trim(),
              };
            } else if (pattern.simpleGoal) {
              parsedTaskCommand = {
                action: 'create',
                taskName: match[1].trim(),
                goalName: match[2].trim(),
              };
            } else if (pattern.withPriority) {
              parsedTaskCommand = {
                action: 'create',
                taskName: match[1].trim(),
                priority: match[2].trim(),
                goalName: match[3].trim(),
              };
            } else if (pattern.action === 'prioritize') {
              parsedTaskCommand = {
                action: 'prioritize',
                taskName: match[1].trim(),
                priority: match[2].trim(),
              };
            }
            break;
          }
        }

        if (parsedTaskCommand) {
          console.log(`📝 [${new Date().toLocaleTimeString()}] Parsed task command:`, parsedTaskCommand);

          const { getProjects, getTasks, addTask, updateTask } = usePersonasStore.getState();
          const projects = getProjects();
          const allTasks = getTasks();

          try {
            if (parsedTaskCommand.action === 'create') {
              // Find goal by name (across all projects if project not specified)
              let targetGoal: any = null;
              let targetProject: any = null;

              if (parsedTaskCommand.projectName) {
                // Search within specific project
                const { project: matchedProject, error: projectError } = resolveProject(
                  parsedTaskCommand.projectName,
                  projects
                );

                if (projectError === 'not_found') {
                  setChatMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    text: `❌ Project **"${parsedTaskCommand.projectName}"** not found.`,
                    sender: 'ai' as const,
                    timestamp: new Date()
                  }]);
                  setIsLoading(false);
                  return;
                }

                targetProject = matchedProject;
                targetGoal = matchedProject.goals?.find((g: any) =>
                  g.name.toLowerCase() === parsedTaskCommand!.goalName!.toLowerCase() &&
                  g.status !== 'deleted'
                );
              } else {
                // Search across all projects
                for (const project of projects) {
                  const foundGoal = project.goals?.find((g: any) =>
                    g.name.toLowerCase() === parsedTaskCommand!.goalName!.toLowerCase() &&
                    g.status !== 'deleted'
                  );
                  if (foundGoal) {
                    targetGoal = foundGoal;
                    targetProject = project;
                    break;
                  }
                }
              }

              if (!targetGoal) {
                setChatMessages(prev => [...prev, {
                  id: (Date.now() + 1).toString(),
                  text: `❌ Goal **"${parsedTaskCommand.goalName}"** not found${parsedTaskCommand.projectName ? ` in project **${parsedTaskCommand.projectName}**` : ''}.`,
                  sender: 'ai' as const,
                  timestamp: new Date()
                }]);
                setIsLoading(false);
                return;
              }

              // Idempotent check: verify task doesn't exist in this goal
              const existingTask = targetGoal.tasks?.find((t: any) =>
                t.name.toLowerCase() === parsedTaskCommand!.taskName.toLowerCase() &&
                !t.completed &&
                !t.archived_at
              );

              if (existingTask) {
                setChatMessages(prev => [...prev, {
                  id: (Date.now() + 1).toString(),
                  text: `ℹ️ Task **"${parsedTaskCommand.taskName}"** already exists in goal **${targetGoal.name}**.`,
                  sender: 'ai' as const,
                  timestamp: new Date()
                }]);
                setIsLoading(false);
                return;
              }

              // Create new task
              const taskId = crypto.randomUUID();
              const newTask: any = {
                id: taskId,
                name: parsedTaskCommand.taskName,
                description: '',
                priority: parsedTaskCommand.priority ? normalizeStatus(parsedTaskCommand.priority) : 'Medium',
                completed: false,
                archived_at: null,
                order: (targetGoal.tasks?.length || 0) + 1,
              };

              await addTask(null, targetGoal.id, newTask);

              console.log(`✅ [${new Date().toLocaleTimeString()}] Task created:`, { taskId, taskName: newTask.name, goalId: targetGoal.id });

              setChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: `✅ Added task **"${parsedTaskCommand.taskName}"** to goal **${targetGoal.name}**${targetProject ? ` in **${targetProject.name}**` : ''}`,
                sender: 'ai' as const,
                timestamp: new Date()
              }]);

              // Proactive suggestions after task creation
              const { profileSnapshot: ps } = usePersonasStore.getState();
              const suggestions = generateProactiveSuggestions('task', 'created', {
                name: newTask.name,
                entity: newTask,
                goal: targetGoal,
                focusAreas: ps?.focusAreas || []
              });

              if (suggestions.length > 0) {
                setChatMessages(prev => [...prev, {
                  id: (Date.now() + 2).toString(),
                  text: `**Next steps you might want:**\n${suggestions.map(s => `• ${s}`).join('\n')}`,
                  sender: 'ai' as const,
                  timestamp: new Date()
                }]);
              }

              setIsLoading(false);
              return;
            }

            if (parsedTaskCommand.action === 'prioritize') {
              // Find task by name across all tasks
              const taskToPrioritize = allTasks.find((t: any) =>
                t.name.toLowerCase() === parsedTaskCommand!.taskName.toLowerCase() &&
                !t.completed &&
                !t.archived_at
              );

              if (!taskToPrioritize) {
                setChatMessages(prev => [...prev, {
                  id: (Date.now() + 1).toString(),
                  text: `❌ Task **"${parsedTaskCommand.taskName}"** not found.`,
                  sender: 'ai' as const,
                  timestamp: new Date()
                }]);
                setIsLoading(false);
                return;
              }

              const normalizedPriority = normalizeStatus(parsedTaskCommand.priority!);
              await updateTask(null, taskToPrioritize.id, { priority: normalizedPriority });

              setChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: `✅ Updated task **"${parsedTaskCommand.taskName}"** priority to **${parsedTaskCommand.priority}**`,
                sender: 'ai' as const,
                timestamp: new Date()
              }]);

              // Proactive suggestions after task prioritization
              const updatedTask = { ...taskToPrioritize, priority: normalizedPriority };
              const suggestions = generateProactiveSuggestions('task', 'updated', {
                name: updatedTask.name,
                entity: updatedTask
              });

              if (suggestions.length > 0) {
                setChatMessages(prev => [...prev, {
                  id: (Date.now() + 2).toString(),
                  text: `**Next steps you might want:**\n${suggestions.map(s => `• ${s}`).join('\n')}`,
                  sender: 'ai' as const,
                  timestamp: new Date()
                }]);
              }

              setIsLoading(false);
              return;
            }
          } catch (error) {
            const errorMessage = {
              id: (Date.now() + 1).toString(),
              text: `❌ Failed to ${parsedTaskCommand.action} task: ${error instanceof Error ? error.message : 'Unknown error'}`,
              sender: 'ai' as const,
              timestamp: new Date()
            };
            setChatMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
            return;
          }
        }

        // Local command parsing - handle milestone creation/update commands
        const milestonePatterns = [
          // add milestone '{name}' to {project} due {date}
          { regex: /(?:add|create)\s+(?:a\s+)?milestone\s+['"](.+?)['"]\s+to\s+(.+?)\s+(?:due|by)\s+(.+)$/i, action: 'create' as const },
          // add milestone '{name}' to {project} (no date)
          { regex: /(?:add|create)\s+(?:a\s+)?milestone\s+['"](.+?)['"]\s+to\s+(.+)$/i, action: 'create' as const, simple: true },
          // complete milestone '{name}' in {project}
          { regex: /(?:complete|finish)\s+milestone\s+['"](.+?)['"]\s+(?:in|for)\s+(.+)$/i, action: 'complete' as const },
        ];

        let parsedMilestoneCommand: {
          action: 'create' | 'complete';
          milestoneName: string;
          projectName: string;
          dueDate?: string;
        } | null = null;

        for (const pattern of milestonePatterns) {
          const match = userMessageText.match(pattern.regex);
          if (match) {
            if (pattern.simple) {
              parsedMilestoneCommand = {
                action: 'create',
                milestoneName: match[1].trim(),
                projectName: match[2].trim(),
              };
            } else if (pattern.action === 'complete') {
              parsedMilestoneCommand = {
                action: 'complete',
                milestoneName: match[1].trim(),
                projectName: match[2].trim(),
              };
            } else {
              // With due date
              parsedMilestoneCommand = {
                action: 'create',
                milestoneName: match[1].trim(),
                projectName: match[2].trim(),
                dueDate: normalizeDate(match[3].trim()),
              };
            }
            break;
          }
        }

        if (parsedMilestoneCommand) {
          console.log(`🎯 [${new Date().toLocaleTimeString()}] Parsed milestone command:`, parsedMilestoneCommand);

          const { getProjects, addMilestone, updateMilestone } = usePersonasStore.getState();
          const projects = getProjects();

          // Resolve project by name
          const { project: matchedProject, error: projectError } = resolveProject(
            parsedMilestoneCommand.projectName,
            projects
          );

          if (projectError === 'not_found') {
            setChatMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              text: `❌ Project **"${parsedMilestoneCommand.projectName}"** not found.`,
              sender: 'ai' as const,
              timestamp: new Date()
            }]);
            setIsLoading(false);
            return;
          }

          try {
            if (parsedMilestoneCommand.action === 'create') {
              // Idempotent check: verify milestone doesn't exist
              const existingMilestone = matchedProject.milestones?.find((m: any) =>
                m.name.toLowerCase() === parsedMilestoneCommand!.milestoneName.toLowerCase() &&
                m.status !== 'deleted'
              );

              if (existingMilestone) {
                setChatMessages(prev => [...prev, {
                  id: (Date.now() + 1).toString(),
                  text: `ℹ️ Milestone **"${parsedMilestoneCommand.milestoneName}"** already exists in **${matchedProject.name}**.`,
                  sender: 'ai' as const,
                  timestamp: new Date()
                }]);
                setIsLoading(false);
                return;
              }

              // Create new milestone
              const milestoneId = crypto.randomUUID();
              const newMilestone: any = {
                id: milestoneId,
                name: parsedMilestoneCommand.milestoneName,
                description: '',
                due_date: parsedMilestoneCommand.dueDate || null,
                status: 'Planned',
                order: (matchedProject.milestones?.length || 0) + 1,
              };

              await addMilestone(null, matchedProject.id, newMilestone);

              console.log(`✅ [${new Date().toLocaleTimeString()}] Milestone created:`, { milestoneId, milestoneName: newMilestone.name });

              const dateInfo = parsedMilestoneCommand.dueDate ? ` due ${parsedMilestoneCommand.dueDate}` : '';
              setChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: `✅ Added milestone **"${parsedMilestoneCommand.milestoneName}"** to **${matchedProject.name}**${dateInfo}`,
                sender: 'ai' as const,
                timestamp: new Date()
              }]);

              // Proactive suggestions after milestone creation
              const suggestions = generateProactiveSuggestions('milestone', 'created', {
                name: newMilestone.name,
                entity: newMilestone,
                project: matchedProject
              });

              if (suggestions.length > 0) {
                setChatMessages(prev => [...prev, {
                  id: (Date.now() + 2).toString(),
                  text: `**Next steps you might want:**\n${suggestions.map(s => `• ${s}`).join('\n')}`,
                  sender: 'ai' as const,
                  timestamp: new Date()
                }]);
              }

              setIsLoading(false);
              return;
            }

            if (parsedMilestoneCommand.action === 'complete') {
              // Find existing milestone
              const milestoneToComplete = matchedProject.milestones?.find((m: any) =>
                m.name.toLowerCase() === parsedMilestoneCommand!.milestoneName.toLowerCase() &&
                m.status !== 'deleted'
              );

              if (!milestoneToComplete) {
                setChatMessages(prev => [...prev, {
                  id: (Date.now() + 1).toString(),
                  text: `❌ Milestone **"${parsedMilestoneCommand.milestoneName}"** not found in **${matchedProject.name}**.`,
                  sender: 'ai' as const,
                  timestamp: new Date()
                }]);
                setIsLoading(false);
                return;
              }

              await updateMilestone(null, milestoneToComplete.id, { status: 'Completed' });

              setChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: `✅ Completed milestone **"${parsedMilestoneCommand.milestoneName}"** in **${matchedProject.name}**`,
                sender: 'ai' as const,
                timestamp: new Date()
              }]);

              // Proactive suggestions after milestone completion
              const suggestions = generateProactiveSuggestions('milestone', 'completed', {
                name: parsedMilestoneCommand.milestoneName,
                project: matchedProject
              });

              if (suggestions.length > 0) {
                setChatMessages(prev => [...prev, {
                  id: (Date.now() + 2).toString(),
                  text: `**Next steps you might want:**\n${suggestions.map(s => `• ${s}`).join('\n')}`,
                  sender: 'ai' as const,
                  timestamp: new Date()
                }]);
              }

              setIsLoading(false);
              return;
            }
          } catch (error) {
            const errorMessage = {
              id: (Date.now() + 1).toString(),
              text: `❌ Failed to ${parsedMilestoneCommand.action} milestone: ${error instanceof Error ? error.message : 'Unknown error'}`,
              sender: 'ai' as const,
              timestamp: new Date()
            };
            setChatMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
            return;
          }
        }

        // Call Claude AI via Supabase edge function
        console.log('🔵 [ChatOverlay] Reached Claude AI call section');
        console.log('🤖 Sending message to Claude...', { message: userMessageText.substring(0, 100) + '...' });

        let response;
        try {
          console.log('🔵 [ChatOverlay] Calling sendChatMessage...');
          response = await sendChatMessage(userMessageText);
          console.log('🔵 [ChatOverlay] sendChatMessage returned successfully');
          console.log('✅ Claude response received:', { 
            responseLength: response.response?.length || 0,
            entitiesCreated: response.entitiesCreated?.length || 0
          });
        } catch (chatError) {
          console.error('❌ Chat service error details:', chatError);
          
          // More specific error handling based on error type
          let specificErrorMessage = 'Sorry, I encountered an error. Please try again.';
          
          if (chatError instanceof Error) {
            const errorMsg = chatError.message.toLowerCase();
            
            if (errorMsg.includes('authentication') || errorMsg.includes('session') || errorMsg.includes('login')) {
              specificErrorMessage = '🔐 Your session has expired. Please refresh the page and sign in again.';
            } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
              specificErrorMessage = '🌐 Network connection issue. Please check your internet and try again.';
            } else if (errorMsg.includes('edge function') || errorMsg.includes('supabase')) {
              specificErrorMessage = '⚡ Chat service is temporarily unavailable. Please try again in a moment.';
            } else if (errorMsg.includes('claude') || errorMsg.includes('api')) {
              specificErrorMessage = '🤖 AI service is temporarily busy. Please try again in a few seconds.';
            } else {
              specificErrorMessage = `❌ Error: ${chatError.message}`;
            }
          }
          
          // Add error message to chat without crashing
          const errorMessage = {
            id: (Date.now() + 1).toString(),
            text: specificErrorMessage,
            sender: 'ai' as const,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, errorMessage]);
          setIsLoading(false);
          
          // Keep chat open so user can try again
          console.log('💬 Chat remains open for retry after error');
          return; // Exit early without crashing
        }

        // Build AI response text with created entities
        let responseText = response.response;
        const createdEntities = (response.entitiesCreated || []).filter(entity => entity.mode !== 'deleted');
        if (createdEntities.length > 0) {
          const createdList = createdEntities
            .map(e => `✓ ${e.type}: "${e.name}"`)
            .join('\n');
          responseText = `${response.response}\n\n**Created:**\n${createdList}`;
        }

        // Add milestone creation feedback
        if (response.milestonesCreated) {
          const count = response.milestoneCount || 1;
          responseText += `\n\n🎯 **${count} Milestone${count > 1 ? 's' : ''} Created!** Added to your project in Priority Stream panel.`;
        } else if (response.milestoneError) {
          responseText += `\n\n❌ **Milestone Error:** ${response.milestoneError}`;
        }

        // Add priority stream creation feedback
        if (response.priorityStreamCreated) {
          const count = response.priorityStreamCount || 1;
          responseText += `\n\n🎯 **${count} Priority Stream${count > 1 ? 's' : ''} Created!** Check your Priority Stream panel to see the new stream${count > 1 ? 's' : ''}.`;
        } else if (response.priorityStreamError) {
          responseText += `\n\n❌ **Priority Stream Error:** ${response.priorityStreamError}`;
        }

        // Add AI response
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: 'ai' as const,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);

        // CRITICAL: If a document was generated, refresh the ATMO Outputs card
        if (response.documentGenerated) {
          console.log('📄 Document generated! Refreshing ATMO Outputs card...');
          window.dispatchEvent(new Event('atmo:outputs:refresh'));
        }

        // CRITICAL: If a priority stream was created, refresh the Priority Stream panel
        if (response.priorityStreamCreated) {
          console.log('🎯 Priority stream created! Refreshing Priority Stream panel...');
          window.dispatchEvent(new Event('atmo:priority-stream:refresh'));
        }

        // CRITICAL FIX: Wait for entity creation and synchronize properly
        if (createdEntities.length > 0) {
          console.log(`⏳ [${new Date().toLocaleTimeString()}] Waiting for entity creation to complete...`);
          await new Promise(resolve => setTimeout(resolve, 3000)); // Increased to 3 seconds
          
          // Force workspace synchronization with validation
          const { fetchPersonaByIam, profileSnapshot, getProjects } = usePersonasStore.getState();
          if (profileSnapshot?.id) {
            console.log(`🔄 [${new Date().toLocaleTimeString()}] Force refreshing workspace after entity creation...`);
            await fetchPersonaByIam(null, profileSnapshot.id, true);
            
            // VALIDATION: Check if created entities are actually visible and detect state changes
            const refreshedProjects = getProjects();
            const createdTasks = createdEntities.filter(e => e.type === 'task');
            
            for (const taskEntity of createdTasks) {
              // Check if task exists (including completed/archived ones to detect state changes)
              let taskFound = null;
              let taskState = null;
              
              for (const p of refreshedProjects) {
                for (const g of (p.goals ?? [])) {
                  const task = (g.tasks ?? []).find(t => 
                    t.name.toLowerCase() === taskEntity.name.toLowerCase()
                  );
                  if (task) {
                    taskFound = task;
                    if (task.completed) {
                      taskState = 'completed';
                    } else if (task.archived_at) {
                      taskState = 'archived';
                    } else {
                      taskState = 'active';
                    }
                    break;
                  }
                }
                if (taskFound) break;
              }
              
              if (!taskFound) {
                console.warn(`❌ Task "${taskEntity.name}" was reported as created but is not found in workspace`);
                setChatMessages(prev => [...prev, {
                  id: (Date.now() + 100).toString(),
                  text: `⚠️ Task "${taskEntity.name}" was created but is not visible. This might be due to a project assignment issue or sync delay. Please try recreating it with explicit project name.`,
                  sender: 'ai' as const,
                  timestamp: new Date()
                }]);
              } else if (taskState === 'completed') {
                console.log(`ℹ️ Task "${taskEntity.name}" was previously completed - not visible in Priority Stream`);
              } else if (taskState === 'archived') {
                console.log(`ℹ️ Task "${taskEntity.name}" was previously archived - not visible in Priority Stream`);
              } else {
                console.log(`✅ Task "${taskEntity.name}" confirmed visible in Priority Stream`);
              }
            }
            
            console.log(`✅ [${new Date().toLocaleTimeString()}] Workspace synchronized and validated`);
          }
        }
      } catch (error) {
        console.error('❌ Unexpected error in chat handler:', error);

        // This catch block handles other unexpected errors (not chat service errors)
        let errorText = '🔥 An unexpected error occurred. Please refresh the page and try again.';
        if (error instanceof Error) {
          console.error('Error details:', error.stack);
          errorText = `🔥 Unexpected error: ${error.message}`;
        }

        const errorMessage = {
          id: (Date.now() + 1).toString(),
          text: errorText,
          sender: 'ai' as const,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      } finally {
        // CRITICAL: First set loading to false so the message sync can happen
        setIsLoading(false);

        // Then refresh the session to get persisted messages from database
        // This must happen AFTER setIsLoading(false) to avoid race condition
        try {
          console.log('[ChatOverlay] Refreshing session after message sent');
          await refreshActiveSession({ force: true });
        } catch (err) {
          console.error('ChatOverlay: Failed to sync active session after sending message', err);
        }
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Semi-transparent backdrop - allows seeing background */}
      <div 
        className={`absolute inset-0 transition-all duration-300 ${
          isBlurred ? 'bg-black/20 backdrop-blur-sm' : 'bg-black/10'
        }`}
        onClick={onClose}
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Draggable Modal - ULTRA SMOOTH & FREE MOVEMENT */}
      <div
        ref={modalRef}
        className={`w-[600px] h-[700px] bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90 rounded-2xl border border-white/20 shadow-2xl flex flex-col overflow-hidden ${
          isDragging ? 'transition-none select-none' : 'transition-all duration-300 ease-out'
        }`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          pointerEvents: 'auto',
          backdropFilter: isBlurred ? 'blur(20px)' : 'blur(5px)',
          boxShadow: isDragging 
            ? '0 30px 60px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.15)' 
            : '0 20px 40px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          willChange: isDragging ? 'transform' : 'auto',
          zIndex: isDragging ? 9999 : 'auto',
          // Enhanced GPU acceleration for ultra-smooth movement
          contain: 'layout style paint',
          isolation: 'isolate',
          backfaceVisibility: 'hidden',
          perspective: '1000px',
          transformStyle: 'preserve-3d',
          // Ensure smooth rendering during movement
          imageRendering: 'auto',
          textRendering: 'optimizeSpeed'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Draggable Header */}
        <div 
          ref={headerRef}
          className={`flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0 transition-all duration-200 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onClick={handleHeaderDoubleClick}
          style={{ userSelect: 'none' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {/* macOS-style window controls */}
              <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors"></div>
            </div>
            <h3 className="text-white font-semibold">Chat with ATMO</h3>
            {!isBlurred && (
              <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded-full">
                Transparent Mode
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-xs text-white/40 hidden sm:block">
              Double-click to toggle blur
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-white/70" />
            </button>
          </div>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center py-6 flex-shrink-0">
          <div
            className="relative"
            style={{
              filter: 'drop-shadow(0 0 15px rgba(204, 85, 0, 0.15))',
            }}
          >
            <SphereChat
              size={90}
              isActive={isCapturing}
              isListening={isCapturing}
              onClick={handleQuickCapture}
              voiceSupported={true}
            />

            {/* Subtle glow effects */}
            <div className={`absolute inset-0 -z-10 bg-[#CC5500]/10 rounded-full blur-xl transition-all duration-300 ${
              isCapturing ? 'animate-pulse scale-110' : 'animate-pulse-soft'
            }`}></div>
            <div className={`absolute inset-0 -z-20 bg-[#CC5500]/5 rounded-full blur-2xl scale-150 transition-all duration-300 ${
              isCapturing ? 'animate-pulse scale-125' : 'animate-pulse-soft'
            }`}></div>
          </div>

          {/* Voice Control X Button */}
          {isCapturing && (
            <div className="mt-4">
              <button
                onClick={() => setIsCapturing(false)}
                className="w-9 h-9 rounded-full bg-slate-800/60 hover:bg-slate-700/80 border border-slate-600/40 text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm shadow-lg flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Chat Messages Container - Scrollable */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent min-h-0"
          style={{
            scrollBehavior: 'smooth',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 100%)'
          }}
        >
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-[slideIn_0.3s_ease-out]`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-br from-[#CC5500]/80 to-[#CC5500]/60 text-white rounded-[18px] rounded-br-[6px]'
                    : 'bg-white/10 text-white/90 rounded-[18px] rounded-bl-[6px] backdrop-blur-sm border border-white/10'
                } shadow-lg`}
              >
                <p className="text-xs leading-normal">{message.text}</p>
                <span className="text-[10px] opacity-60 mt-1 block">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-[slideIn_0.3s_ease-out]">
              <div className="max-w-[85%] px-3 py-2 bg-white/10 text-white/90 rounded-[18px] rounded-bl-[6px] backdrop-blur-sm border border-white/10 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-white/60">ATMO is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input Box - fixed at bottom */}
        <div className="flex-shrink-0 p-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[20px] p-3 shadow-xl">
            <div className="flex items-end gap-2">
              <textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 bg-transparent text-white text-xs placeholder:text-white/40 outline-none resize-none min-h-[28px] max-h-[100px] py-1 px-2 rounded-xl"
                rows={1}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255,255,255,0.1) transparent'
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isLoading}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[#CC5500] to-[#CC5500]/80 hover:from-[#CC5500]/90 hover:to-[#CC5500]/70 disabled:from-white/10 disabled:to-white/5 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200 shadow-lg"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
