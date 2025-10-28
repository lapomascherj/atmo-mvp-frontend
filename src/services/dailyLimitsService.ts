import { supabase } from '@/lib/supabase';

export interface DailyLimits {
  documentsCreated: number;
  maxDocumentsPerDay: number;
  remainingDocuments: number;
  resetTime: string; // ISO string of next reset
}

export interface DocumentCreationAttempt {
  success: boolean;
  timestamp: string;
  documentType: string;
  reason?: string; // If failed, why
}

/**
 * Get user's daily document creation limits and usage
 */
export const getDailyLimits = async (): Promise<DailyLimits> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get today's document count
  const { data: todayOutputs, error: outputsError } = await supabase
    .from('atmo_outputs')
    .select('id')
    .eq('persona_id', user.id)
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString());

  if (outputsError) {
    console.error('Failed to fetch today outputs:', outputsError);
    throw outputsError;
  }

  const documentsCreated = todayOutputs?.length || 0;
  const maxDocumentsPerDay = 3; // Default limit
  const remainingDocuments = Math.max(0, maxDocumentsPerDay - documentsCreated);

  return {
    documentsCreated,
    maxDocumentsPerDay,
    remainingDocuments,
    resetTime: tomorrow.toISOString()
  };
};

/**
 * Check if user can create a document today
 */
export const canCreateDocument = async (): Promise<{ canCreate: boolean; reason?: string }> => {
  try {
    const limits = await getDailyLimits();
    
    if (limits.remainingDocuments <= 0) {
      return {
        canCreate: false,
        reason: `Daily limit reached (${limits.maxDocumentsPerDay} documents). Resets at ${new Date(limits.resetTime).toLocaleTimeString()}`
      };
    }

    return { canCreate: true };
  } catch (error) {
    console.error('Failed to check document creation limits:', error);
    return { canCreate: false, reason: 'Unable to verify limits' };
  }
};

/**
 * Record a document creation attempt
 */
export const recordDocumentCreation = async (documentType: string, success: boolean, reason?: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    // Store in localStorage for now (could be moved to database later)
    const attempts = getDocumentCreationAttempts();
    const newAttempt: DocumentCreationAttempt = {
      success,
      timestamp: new Date().toISOString(),
      documentType,
      reason
    };

    attempts.push(newAttempt);
    
    // Keep only last 30 days of attempts
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const filteredAttempts = attempts.filter(attempt => 
      new Date(attempt.timestamp) > thirtyDaysAgo
    );

    localStorage.setItem('documentCreationAttempts', JSON.stringify(filteredAttempts));
  } catch (error) {
    console.error('Failed to record document creation attempt:', error);
  }
};

/**
 * Get document creation attempts from localStorage
 */
export const getDocumentCreationAttempts = (): DocumentCreationAttempt[] => {
  try {
    const stored = localStorage.getItem('documentCreationAttempts');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get document creation attempts:', error);
    return [];
  }
};

/**
 * Get user's document creation statistics
 */
export const getDocumentStats = async (): Promise<{
  totalDocuments: number;
  documentsThisWeek: number;
  documentsThisMonth: number;
  averageDocumentsPerDay: number;
  mostActiveDay: string;
}> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  // Get all outputs
  const { data: allOutputs, error: allError } = await supabase
    .from('atmo_outputs')
    .select('created_at')
    .eq('persona_id', user.id);

  if (allError) {
    console.error('Failed to fetch all outputs:', allError);
    throw allError;
  }

  const totalDocuments = allOutputs?.length || 0;
  
  // Filter by time periods
  const documentsThisWeek = allOutputs?.filter(output => 
    new Date(output.created_at) >= weekAgo
  ).length || 0;
  
  const documentsThisMonth = allOutputs?.filter(output => 
    new Date(output.created_at) >= monthAgo
  ).length || 0;

  // Calculate average per day (last 30 days)
  const averageDocumentsPerDay = documentsThisMonth / 30;

  // Find most active day
  const dayCounts: { [key: string]: number } = {};
  allOutputs?.forEach(output => {
    const day = new Date(output.created_at).toDateString();
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  const mostActiveDay = Object.entries(dayCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'No activity';

  return {
    totalDocuments,
    documentsThisWeek,
    documentsThisMonth,
    averageDocumentsPerDay: Math.round(averageDocumentsPerDay * 100) / 100,
    mostActiveDay
  };
};
