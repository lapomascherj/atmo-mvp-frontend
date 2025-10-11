import React, { useState, useEffect } from 'react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { useIntegrationsStore } from "@/stores/useMockIntegrationsStore";
import { usePocketBase } from "@/hooks/useMockPocketBase";
import useMockAuth from '@/hooks/useMockAuth';
import IntegrationCredentialsForm from './IntegrationCredentialsForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/atoms/Dialog';
import { useToast } from '@/hooks/useToast';
import { IntegrationProvider } from '@/models/IntegrationProvider';
import { IntegrationType } from '@/models/IntegrationType';
import { 
  Github, 
  FileText, 
  Calendar, 
  Database, 
  Zap, 
  Bot,
  ExternalLink,
  Check,
  Loader2
} from 'lucide-react';

// Define integration configurations
const INTEGRATION_CONFIGS = {
  notion: {
    name: 'Notion',
    description: 'Connect your Notion workspace for knowledge management',
    provider: IntegrationProvider.Notion,
    type: IntegrationType.KnowledgeBase,
    icon: <FileText className="w-5 h-5" />,
    setupUrl: 'https://www.notion.so/my-integrations',
    setupLabel: 'You need to create a Notion integration first',
    fields: [
      {
        key: 'apiKey',
        label: 'Internal Integration Secret',
        type: 'password' as const,
        placeholder: 'ntn_...',
        required: true,
        description: 'Your Notion Internal Integration Secret (starts with ntn_)'
      }
    ]
  },
  github: {
    name: 'GitHub',
    description: 'Connect your GitHub repositories for code management',
    provider: IntegrationProvider.Github,
    type: IntegrationType.KnowledgeBase,
    icon: <Github className="w-5 h-5" />,
    setupUrl: 'https://github.com/settings/developers',
    setupLabel: 'You need to create a GitHub OAuth App first',
    fields: [
      {
        key: 'client',
        label: 'Client ID',
        type: 'text' as const,
        placeholder: 'Your GitHub Client ID',
        required: true,
        description: 'GitHub OAuth App Client ID'
      },
      {
        key: 'secret',
        label: 'Client Secret',
        type: 'password' as const,
        placeholder: 'Your GitHub Client Secret',
        required: true,
        description: 'GitHub OAuth App Client Secret'
      }
    ]
  },
  'google-calendar': {
    name: 'Google Calendar',
    description: 'Sync your Google Calendar for schedule management',
    provider: IntegrationProvider.Google,
    type: IntegrationType.KnowledgeBase,
    icon: <Calendar className="w-5 h-5" />,
    setupUrl: 'https://console.cloud.google.com/apis/credentials',
    setupLabel: 'You need to create Google OAuth credentials first',
    fields: [
      {
        key: 'client',
        label: 'Client ID',
        type: 'text' as const,
        placeholder: 'Your Google Client ID',
        required: true,
        description: 'Google OAuth Client ID'
      },
      {
        key: 'secret',
        label: 'Client Secret',
        type: 'password' as const,
        placeholder: 'Your Google Client Secret',
        required: true,
        description: 'Google OAuth Client Secret'
      }
    ]
  },
  'google-drive': {
    name: 'Google Drive',
    description: 'Connect Google Drive for document management',
    provider: IntegrationProvider.Google,
    type: IntegrationType.KnowledgeBase,
    icon: <Database className="w-5 h-5" />,
    setupUrl: 'https://console.cloud.google.com/apis/credentials',
    setupLabel: 'You need to create Google OAuth credentials first',
    fields: [
      {
        key: 'client',
        label: 'Client ID',
        type: 'text' as const,
        placeholder: 'Your Google Client ID',
        required: true,
        description: 'Google OAuth Client ID'
      },
      {
        key: 'secret',
        label: 'Client Secret',
        type: 'password' as const,
        placeholder: 'Your Google Client Secret',
        required: true,
        description: 'Google OAuth Client Secret'
      }
    ]
  },
  openai: {
    name: 'OpenAI',
    description: 'Connect OpenAI for AI-powered content enhancement',
    provider: IntegrationProvider.OpenAI,
    type: IntegrationType.Enhancer,
    icon: <Zap className="w-5 h-5" />,
    setupUrl: 'https://platform.openai.com/api-keys',
    setupLabel: 'You need to create an OpenAI API key first',
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password' as const,
        placeholder: 'sk-...',
        required: true,
        description: 'Your OpenAI API Key (starts with sk-)'
      }
    ]
  },
  claude: {
    name: 'Claude (Anthropic)',
    description: 'Connect Claude for AI-powered assistance',
    provider: IntegrationProvider.Anthropic,
    type: IntegrationType.Enhancer,
    icon: <Bot className="w-5 h-5" />,
    setupUrl: 'https://console.anthropic.com/account/keys',
    setupLabel: 'You need to create an Anthropic API key first',
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password' as const,
        placeholder: 'sk-ant-...',
        required: true,
        description: 'Your Anthropic API Key (starts with sk-ant-)'
      }
    ]
  }
};

interface IntegrationButtonProps {
  integrationType: keyof typeof INTEGRATION_CONFIGS;
  className?: string;
}

const IntegrationButton: React.FC<IntegrationButtonProps> = ({
  integrationType,
  className = ''
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const {
    integrations,
    loading,
    error,
    fetchIntegrations,
    addIntegration,
    deleteIntegration,
    getIntegrationByProvider,
    hasIntegration,
    clearError
  } = useIntegrationsStore();

  const pb = usePocketBase();
  const { user } = useMockAuth();

  const config = INTEGRATION_CONFIGS[integrationType];
  if (!config) {
    console.error(`Unknown integration type: ${integrationType}`);
    return null;
  }

  // Fetch integrations when component mounts
  useEffect(() => {
    if (pb) {
      fetchIntegrations(pb);
    }
  }, [fetchIntegrations, pb]);

  const isConnected = hasIntegration(config.provider);
  const existingIntegration = getIntegrationByProvider(config.provider);

  const handleConnect = async (credentials: Record<string, string>) => {
    if (!pb) {
      toast({
        title: 'Connection Failed',
        description: 'Database connection not available. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      clearError();
      
      // Create integration from form data
      const integrationData = createIntegrationFromForm(
        config.provider,
        config.type,
        credentials,
        user?.id || ''
      );
      
      console.log('Connecting integration:', { integrationType, integrationData });

      await addIntegration(pb, integrationData);

      toast({
        title: 'Integration Connected',
        description: `${config.name} has been connected successfully.`,
      });

      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to connect integration:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || `Failed to connect ${config.name}. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = async () => {
    if (!pb) {
      toast({
        title: 'Disconnection Failed',
        description: 'Database connection not available. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    if (!existingIntegration) return;

    try {
      clearError();
      await deleteIntegration(pb, existingIntegration);

      toast({
        title: 'Integration Disconnected',
        description: `${config.name} has been disconnected successfully.`,
      });
      
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to disconnect integration:', error);
      toast({
        title: 'Disconnection Failed',
        description: error.message || `Failed to disconnect ${config.name}. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  // Convert existing integration to credentials format
  const existingCredentials = existingIntegration ? {
    apiKey: existingIntegration.api_key,
    client: existingIntegration.client,
    secret: existingIntegration.secret,
    clientId: existingIntegration.client,
    clientSecret: existingIntegration.secret,
  } : null;

  const integrationConfig = {
    name: config.name,
    description: config.description,
    iconComponent: config.icon,
    setupUrl: config.setupUrl,
    setupLabel: config.setupLabel,
    fields: config.fields
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-between p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 ${className}`}>
        <div className="flex items-center gap-3">
          {config.icon}
          <div>
            <div className="text-white font-medium">{config.name}</div>
            <div className="text-slate-400 text-sm mt-1">{config.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          <span className="text-slate-400 text-sm">Checking...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl bg-slate-800/20 border border-slate-700/30 hover:border-slate-600/40 transition-colors ${className}`}>
      <div className="flex items-center gap-3">
        {config.icon}
        <div>
          <div className="text-white font-medium">{config.name}</div>
          <div className="text-slate-400 text-sm mt-1">{config.description}</div>
          {isConnected && (
            <div className="flex items-center gap-1 mt-1">
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-green-500 text-xs">Connected</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {config.setupUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(config.setupUrl, '_blank')}
            className="text-slate-400 hover:text-white p-2"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant={isConnected ? "outline" : "default"}
              size="sm"
              className={
                isConnected
                  ? "bg-slate-800/30 border-slate-700/30 text-white hover:bg-slate-800/40 hover:border-red-500/30 hover:text-red-500"
                  : "bg-[#FF7000] hover:bg-[#FF7000]/90 text-white"
              }
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                {config.icon}
                {isConnected ? `Update ${config.name}` : `Connect ${config.name}`}
              </DialogTitle>
            </DialogHeader>

            <IntegrationCredentialsForm
              integration={integrationConfig}
              onSave={handleConnect}
              onCancel={() => setIsDialogOpen(false)}
              existingCredentials={existingCredentials}
            />
            
            {isConnected && (
              <div className="flex justify-end pt-4 border-t border-slate-700/30">
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                >
                  Disconnect Integration
                </Button>
              </div>
            )}
            
            {error && (
              <div className="text-sm text-red-400 mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded">
                {error}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default IntegrationButton;
