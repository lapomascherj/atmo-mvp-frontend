import { supabase } from '@/lib/supabase';
import { createOutput, type CreateOutputData } from './atmoOutputsService';
import { generateMorningAnalysis as generateMockAnalysis } from '@/api/mockDocumentApi';

export interface PriorityProject {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
  }>;
  goals?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}

export interface MorningAnalysisDocument {
  projectId: string;
  projectName: string;
  analysisDate: string;
  dailyStrategy: string;
  taskPriorities: Array<{
    taskId: string;
    title: string;
    priority: string;
    reasoning: string;
    estimatedTime: string;
  }>;
  recommendations: Array<{
    category: string;
    action: string;
    impact: string;
    timeline: string;
  }>;
  successMetrics: Array<{
    metric: string;
    target: string;
    current: string;
  }>;
  context: {
    projectStatus: string;
    upcomingDeadlines: string[];
    blockers: string[];
    opportunities: string[];
  };
}

/**
 * Generate morning analysis documents for all Priority Stream projects
 */
export const generateMorningAnalysis = async (): Promise<{ success: boolean; documentsCreated: number; error?: string }> => {
  try {
    console.log('🌅 Starting morning analysis for Priority Stream projects...');

    // Check daily limits first
    const { canCreateDocument } = await import('./dailyLimitsService');
    const limitCheck = await canCreateDocument();
    if (!limitCheck.canCreate) {
      console.warn('❌ Morning analysis blocked by daily limits:', limitCheck.reason);
      return { 
        success: false, 
        documentsCreated: 0,
        error: limitCheck.reason || 'Daily document limit reached'
      };
    }

    // Get user's active projects
    const projects = await getPriorityProjects();
    
    if (projects.length === 0) {
      console.log('ℹ️ No active projects found for morning analysis');
      return { success: true, documentsCreated: 0 };
    }

    let documentsCreated = 0;
    const errors: string[] = [];

    // Generate analysis document for each project (limit to 1 per day to respect limits)
    const projectToAnalyze = projects[0]; // Take the first/highest priority project
    
    try {
      console.log(`📊 Analyzing project: ${projectToAnalyze.name}`);
      
      const analysisDoc = await generateProjectAnalysis(projectToAnalyze);
      const success = await saveAnalysisDocument(projectToAnalyze, analysisDoc);
      
      if (success) {
        documentsCreated++;
        console.log(`✅ Analysis document created for: ${projectToAnalyze.name}`);
      } else {
        errors.push(`Failed to create analysis for: ${projectToAnalyze.name}`);
      }
    } catch (error) {
      console.error(`❌ Error analyzing project ${projectToAnalyze.name}:`, error);
      errors.push(`Error analyzing ${projectToAnalyze.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (errors.length > 0) {
      console.warn('⚠️ Some analysis documents failed:', errors);
    }

    console.log(`🎉 Morning analysis complete: ${documentsCreated} documents created`);
    return { 
      success: true, 
      documentsCreated,
      error: errors.length > 0 ? errors.join('; ') : undefined
    };

  } catch (error) {
    console.error('❌ Morning analysis failed:', error);
    return { 
      success: false, 
      documentsCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Get user's Priority Stream projects (active projects with high/medium priority)
 */
const getPriorityProjects = async (): Promise<PriorityProject[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get active projects with their tasks and goals
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        status,
        priority,
        due_date,
        tasks:project_tasks!inner(
          id,
          title,
          status,
          priority
        ),
        goals:project_goals!inner(
          id,
          title,
          status
        )
      `)
      .eq('persona_id', user.id)
      .in('status', ['active', 'in_progress'])
      .in('priority', ['high', 'medium'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Failed to fetch projects:', projectsError);
      return [];
    }

    return (projects || []).map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority as 'high' | 'medium' | 'low',
      dueDate: project.due_date,
      tasks: project.tasks || [],
      goals: project.goals || []
    }));

  } catch (error) {
    console.error('Failed to get priority projects:', error);
    return [];
  }
};

/**
 * Generate analysis document for a specific project
 */
const generateProjectAnalysis = async (project: PriorityProject): Promise<MorningAnalysisDocument> => {
  const analysisDate = new Date().toISOString().split('T')[0];
  
  // Get project context and recent activity
  const context = await getProjectContext(project.id);
  
  // Generate AI-powered analysis
  const analysis = await generateAIAnalysis(project, context);
  
  return {
    projectId: project.id,
    projectName: project.name,
    analysisDate,
    dailyStrategy: analysis.dailyStrategy,
    taskPriorities: analysis.taskPriorities,
    recommendations: analysis.recommendations,
    successMetrics: analysis.successMetrics,
    context: {
      projectStatus: project.status,
      upcomingDeadlines: context.deadlines,
      blockers: context.blockers,
      opportunities: context.opportunities
    }
  };
};

/**
 * Get project context and recent activity
 */
const getProjectContext = async (projectId: string) => {
  try {
    // Get recent tasks and their status
    const { data: recentTasks } = await supabase
      .from('project_tasks')
      .select('title, status, priority, due_date')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent goals
    const { data: recentGoals } = await supabase
      .from('project_goals')
      .select('title, status, target_date')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get recent chat messages related to this project
    const { data: recentMessages } = await supabase
      .from('chat_messages')
      .select('content, role, created_at')
      .ilike('content', `%${projectId}%`)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      recentTasks: recentTasks || [],
      recentGoals: recentGoals || [],
      recentMessages: recentMessages || [],
      deadlines: extractDeadlines(recentTasks || []),
      blockers: extractBlockers(recentMessages || []),
      opportunities: extractOpportunities(recentMessages || [])
    };
  } catch (error) {
    console.error('Failed to get project context:', error);
    return {
      recentTasks: [],
      recentGoals: [],
      recentMessages: [],
      deadlines: [],
      blockers: [],
      opportunities: []
    };
  }
};

/**
 * Generate AI analysis for the project
 */
const generateAIAnalysis = async (project: PriorityProject, context: any) => {
  try {
    // Build analysis prompt
    const prompt = buildAnalysisPrompt(project, context);
    
    // Use mock API for analysis generation
    const result = await generateMockAnalysis({ prompt, projectId: project.id });
    return result.analysis;
    
  } catch (error) {
    console.error('AI analysis failed, using fallback:', error);
    return generateFallbackAnalysis(project, context);
  }
};

/**
 * Build analysis prompt for AI
 */
const buildAnalysisPrompt = (project: PriorityProject, context: any): string => {
  return `You are an elite strategic advisor analyzing a project for daily optimization. 

PROJECT: ${project.name}
DESCRIPTION: ${project.description || 'No description'}
STATUS: ${project.status}
PRIORITY: ${project.priority}
DUE DATE: ${project.dueDate || 'No due date'}

CURRENT TASKS:
${project.tasks?.map(task => `- ${task.title} (${task.status}, ${task.priority})`).join('\n') || 'No tasks'}

CURRENT GOALS:
${project.goals?.map(goal => `- ${goal.title} (${goal.status})`).join('\n') || 'No goals'}

RECENT ACTIVITY:
${context.recentMessages?.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') || 'No recent activity'}

UPCOMING DEADLINES:
${context.deadlines.join('\n') || 'None'}

BLOCKERS:
${context.blockers.join('\n') || 'None'}

OPPORTUNITIES:
${context.opportunities.join('\n') || 'None'}

Generate a comprehensive daily strategy analysis with:
1. Daily strategy (2-3 paragraphs)
2. Task priorities with reasoning and time estimates
3. Specific recommendations for today
4. Success metrics to track
5. Context analysis

Format as JSON with the structure defined in MorningAnalysisDocument interface.`;
};

/**
 * Generate fallback analysis when AI fails
 */
const generateFallbackAnalysis = (project: PriorityProject, context: any) => {
  const highPriorityTasks = project.tasks?.filter(task => task.priority === 'high') || [];
  const mediumPriorityTasks = project.tasks?.filter(task => task.priority === 'medium') || [];
  
  return {
    dailyStrategy: `Focus on advancing ${project.name} today. Prioritize high-impact tasks and address any blockers. The project is currently ${project.status} with ${project.tasks?.length || 0} active tasks.`,
    taskPriorities: [
      ...highPriorityTasks.map(task => ({
        taskId: task.id,
        title: task.title,
        priority: 'high',
        reasoning: 'High priority task requiring immediate attention',
        estimatedTime: '2-4 hours'
      })),
      ...mediumPriorityTasks.map(task => ({
        taskId: task.id,
        title: task.title,
        priority: 'medium',
        reasoning: 'Medium priority task for steady progress',
        estimatedTime: '1-2 hours'
      }))
    ],
    recommendations: [
      {
        category: 'Focus',
        action: 'Complete high-priority tasks first',
        impact: 'High',
        timeline: 'Today'
      },
      {
        category: 'Progress',
        action: 'Review and update project status',
        impact: 'Medium',
        timeline: 'This week'
      }
    ],
    successMetrics: [
      {
        metric: 'Tasks Completed',
        target: '3-5 tasks',
        current: '0 tasks'
      },
      {
        metric: 'Project Progress',
        target: '25% advancement',
        current: 'Unknown'
      }
    ]
  };
};

/**
 * Save analysis document to ATMO Outputs
 */
const saveAnalysisDocument = async (project: PriorityProject, analysis: MorningAnalysisDocument): Promise<boolean> => {
  try {
    // Create a 2-word title from project name
    const projectWords = project.name.split(' ').filter(word => word.length > 2);
    const title = projectWords.length >= 2 
      ? `${projectWords[0]} ${projectWords[1]}` 
      : `${project.name} Strategy`;
    
    const filename = `${title} - ${analysis.analysisDate}.md`;
    
    const documentContent = formatAnalysisAsMarkdown(analysis);
    
    const outputData: CreateOutputData = {
      filename,
      fileType: 'markdown',
      contentData: {
        documentContent,
        analysis,
        source: {
          type: 'morning_analysis',
          projectId: project.id,
          projectName: project.name,
          generatedAt: new Date().toISOString()
        }
      },
      fileSize: JSON.stringify(analysis).length
    };

    await createOutput(outputData);
    return true;
    
  } catch (error) {
    console.error('Failed to save analysis document:', error);
    return false;
  }
};

/**
 * Format analysis as markdown document
 */
const formatAnalysisAsMarkdown = (analysis: MorningAnalysisDocument): string => {
  return `# Morning Analysis: ${analysis.projectName}
*Generated on ${analysis.analysisDate}*

## Daily Strategy
${analysis.dailyStrategy}

## Task Priorities
${analysis.taskPriorities.map(task => `
### ${task.title}
- **Priority**: ${task.priority}
- **Reasoning**: ${task.reasoning}
- **Estimated Time**: ${task.estimatedTime}
`).join('\n')}

## Recommendations
${analysis.recommendations.map(rec => `
### ${rec.category}
- **Action**: ${rec.action}
- **Impact**: ${rec.impact}
- **Timeline**: ${rec.timeline}
`).join('\n')}

## Success Metrics
${analysis.successMetrics.map(metric => `
- **${metric.metric}**: ${metric.current} → ${metric.target}
`).join('\n')}

## Context
- **Project Status**: ${analysis.context.projectStatus}
- **Upcoming Deadlines**: ${analysis.context.upcomingDeadlines.join(', ') || 'None'}
- **Blockers**: ${analysis.context.blockers.join(', ') || 'None'}
- **Opportunities**: ${analysis.context.opportunities.join(', ') || 'None'}
`;
};

// Helper functions
const extractDeadlines = (tasks: any[]): string[] => {
  return tasks
    .filter(task => task.due_date)
    .map(task => `${task.title}: ${task.due_date}`)
    .slice(0, 3);
};

const extractBlockers = (messages: any[]): string[] => {
  const blockerKeywords = ['blocked', 'stuck', 'issue', 'problem', 'can\'t', 'unable'];
  return messages
    .filter(msg => blockerKeywords.some(keyword => msg.content.toLowerCase().includes(keyword)))
    .map(msg => msg.content.substring(0, 100))
    .slice(0, 3);
};

const extractOpportunities = (messages: any[]): string[] => {
  const opportunityKeywords = ['opportunity', 'chance', 'potential', 'could', 'might', 'suggest'];
  return messages
    .filter(msg => opportunityKeywords.some(keyword => msg.content.toLowerCase().includes(keyword)))
    .map(msg => msg.content.substring(0, 100))
    .slice(0, 3);
};
