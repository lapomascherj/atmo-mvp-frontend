import { supabase } from '@/lib/supabase';

export interface DailyAction {
  id: string;
  personaId: string;
  actionText: string;
  actionType: 'morning' | 'evening';
  completed: boolean;
  dateCreated: string;
  createdAt: string;
}

export interface ActionProgress {
  completedCount: number;
  totalCount: number;
}

/**
 * Get today's daily actions for the authenticated user
 */
export const getTodayActions = async (): Promise<DailyAction[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('get_today_actions', {
    user_id: user.id
  });

  if (error) {
    console.error('Failed to fetch today actions:', error);
    throw error;
  }

  return (data || []).map(mapActionRow);
};

/**
 * Check if actions exist for today
 */
export const hasTodayActions = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('has_today_actions', {
    user_id: user.id
  });

  if (error) {
    console.error('Failed to check if actions exist:', error);
    return false;
  }

  return data || false;
};

/**
 * Get action completion progress for today
 */
export const getActionProgress = async (): Promise<ActionProgress> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('get_action_progress', {
    user_id: user.id
  });

  if (error) {
    console.error('Failed to fetch action progress:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return { completedCount: 0, totalCount: 0 };
  }

  return {
    completedCount: data[0].completed_count,
    totalCount: data[0].total_count,
  };
};

/**
 * Toggle action completion status (optimistic update)
 */
export const toggleActionCompletion = async (
  actionId: string,
  completed: boolean
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('daily_actions')
    .update({ completed })
    .eq('id', actionId)
    .eq('persona_id', user.id);

  if (error) {
    console.error('Failed to toggle action completion:', error);
    throw error;
  }
};

/**
 * Generate daily actions by calling the edge function
 */
export const generateActions = async (): Promise<DailyAction[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.functions.invoke('generate-daily-actions', {
    body: { userId: user.id }
  });

  if (error) {
    console.error('Failed to generate actions:', error);
    throw error;
  }

  return data.actions || [];
};

/**
 * Clean up old actions (can be called manually if needed)
 */
export const cleanupOldActions = async (): Promise<number> => {
  const { data, error } = await supabase.rpc('trigger_daily_actions_cleanup');

  if (error) {
    console.error('Failed to cleanup old actions:', error);
    throw error;
  }

  return data?.[0]?.deleted_count || 0;
};

/**
 * Map database row to DailyAction interface
 */
const mapActionRow = (row: any): DailyAction => ({
  id: row.id,
  personaId: row.persona_id,
  actionText: row.action_text,
  actionType: row.action_type,
  completed: row.completed,
  dateCreated: row.date_created,
  createdAt: row.created_at,
});
