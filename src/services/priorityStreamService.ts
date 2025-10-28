import { supabase } from '@/lib/supabase';
import { usePersonasStore } from '@/stores/usePersonasStore';

export interface PriorityStreamRequest {
  name: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
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
      .eq('persona_id', user.id)
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
      .eq('persona_id', user.id)
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
    'add milestone', 'create milestone', 'new milestone', 'milestone for',
    'add 2 milestone', 'create 2 milestone', 'new 2 milestone',
    'add milestone on', 'create milestone on', 'milestone on'
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
    'priority stream', 'create priority', 'add priority', 'new priority',
    'priority for', 'priority about', 'priority on', 'priority with',
    'high priority', 'medium priority', 'low priority',
    'urgent priority', 'important priority', 'critical priority'
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

      // Extract stream name - look for text after "priority" keywords
      const priorityIndex = lowerMessage.indexOf(keyword);
      const afterPriority = message.substring(priorityIndex + keyword.length).trim();
      
      // Clean up the stream name
      let streamName = afterPriority
        .replace(/^(for|about|on|with|stream|:)/i, '')
        .replace(/[^\w\s]/g, '')
        .trim()
        .split(' ')[0]; // Take first word as stream name

      if (!streamName || streamName.length < 2) {
        // Fallback: extract from context
        const words = message.split(' ').filter(word => 
          word.length > 2 && 
          !['priority', 'stream', 'create', 'add', 'new', 'for', 'about', 'on', 'with'].includes(word.toLowerCase())
        );
        streamName = words[0] || 'New Priority';
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
      .eq('persona_id', user.id)
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
