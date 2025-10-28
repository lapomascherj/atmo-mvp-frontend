/**
 * Mock document generation API
 * This simulates the AI document generation service
 */

export interface DocumentGenerationRequest {
  prompt: string;
  documentType: string;
}

export interface DocumentGenerationResponse {
  documentContent: {
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
  };
}

/**
 * Mock document generation endpoint
 */
export const generateDocument = async (request: DocumentGenerationRequest): Promise<DocumentGenerationResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const { prompt, documentType } = request;
  
  // Extract key information from the prompt
  const title = extractTitleFromPrompt(prompt);
  const summary = generateExecutiveSummary(prompt, documentType);
  const sections = generateDocumentSections(prompt, documentType);
  
  return {
    documentContent: {
      title,
      executiveSummary: summary,
      sections,
      metadata: {
        createdAt: new Date().toISOString(),
        documentType,
        context: { generatedBy: 'mock-api' }
      }
    }
  };
};

/**
 * Mock morning analysis generation endpoint
 */
export const generateMorningAnalysis = async (request: { prompt: string; projectId: string }): Promise<{ analysis: any }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const { prompt, projectId } = request;
  
  // Generate mock analysis
  const analysis = {
    dailyStrategy: `Based on your project analysis, today's focus should be on high-priority tasks that drive maximum impact. Prioritize tasks that align with your core objectives and have clear success metrics.`,
    taskPriorities: [
      {
        taskId: 'task-1',
        title: 'Complete project milestone',
        priority: 'high',
        reasoning: 'Critical for project timeline',
        estimatedTime: '3-4 hours'
      },
      {
        taskId: 'task-2',
        title: 'Review project documentation',
        priority: 'medium',
        reasoning: 'Important for team alignment',
        estimatedTime: '1-2 hours'
      }
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
        action: 'Schedule team check-in',
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
  
  return { analysis };
};

// Helper functions
const extractTitleFromPrompt = (prompt: string): string => {
  // Try to extract a meaningful title from the prompt
  const lines = prompt.split('\n');
  const firstLine = lines[0] || '';
  
  // Look for project name or key terms
  const projectMatch = firstLine.match(/PROJECT:\s*(.+)/i);
  if (projectMatch) {
    const projectName = projectMatch[1].trim();
    const words = projectName.split(' ').filter(word => word.length > 2);
    if (words.length >= 2) {
      return `${words[0]} ${words[1]}`;
    }
    return `${projectName} Strategy`;
  }
  
  // Extract meaningful words from the prompt
  const cleanPrompt = prompt.replace(/[^\w\s]/g, '').toLowerCase();
  const words = cleanPrompt.split(' ').filter(word => 
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

const generateExecutiveSummary = (prompt: string, documentType: string): string => {
  const baseSummary = `This ${documentType} document provides a comprehensive analysis and strategic recommendations based on your current project status and objectives. `;
  
  if (documentType === 'strategic_plan') {
    return baseSummary + `The plan outlines key strategic initiatives, resource allocation, and success metrics to drive your project forward. It includes detailed action items, timelines, and risk mitigation strategies to ensure successful execution.`;
  } else if (documentType === 'morning_analysis') {
    return baseSummary + `Today's analysis focuses on optimizing your workflow, prioritizing high-impact tasks, and identifying opportunities for advancement. The recommendations are tailored to your current project status and immediate needs.`;
  } else {
    return baseSummary + `The document provides actionable insights and recommendations to help you achieve your objectives effectively.`;
  }
};

const generateDocumentSections = (prompt: string, documentType: string): { [key: string]: string } => {
  const sections: { [key: string]: string } = {};
  
  if (documentType === 'strategic_plan') {
    sections['Strategic Overview'] = 'This section outlines the core strategic objectives and key success factors for your project.';
    sections['Action Plan'] = 'Detailed step-by-step actions with timelines and responsible parties.';
    sections['Resource Requirements'] = 'Budget, personnel, and resource needs for successful execution.';
    sections['Risk Assessment'] = 'Potential challenges and mitigation strategies.';
    sections['Success Metrics'] = 'Key performance indicators and measurement criteria.';
  } else if (documentType === 'morning_analysis') {
    sections['Daily Strategy'] = 'Today\'s focus areas and strategic priorities.';
    sections['Task Priorities'] = 'High-priority tasks with reasoning and time estimates.';
    sections['Recommendations'] = 'Specific actions to take today for maximum impact.';
    sections['Success Metrics'] = 'Key metrics to track throughout the day.';
    sections['Context Analysis'] = 'Current project status and environmental factors.';
  } else {
    sections['Overview'] = 'Key insights and recommendations based on your request.';
    sections['Implementation'] = 'Practical steps to implement the recommendations.';
    sections['Next Steps'] = 'Immediate actions and follow-up items.';
  }
  
  return sections;
};
