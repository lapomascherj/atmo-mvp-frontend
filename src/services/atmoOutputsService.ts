import { supabase } from '@/lib/supabase';

export interface AtmoOutput {
  id: string;
  personaId: string;
  filename: string;
  fileType: string;
  contentUrl?: string;
  contentData?: any;
  fileSize?: number;
  sessionId?: string;
  createdAt: string;
}

export interface CreateOutputData {
  filename: string;
  fileType: string;
  contentUrl?: string;
  contentData?: any;
  fileSize?: number;
  sessionId?: string;
}

/**
 * Get today's ATMO outputs for the authenticated user
 */
export const getTodayOutputs = async (): Promise<AtmoOutput[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('atmo_outputs')
    .select('id, persona_id, filename, file_type, content_url, file_size, session_id, created_at')
    .eq('persona_id', user.id)
    .gte('created_at', startOfDay.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch today outputs:', error);
    throw error;
  }

  return (data || []).map(mapOutputRow);
};

export const fetchOutputContentData = async (outputId: string): Promise<any | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('atmo_outputs')
    .select('content_data')
    .eq('id', outputId)
    .eq('persona_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch output content data:', error);
    throw error;
  }

  return data?.content_data ?? null;
};

/**
 * Get all outputs for the authenticated user (with optional date filtering)
 */
export const getOutputs = async (startDate?: Date, endDate?: Date): Promise<AtmoOutput[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('atmo_outputs')
    .select('*')
    .eq('persona_id', user.id)
    .order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch outputs:', error);
    throw error;
  }

  return (data || []).map(mapOutputRow);
};

/**
 * Create a new ATMO output
 */
export const createOutput = async (outputData: CreateOutputData): Promise<AtmoOutput> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('atmo_outputs')
    .insert({
      persona_id: user.id,
      filename: outputData.filename,
      file_type: outputData.fileType,
      content_url: outputData.contentUrl,
      content_data: outputData.contentData,
      file_size: outputData.fileSize,
      session_id: outputData.sessionId,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create output:', error);
    throw error;
  }

  return mapOutputRow(data);
};

/**
 * Delete an ATMO output
 */
export const deleteOutput = async (outputId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('atmo_outputs')
    .delete()
    .eq('id', outputId)
    .eq('persona_id', user.id);

  if (error) {
    console.error('Failed to delete output:', error);
    throw error;
  }
};

/**
 * Convert base64 to Blob
 */
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

/**
 * Get download URL for an output
 * If content_url exists, return it directly
 * If content_data has pdfBase64, generate blob from base64
 * If content_data exists, generate a blob URL from content
 */
export const getOutputDownloadUrl = (output: AtmoOutput): string | null => {
  if (output.contentUrl) {
    return output.contentUrl;
  }

  if (output.contentData) {
    // Check if PDF base64 data exists
    if (typeof output.contentData === 'object' && output.contentData.pdfBase64) {
      try {
        const blob = base64ToBlob(output.contentData.pdfBase64, 'application/pdf');
        return URL.createObjectURL(blob);
      } catch (err) {
        console.error('Failed to convert base64 PDF to blob:', err);
        // Fall through to text content fallback
      }
    }

    // Fallback: Generate blob URL from text content
    const content = typeof output.contentData === 'string'
      ? output.contentData
      : output.contentData.content || JSON.stringify(output.contentData, null, 2);

    const blob = new Blob([content], { type: getMimeType(output.fileType) });
    return URL.createObjectURL(blob);
  }

  return null;
};

/**
 * Download an output file
 */
export const downloadOutput = async (output: AtmoOutput): Promise<void> => {
  let downloadUrl = getOutputDownloadUrl(output);

  if (!downloadUrl) {
    try {
      const contentData = await fetchOutputContentData(output.id);
      if (!contentData) {
        console.error('No content data available for output:', output.id);
        return;
      }
      const hydratedOutput: AtmoOutput = { ...output, contentData };
      downloadUrl = getOutputDownloadUrl(hydratedOutput);
      if (!downloadUrl) {
        console.error('Failed to derive download URL after fetching content data:', output.id);
        return;
      }
    } catch (error) {
      console.error('Failed to fetch content data for download:', error);
      return;
    }
  }

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = output.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (downloadUrl.startsWith('blob:')) {
    setTimeout(() => URL.revokeObjectURL(downloadUrl!), 100);
  }
};

/**
 * Get MIME type for file type
 */
const getMimeType = (fileType: string): string => {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'json': 'application/json',
    'markdown': 'text/markdown',
    'md': 'text/markdown',
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'ts': 'text/typescript',
    'jsx': 'text/javascript',
    'tsx': 'text/typescript',
    'py': 'text/x-python',
    'java': 'text/x-java',
    'c': 'text/x-c',
    'cpp': 'text/x-c++',
    'go': 'text/x-go',
    'rs': 'text/x-rust',
    'xml': 'application/xml',
    'csv': 'text/csv',
  };

  return mimeTypes[fileType.toLowerCase()] || 'application/octet-stream';
};

/**
 * Map database row to AtmoOutput interface
 */
const mapOutputRow = (row: any): AtmoOutput => ({
  id: row.id,
  personaId: row.persona_id,
  filename: row.filename,
  fileType: row.file_type,
  contentUrl: row.content_url,
  contentData: row.content_data,
  fileSize: row.file_size,
  sessionId: row.session_id,
  createdAt: row.created_at,
});
