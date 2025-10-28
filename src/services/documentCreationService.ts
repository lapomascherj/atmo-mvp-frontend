import { supabase } from '@/lib/supabase';
import { createOutput, type CreateOutputData } from './atmoOutputsService';
import { generateDocument } from '@/api/mockDocumentApi';
import { canCreateDocument, recordDocumentCreation } from './dailyLimitsService';

export interface DocumentRequest {
  userMessage: string;
  assistantResponse: string;
  documentType: 'strategic_plan' | 'action_plan' | 'analysis' | 'guide' | 'framework' | 'report';
  context?: {
    projectId?: string;
    goalId?: string;
    taskId?: string;
    priority?: 'high' | 'medium' | 'low';
  };
}

export interface DocumentContent {
  title: string;
  executiveSummary: string;
  sections: {
    [key: string]: string;
  };
  metadata: {
    createdAt: string;
    documentType: string;
    context?: any;
  };
}

/**
 * Create a document from chat/avatar input
 */
export const createDocumentFromChat = async (request: DocumentRequest): Promise<{ success: boolean; documentId?: string; error?: string }> => {
  try {
    console.log('📄 Creating document from chat input:', request);

    // Check daily limits first
    const limitCheck = await canCreateDocument();
    if (!limitCheck.canCreate) {
      console.warn('❌ Document creation blocked by daily limits:', limitCheck.reason);
      await recordDocumentCreation(request.documentType, false, limitCheck.reason);
      
      return { 
        success: false, 
        error: limitCheck.reason || 'Daily document limit reached' 
      };
    }

    // Emit start event
    window.dispatchEvent(new CustomEvent('atmo:document:progress', {
      detail: { type: 'start', title: 'Creating strategy document...', progress: 0 }
    }));

    // Enhanced progress steps with more realistic timing
    const progressSteps = [
      { progress: 10, title: 'Checking daily limits...' },
      { progress: 25, title: 'Analyzing request...' },
      { progress: 45, title: 'Gathering context...' },
      { progress: 65, title: 'Generating content...' },
      { progress: 80, title: 'Structuring document...' },
      { progress: 90, title: 'Finalizing...' },
      { progress: 95, title: 'Saving document...' }
    ];

    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200)); // More realistic timing
      window.dispatchEvent(new CustomEvent('atmo:document:progress', {
        detail: { type: 'progress', ...step }
      }));
    }

    // Generate document content
    const documentContent = await generateDocumentContent(request);
    
    // Create the document file
    const filename = `${documentContent.title} - ${new Date().toISOString().split('T')[0]}.md`;
    
    const outputData: CreateOutputData = {
      filename,
      fileType: 'markdown',
      contentData: {
        documentContent,
        source: {
          userMessage: request.userMessage,
          assistantResponse: request.assistantResponse,
          documentType: request.documentType,
          context: request.context
        }
      },
      fileSize: JSON.stringify(documentContent).length
    };

    const output = await createOutput(outputData);
    
    // Record successful creation
    await recordDocumentCreation(request.documentType, true);
    
    // Emit completion event
    window.dispatchEvent(new CustomEvent('atmo:document:progress', {
      detail: { type: 'complete', progress: 100 }
    }));
    
    console.log('✅ Document created successfully:', output.id);
    return { success: true, documentId: output.id };
    
  } catch (error) {
    console.error('❌ Failed to create document:', error);
    
    // Record failed creation
    await recordDocumentCreation(request.documentType, false, error instanceof Error ? error.message : 'Unknown error');
    
    // Emit error event
    window.dispatchEvent(new CustomEvent('atmo:document:progress', {
      detail: { type: 'error', progress: 0 }
    }));
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Generate document content using AI
 */
const generateDocumentContent = async (request: DocumentRequest): Promise<DocumentContent> => {
  const { userMessage, assistantResponse, documentType, context } = request;
  
  // Get user context for personalization
  const userContext = await getUserContext();
  
  // Build the prompt for document generation
  const prompt = buildDocumentPrompt(userMessage, assistantResponse, documentType, userContext, context);
  
  try {
    // Use mock API for document generation
    const result = await generateDocument({ prompt, documentType });
    return result.documentContent;
    
  } catch (error) {
    console.error('❌ Document generation failed, creating fallback:', error);
    
    // Fallback: Create a basic document structure
    return createFallbackDocument(request);
  }
};

/**
 * Build prompt for document generation
 */
const buildDocumentPrompt = (
  userMessage: string, 
  assistantResponse: string, 
  documentType: string,
  userContext: any,
  context?: any
): string => {
  const basePrompt = `You are an elite strategic operator creating professional documents. Create a comprehensive ${documentType} based on the following conversation:

USER REQUEST: "${userMessage}"

AI RESPONSE: "${assistantResponse}"

USER CONTEXT:
- Name: ${userContext.display_name || 'User'}
- Email: ${userContext.email || 'N/A'}
- Current Projects: ${userContext.projects?.length || 0} active projects
- Goals: ${userContext.goals?.length || 0} active goals

${context ? `SPECIFIC CONTEXT:
- Project: ${context.projectId || 'N/A'}
- Goal: ${context.goalId || 'N/A'}
- Task: ${context.taskId || 'N/A'}
- Priority: ${context.priority || 'medium'}
` : ''}

Create a professional document with:
1. A compelling title
2. Executive summary (2-3 paragraphs)
3. Detailed sections with actionable content
4. Specific recommendations and next steps
5. Implementation timeline
6. Success metrics

Format as structured JSON with title, executiveSummary, and sections object.`;

  return basePrompt;
};

/**
 * Get user context for document personalization
 */
const getUserContext = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('id', user.id)
      .single();

    // Get user's projects and goals
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, status')
      .eq('persona_id', user.id)
      .eq('status', 'active');

    const { data: goals } = await supabase
      .from('goals')
      .select('id, title, status')
      .eq('persona_id', user.id)
      .eq('status', 'active');

    return {
      display_name: profile?.display_name,
      email: profile?.email,
      projects: projects || [],
      goals: goals || []
    };
  } catch (error) {
    console.error('Failed to get user context:', error);
    return {};
  }
};

/**
 * Create fallback document when AI generation fails
 */
const createFallbackDocument = (request: DocumentRequest): DocumentContent => {
  const { userMessage, assistantResponse, documentType } = request;
  
  const title = extractTitleFromMessage(userMessage);
  
  return {
    title,
    executiveSummary: `This document was generated based on your request: "${userMessage}". The AI provided the following response: "${assistantResponse}". This document outlines the key points and recommendations discussed.`,
    sections: {
      'Overview': `Based on your request: "${userMessage}"`,
      'AI Analysis': assistantResponse,
      'Key Points': extractKeyPoints(assistantResponse),
      'Next Steps': 'Review the analysis above and implement the recommended actions.',
      'Implementation Notes': 'Consider your current projects and goals when implementing these recommendations.'
    },
    metadata: {
      createdAt: new Date().toISOString(),
      documentType,
      context: request.context
    }
  };
};

/**
 * Extract title from user message - 2 words maximum
 */
const extractTitleFromMessage = (message: string): string => {
  // Clean the message and extract meaningful words
  const cleanMessage = message.replace(/[^\w\s]/g, '').toLowerCase();
  const words = cleanMessage.split(' ').filter(word => 
    word.length > 2 && 
    !['the', 'and', 'for', 'with', 'this', 'that', 'from', 'they', 'have', 'will', 'been', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other', 'after', 'first', 'well', 'also', 'where', 'much', 'some', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'these', 'think', 'want', 'what', 'year', 'your', 'work', 'know', 'good', 'look', 'help', 'right', 'back', 'call', 'find', 'give', 'keep', 'last', 'move', 'need', 'open', 'play', 'put', 'run', 'see', 'seem', 'show', 'tell', 'turn', 'use', 'way', 'went', 'were', 'what', 'when', 'will', 'with', 'work', 'year', 'your'].includes(word)
  );
  
  // Take the first 2 meaningful words
  const titleWords = words.slice(0, 2);
  
  if (titleWords.length === 0) {
    return 'Strategy Document';
  } else if (titleWords.length === 1) {
    return titleWords[0].charAt(0).toUpperCase() + titleWords[0].slice(1) + ' Strategy';
  } else {
    return titleWords.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
};

/**
 * Extract key points from assistant response
 */
const extractKeyPoints = (response: string): string => {
  // Simple extraction of key points
  const sentences = response.split('.').filter(s => s.trim().length > 20);
  return sentences.slice(0, 3).map(s => s.trim() + '.').join('\n');
};

/**
 * Detect if a message is requesting document creation
 */
export const detectDocumentRequest = (message: string): { isRequest: boolean; documentType?: string } => {
  const documentKeywords = [
    // Explicit document creation commands
    'create document', 'generate document', 'make document', 'write document',
    'create plan', 'generate plan', 'make plan', 'write plan',
    'create strategy', 'generate strategy', 'make strategy', 'write strategy',
    'create guide', 'generate guide', 'make guide', 'write guide',
    'create framework', 'generate framework', 'make framework', 'write framework',
    'create analysis', 'generate analysis', 'make analysis', 'write analysis',
    'create report', 'generate report', 'make report', 'write report',
    'save this', 'export this', 'document this', 'record this',
    
    // Voice-friendly commands
    'create me a document', 'generate me a document', 'make me a document',
    'create me a plan', 'generate me a plan', 'make me a plan',
    'create me a strategy', 'generate me a strategy', 'make me a strategy',
    'create me a guide', 'generate me a guide', 'make me a guide',
    'create me a framework', 'generate me a framework', 'make me a framework',
    'create me an analysis', 'generate me an analysis', 'make me an analysis',
    'create me a report', 'generate me a report', 'make me a report',
    
    // Shorter voice commands
    'document this', 'save this conversation', 'export this chat',
    'turn this into a document', 'make this a document',
    'create a doc', 'generate a doc', 'make a doc',
    
    // Action-oriented commands
    'i need a document', 'i want a document', 'give me a document',
    'i need a plan', 'i want a plan', 'give me a plan',
    'i need a strategy', 'i want a strategy', 'give me a strategy',
    'i need a guide', 'i want a guide', 'give me a guide',
    'i need an analysis', 'i want an analysis', 'give me an analysis',
    'i need a report', 'i want a report', 'give me a report'
  ];

  const lowerMessage = message.toLowerCase();
  
  for (const keyword of documentKeywords) {
    if (lowerMessage.includes(keyword)) {
      // Determine document type based on context
      let documentType = 'strategic_plan';
      
      if (lowerMessage.includes('plan') || lowerMessage.includes('strategy')) {
        documentType = 'strategic_plan';
      } else if (lowerMessage.includes('guide') || lowerMessage.includes('how to')) {
        documentType = 'guide';
      } else if (lowerMessage.includes('analysis') || lowerMessage.includes('analyze')) {
        documentType = 'analysis';
      } else if (lowerMessage.includes('framework') || lowerMessage.includes('structure')) {
        documentType = 'framework';
      } else if (lowerMessage.includes('report') || lowerMessage.includes('summary')) {
        documentType = 'report';
      } else if (lowerMessage.includes('action') || lowerMessage.includes('steps')) {
        documentType = 'action_plan';
      }
      
      return { isRequest: true, documentType: documentType as any };
    }
  }
  
  return { isRequest: false };
};
