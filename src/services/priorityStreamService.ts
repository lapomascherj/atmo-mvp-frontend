import { supabase } from '@/lib/supabase';
import { usePersonasStore } from '@/stores/usePersonasStore';
import { Priority } from '@/models/Priority';

export interface PriorityStreamRequest {
  name: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  context?: string;
}

export interface PriorityTaskRequest {
  name: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  projectName?: string;
  context?: string;
}

export interface PriorityStream {
  id: string;
  name: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a priority task that appears in the Priority Stream
 * This creates a task under a default "Priorities" goal or creates the goal if it doesn't exist
 */
export const createPriorityTask = async (request: PriorityTaskRequest): Promise<{ success: boolean; taskId?: string; error?: string }> => {
  try {
    console.log('🎯 Creating priority task:', request);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Find or create the target project
    let projectId: string;
    if (request.projectName) {
      // Try to find existing project
      const { data: existingProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_id', user.id)
        .ilike('name', `%${request.projectName}%`)
        .eq('active', true)
        .limit(1);

      if (existingProjects && existingProjects.length > 0) {
        projectId = existingProjects[0].id;
      } else {
        // Create new project
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            owner_id: user.id,
            name: request.projectName,
            description: `Project for ${request.projectName}`,
            priority: request.priority || 'high',
            status: 'active',
            active: true,
            color: getPriorityColor(request.priority || 'high')
          })
          .select('id')
          .single();

        if (projectError || !newProject) {
          throw new Error('Failed to create project');
        }
        projectId = newProject.id;
      }
    } else {
      // Use default "Quick Tasks" project or create it
      const { data: defaultProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_id', user.id)
        .eq('name', 'Quick Tasks')
        .eq('active', true)
        .limit(1);

      if (defaultProjects && defaultProjects.length > 0) {
        projectId = defaultProjects[0].id;
      } else {
        // Create default project
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            owner_id: user.id,
            name: 'Quick Tasks',
            description: 'Quick priority tasks',
            priority: 'high',
            status: 'active',
            active: true,
            color: '#f59e0b'
          })
          .select('id')
          .single();

        if (projectError || !newProject) {
          throw new Error('Failed to create default project');
        }
        projectId = newProject.id;
      }
    }

    // Find or create "Priority Tasks" goal in the project
    const { data: existingGoals } = await supabase
      .from('project_goals')
      .select('id')
      .eq('owner_id', user.id)
      .eq('project_id', projectId)
      .eq('name', 'Priority Tasks')
      .limit(1);

    let goalId: string;
    if (existingGoals && existingGoals.length > 0) {
      goalId = existingGoals[0].id;
    } else {
      // Create "Priority Tasks" goal
      const { data: newGoal, error: goalError } = await supabase
        .from('project_goals')
        .insert({
          owner_id: user.id,
          project_id: projectId,
          name: 'Priority Tasks',
          description: 'High-priority tasks',
          status: 'InProgress',
          priority: Priority.High
        })
        .select('id')
        .single();

      if (goalError || !newGoal) {
        throw new Error('Failed to create goal');
      }
      goalId = newGoal.id;
    }

    // Create the task
    const { data: task, error: taskError } = await supabase
      .from('project_tasks')
      .insert({
        owner_id: user.id,
        project_id: projectId,
        goal_id: goalId,
        name: request.name,
        description: request.description || '',
        priority: request.priority || 'high',
        completed: false
      })
      .select('id')
      .single();

    if (taskError || !task) {
      console.error('Failed to create task:', taskError);
      throw new Error('Failed to create task');
    }

    console.log('✅ Priority task created successfully:', task.id);
    return { success: true, taskId: task.id };

  } catch (error) {
    console.error('❌ Failed to create priority task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Create milestones for an existing project
 */
export const createMilestonesForProject = async (projectName: string, milestoneNames: string[]): Promise<{ success: boolean; milestoneIds?: string[]; error?: string }> => {
  try {
    console.log('🎯 Creating milestones for project:', projectName, milestoneNames);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Find the project by name
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('owner_id', user.id)
      .ilike('name', `%${projectName}%`)
      .eq('active', true)
      .limit(1);

    if (!projects || projects.length === 0) {
      throw new Error(`Project "${projectName}" not found`);
    }

    const project = projects[0];
    const milestoneIds: string[] = [];

    // Create each milestone
    for (const milestoneName of milestoneNames) {
      const { data: milestone, error } = await supabase
        .from('project_milestones')
        .insert({
          owner_id: user.id,
          project_id: project.id,
          name: milestoneName,
          description: `Milestone: ${milestoneName}`,
          status: 'active'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create milestone:', milestoneName, error);
        throw new Error(`Failed to create milestone: ${milestoneName}`);
      }

      milestoneIds.push(milestone.id);
    }

    console.log('✅ Milestones created successfully:', milestoneIds);
    return { success: true, milestoneIds };

  } catch (error) {
    console.error('❌ Failed to create milestones:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Create a priority stream (project) directly from chat/voice input
 */
export const createPriorityStream = async (request: PriorityStreamRequest): Promise<{ success: boolean; streamId?: string; error?: string }> => {
  try {
    console.log('🎯 Creating priority stream:', request);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Check if similar priority stream already exists
    const { data: existingStreams } = await supabase
      .from('projects')
      .select('id, name')
      .eq('owner_id', user.id)
      .ilike('name', `%${request.name}%`)
      .eq('active', true)
      .neq('status', 'deleted');

    if (existingStreams && existingStreams.length > 0) {
      const existing = existingStreams[0];
      console.log('⚠️ Similar priority stream already exists:', existing.name);
      return {
        success: false,
        error: `Priority stream "${existing.name}" already exists. Would you like to update it instead?`
      };
    }

    // Create the priority stream using PersonasStore
    const personasStore = usePersonasStore.getState();
    const success = await personasStore.addProject(null, {
      name: request.name,
      description: request.description || `Priority stream for ${request.name}`,
      priority: request.priority || 'high',
      status: 'active',
      active: true,
      color: getPriorityColor(request.priority || 'high')
    });

    if (success) {
      console.log('✅ Priority stream created successfully');
      
      // Get the created project ID
      const projects = personasStore.getProjects();
      const createdProject = projects.find(p => p.name === request.name);
      
      return { 
        success: true, 
        streamId: createdProject?.id 
      };
    } else {
      throw new Error('Failed to create priority stream');
    }

  } catch (error) {
    console.error('❌ Failed to create priority stream:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Detect if a message is requesting milestone creation for existing projects
 */
export const detectMilestoneRequest = (message: string): { isRequest: boolean; projectName?: string; milestoneNames?: string[]; priority?: string } => {
  const milestoneKeywords = [
    // Explicit milestone keywords
    'add milestone', 'create milestone', 'new milestone', 'milestone for',
    'add 2 milestone', 'create 2 milestone', 'new 2 milestone',
    'add milestone on', 'create milestone on', 'milestone on',
    // Natural milestone keywords
    'add goal', 'create goal', 'new goal', 'goal for',
    'add objective', 'create objective', 'new objective',
    'add target', 'create target', 'new target'
  ];

  const lowerMessage = message.toLowerCase();

  for (const keyword of milestoneKeywords) {
    if (lowerMessage.includes(keyword)) {
      // Extract priority level
      let priority = 'high';
      if (lowerMessage.includes('urgent') || lowerMessage.includes('critical')) {
        priority = 'high';
      } else if (lowerMessage.includes('medium')) {
        priority = 'medium';
      } else if (lowerMessage.includes('low')) {
        priority = 'low';
      }

      // Extract project name - look for "on [project]" pattern
      const projectMatch = message.match(/on\s+(\w+)/i);
      const projectName = projectMatch ? projectMatch[1] : 'ATMO';

      // Extract milestone names - look for "first one is X, second one is Y" pattern
      const firstMatch = message.match(/first\s+one\s+is\s+([^,]+)/i);
      const secondMatch = message.match(/second\s+one\s+is\s+([^,]+)/i);
      
      let milestoneNames: string[] = [];
      if (firstMatch && secondMatch) {
        milestoneNames = [
          firstMatch[1].trim(),
          secondMatch[1].trim()
        ];
      } else {
        // Fallback: extract from context
        const words = message.split(' ').filter(word => 
          word.length > 2 && 
          !['milestone', 'add', 'create', 'new', 'for', 'on', 'first', 'one', 'is', 'second'].includes(word.toLowerCase())
        );
        milestoneNames = words.slice(0, 2);
      }

      return { 
        isRequest: true, 
        projectName: projectName.charAt(0).toUpperCase() + projectName.slice(1),
        milestoneNames,
        priority: priority as 'high' | 'medium' | 'low'
      };
    }
  }
  
  return { isRequest: false };
};

/**
 * Detect if a message is requesting priority stream creation (legacy - for new projects)
 */
export const detectPriorityStreamRequest = (message: string): { isRequest: boolean; streamName?: string; priority?: string } => {
  const priorityKeywords = [
    // Explicit priority stream keywords
    'priority stream', 'create priority', 'add priority', 'new priority',
    'priority for', 'priority about', 'priority on', 'priority with',
    'high priority', 'medium priority', 'low priority',
    'urgent priority', 'important priority', 'critical priority',
    // Natural task creation keywords
    'add this to my priorities', 'add to priorities', 'add to priority',
    'create a task', 'create task', 'add task', 'new task',
    'add this task', 'create this task',
    'i need to', 'need to work on', 'work on this',
    'add to stream', 'add to my stream',
    'make this a priority', 'prioritize this',
    'track this', 'add this to track'
  ];

  const lowerMessage = message.toLowerCase();

  for (const keyword of priorityKeywords) {
    if (lowerMessage.includes(keyword)) {
      // Extract priority level
      let priority = 'high';
      if (lowerMessage.includes('urgent') || lowerMessage.includes('critical')) {
        priority = 'high';
      } else if (lowerMessage.includes('medium')) {
        priority = 'medium';
      } else if (lowerMessage.includes('low')) {
        priority = 'low';
      }

      // Extract task/stream name - look for text after keywords
      const priorityIndex = lowerMessage.indexOf(keyword);
      const afterKeyword = message.substring(priorityIndex + keyword.length).trim();

      // For natural language, try to extract the full task description
      let streamName = afterKeyword
        .replace(/^(for|about|on|with|stream|:|to)\s*/i, '')
        .trim();

      // If we got a full sentence, take up to first punctuation or "for project"
      const sentenceEnd = streamName.search(/[.!?]|for project|on project/i);
      if (sentenceEnd > 0) {
        streamName = streamName.substring(0, sentenceEnd).trim();
      }

      // Limit to reasonable task name length (take first 50 chars)
      if (streamName.length > 50) {
        streamName = streamName.substring(0, 50).trim();
      }

      if (!streamName || streamName.length < 3) {
        // Fallback: extract meaningful words from the entire message
        const words = message.split(' ').filter(word =>
          word.length > 2 &&
          !['priority', 'stream', 'create', 'add', 'new', 'for', 'about', 'on', 'with', 'this', 'task', 'the', 'my', 'to'].includes(word.toLowerCase())
        );
        streamName = words.slice(0, 5).join(' ') || 'New Task';
      }

      return { 
        isRequest: true, 
        streamName: streamName.charAt(0).toUpperCase() + streamName.slice(1),
        priority: priority as 'high' | 'medium' | 'low'
      };
    }
  }
  
  return { isRequest: false };
};

/**
 * Get priority streams (active projects with high/medium priority)
 */
export const getPriorityStreams = async (): Promise<PriorityStream[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, priority, status, created_at, updated_at')
      .eq('owner_id', user.id)
      .eq('active', true)
      .in('priority', ['high', 'medium'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch priority streams:', error);
      throw error;
    }

    return (data || []).map(stream => ({
      id: stream.id,
      name: stream.name,
      description: stream.description,
      priority: stream.priority as 'high' | 'medium' | 'low',
      status: stream.status as 'active' | 'completed' | 'paused',
      createdAt: stream.created_at,
      updatedAt: stream.updated_at
    }));

  } catch (error) {
    console.error('Failed to get priority streams:', error);
    return [];
  }
};

/**
 * Get color for priority level
 */
const getPriorityColor = (priority: 'high' | 'medium' | 'low'): string => {
  const colors = {
    high: '#ef4444',    // red-500
    medium: '#f59e0b',  // amber-500
    low: '#10b981'      // emerald-500
  };
  return colors[priority];
};

/**
 * Update priority stream
 */
export const updatePriorityStream = async (streamId: string, updates: Partial<PriorityStreamRequest>): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const personasStore = usePersonasStore.getState();
    const success = await personasStore.updateProject(null, streamId, {
      name: updates.name,
      description: updates.description,
      priority: updates.priority
    });

    if (success) {
      return { success: true };
    } else {
      throw new Error('Failed to update priority stream');
    }

  } catch (error) {
    console.error('❌ Failed to update priority stream:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Delete priority stream
 */
export const deletePriorityStream = async (streamId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const personasStore = usePersonasStore.getState();
    const success = await personasStore.removeProject(null, streamId);

    if (success) {
      return { success: true };
    } else {
      throw new Error('Failed to delete priority stream');
    }

  } catch (error) {
    console.error('❌ Failed to delete priority stream:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
