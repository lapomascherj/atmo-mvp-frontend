import React from 'react';
import { AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/atoms/Button.tsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/atoms/Alert.tsx';
import { useToast } from '@/hooks/useToast';

interface NotionConfigErrorProps {
  error: string;
  onDismiss?: () => void;
}

/**
 * Shows helpful error messages and setup instructions when Notion integration is misconfigured
 */
const NotionConfigError: React.FC<NotionConfigErrorProps> = ({ error, onDismiss }) => {
  const { toast } = useToast();

  const isCredentialError = error.includes('not configured') || error.includes('environment variables');
  const isDevelopment = import.meta.env.DEV;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Environment variable copied to clipboard",
    });
  };

  if (!isCredentialError || !isDevelopment) {
    // Show standard error for non-credential issues or in production
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Notion Integration Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        {onDismiss && (
          <Button variant="outline" size="sm" onClick={onDismiss} className="mt-2">
            Dismiss
          </Button>
        )}
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 border-orange-500/20 bg-orange-500/10">
      <AlertCircle className="h-4 w-4 text-orange-500" />
      <AlertTitle className="text-orange-500">Notion Setup Required</AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-sm text-slate-300">
          The Notion integration requires environment variables to be configured.
        </p>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400">Add these to your .env.local file:</p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded border">
              <code className="flex-1 text-xs text-green-400">VITE_NOTION_CLIENT_ID=your_client_id_here</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard('VITE_NOTION_CLIENT_ID=your_client_id_here')}
                className="h-6 w-6 p-0"
              >
                <Copy size={12} />
              </Button>
            </div>

            <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded border">
              <code className="flex-1 text-xs text-green-400">VITE_NOTION_CLIENT_SECRET=your_client_secret_here</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard('VITE_NOTION_CLIENT_SECRET=your_client_secret_here')}
                className="h-6 w-6 p-0"
              >
                <Copy size={12} />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://www.notion.so/my-integrations', '_blank')}
            className="text-xs"
          >
            <ExternalLink size={12} className="mr-1" />
            Create Notion Integration
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/NOTION_INTEGRATION_SETUP.md', '_blank')}
            className="text-xs"
          >
            Setup Guide
          </Button>

          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss} className="text-xs">
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default NotionConfigError;
