import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FileText, Code, FileJson, FileCode, Download, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { AtmoCard } from '../molecules/AtmoCard';
import {
  getTodayOutputs,
  downloadOutput,
  deleteOutput,
  type AtmoOutput,
} from '@/services/atmoOutputsService';
import { useAuth } from '@/hooks/useAuth';

const AtmoOutputsCard: React.FC = () => {
  const { session, initializing } = useAuth();
  const [outputs, setOutputs] = useState<AtmoOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cooldown to prevent excessive polling
  const lastFetchRef = useRef<number>(0);
  const isInitialLoadRef = useRef(true); // Track if this is first load
  const loadOutputsRef = useRef<(force?: boolean) => Promise<void>>();
  const REFRESH_INTERVAL_MS = 45000; // 45 seconds

  // Load today's outputs with cooldown protection and silent background refresh
  const loadOutputs = useCallback(async (force: boolean = false) => {
    if (!session) {
      setOutputs([]);
      setError(null);
      setLoading(false);
      isInitialLoadRef.current = true; // Reset on logout
      console.debug('[AtmoOutputs] Skipping load (no session yet)', { initializing, force });
      return;
    }

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;

    // Skip if within cooldown (prevent rapid calls)
    if (!force && timeSinceLastFetch < 5000) {
      console.debug('[AtmoOutputs] Skipping load (cooldown)', { force, timeSinceLastFetch });
      return;
    }

    try {
      console.debug('[AtmoOutputs] Loading outputs', { force, initialLoad: isInitialLoadRef.current });
      // Only show loading spinner on FIRST load, not on background refreshes
      if (isInitialLoadRef.current) {
        setLoading(true);
      }
      
      setError(null);
      const data = await getTodayOutputs();
      console.debug('[AtmoOutputs] Loaded', { count: data.length });
      setOutputs(data); // Silent update - React batches efficiently
      lastFetchRef.current = now;
      
      // Mark initial load as complete
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
    } catch (err) {
      if ((err as Error).message === 'Not authenticated') {
        console.warn('[AtmoOutputs] Not authenticated when loading outputs');
        return;
      }
      console.error('❌ Failed to load outputs:', err);
      
      // Only show error on initial load, silent fail on background refresh
      if (isInitialLoadRef.current) {
        setError('Unable to load outputs');
      }
    } finally {
      setLoading(false);
    }
  }, [session, initializing]); // Removed outputs.length to prevent cascade

  // Keep ref updated with latest loadOutputs function
  useEffect(() => {
    loadOutputsRef.current = loadOutputs;
  }, [loadOutputs]);

  // Initial mount - show loading spinner
  useEffect(() => {
    if (!initializing && session) {
      isInitialLoadRef.current = true; // Reset on mount
      void loadOutputs(true);
    }
  }, [session, initializing, loadOutputs]);

  // Silent background refresh every 45 seconds - no UI changes
  useEffect(() => {
    if (!session) return;
    
    const interval = window.setInterval(() => {
      // Call via ref to always use latest version without dependency
      if (loadOutputsRef.current) {
        void loadOutputsRef.current(false);
      }
    }, REFRESH_INTERVAL_MS);
    
    return () => window.clearInterval(interval);
  }, [session]); // Stable - no function dependencies

  // Event-driven refresh (manual or triggered by document generation)
  useEffect(() => {
    const handleRefresh = () => {
      // Call via ref to always use latest version without dependency
      if (loadOutputsRef.current) {
        void loadOutputsRef.current(true);
      }
    };
    
    window.addEventListener('atmo:outputs:refresh', handleRefresh);
    return () => window.removeEventListener('atmo:outputs:refresh', handleRefresh);
  }, []); // Stable - set once on mount

  // Get icon for file type
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();

    if (type.includes('json')) return <FileJson size={14} className="text-blue-400" />;
    if (type.includes('code') || ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'go', 'rs'].includes(type)) {
      return <Code size={14} className="text-green-400" />;
    }
    if (['md', 'markdown', 'txt'].includes(type)) return <FileText size={14} className="text-purple-400" />;
    if (['pdf', 'doc', 'docx'].includes(type)) return <FileText size={14} className="text-red-400" />;

    return <FileCode size={14} className="text-[#FF5F1F]" />;
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format time
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const handleOutputClick = (output: AtmoOutput) => {
    void downloadOutput(output);
  };

  const handleDelete = async (output: AtmoOutput, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent download on delete click
    if (window.confirm(`Delete "${output.filename}"? This cannot be undone.`)) {
      try {
        await deleteOutput(output.id);
        void loadOutputs(true); // Refresh list
      } catch (error) {
        console.error('Failed to delete output:', error);
        setError('Failed to delete output');
      }
    }
  };

  const handleManualRefresh = () => {
    void loadOutputs(true);
  };

  // Memoize output items to prevent re-renders
  const outputItems = useMemo(() => {
    return outputs.map((output) => (
      <div
        key={output.id}
        onClick={() => handleOutputClick(output)}
        className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-[#FF5F1F]/30 transition-colors cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="mt-0.5 flex-shrink-0">
              {getFileIcon(output.fileType)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate group-hover:text-[#FF5F1F] transition-colors">
                {output.filename}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-white/50">
                  {output.fileType.toUpperCase()}
                </span>
                {output.fileSize && (
                  <>
                    <span className="text-xs text-white/30">•</span>
                    <span className="text-xs text-white/50">
                      {formatFileSize(output.fileSize)}
                    </span>
                  </>
                )}
                <span className="text-xs text-white/30">•</span>
                <span className="text-xs text-white/50">
                  {formatTime(output.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => handleDelete(output, e)}
              className="p-1 hover:bg-red-500/20 rounded transition-colors"
              title="Delete output"
            >
              <Trash2 size={14} className="text-red-400 hover:text-red-300" />
            </button>
            <Download size={14} className="text-[#FF5F1F]" />
          </div>
        </div>
      </div>
    ));
  }, [outputs]);

  return (
    <AtmoCard variant="orange" className="p-3 w-72 h-[350px]" hover={true} glow={true}>
      <div className="relative h-full flex flex-col">
        {/* Card Title */}
        <h3 className="text-lg font-semibold text-white mb-3">ATMO Outputs</h3>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 size={32} className="animate-spin text-[#FF5F1F] mb-3" />
            <p className="text-sm text-white/60">Loading outputs...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && outputs.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <FileCode size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-base text-white/60 font-medium">No outputs generated today</p>
            <p className="text-sm text-white/40 mt-2 text-center max-w-xs">
              AI-generated documents, strategies, and code will appear here automatically
            </p>
          </div>
        )}

        {/* Outputs List - Fixed scrollable height */}
        {!loading && !error && outputs.length > 0 && (
          <div className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-0">
            {outputItems}
          </div>
        )}

        {/* Output Count */}
        {!loading && outputs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10 flex-shrink-0 flex items-center justify-between">
            <p className="text-xs text-white/50">
              {outputs.length} {outputs.length === 1 ? 'output' : 'outputs'} generated today
            </p>
            <button
              onClick={handleManualRefresh}
              className="text-xs text-[#FF5F1F]/80 hover:text-[#FF5F1F] transition-colors"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </AtmoCard>
  );
};

export default React.memo(AtmoOutputsCard);
