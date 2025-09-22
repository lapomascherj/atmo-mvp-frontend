import React, { useState, useEffect } from 'react';
import { Button } from '@/components/atoms/Button';
import { useIntegrationsStore } from "@/stores/useMockIntegrationsStore";
import { usePocketBase } from "@/hooks/useMockPocketBase";
import { useAuth } from '@/hooks/useMockAuth';
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
  Loader2,
  Link,
  Unlink,
  Key,
  Shield
} from 'lucide-react';

// Define integration configurations
interface BaseIntegrationConfig {
  name: string;
  description: string;
  provider: IntegrationProvider;
  type: IntegrationType;
  icon: React.ReactElement;
}

interface ApiKeyIntegrationConfig extends BaseIntegrationConfig {
  setupUrl: string;
  setupLabel: string;
  fields: Array<{
    key: string;
    label: string;
    type: 'password' | 'text';
    placeholder: string;
    required: boolean;
    description: string;
  }>;
}

interface OAuthIntegrationConfig extends BaseIntegrationConfig {
  isOAuth: true;
}

type IntegrationConfig = ApiKeyIntegrationConfig | OAuthIntegrationConfig;

const INTEGRATION_CONFIGS: Record<string, IntegrationConfig> = {
  notion: {
    name: 'Notion',
    description: 'Knowledge management and documentation',
    provider: IntegrationProvider.Notion,
    type: IntegrationType.KnowledgeBase,
    icon: <FileText className="w-6 h-6" />,
    setupUrl: 'https://www.notion.so/my-integrations',
    setupLabel: 'Create a Notion integration first',
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
    description: 'Code repositories and project management',
    provider: IntegrationProvider.Github,
    type: IntegrationType.KnowledgeBase,
    icon: <Github className="w-6 h-6" />,
    setupUrl: 'https://github.com/settings/tokens',
    setupLabel: 'Create a GitHub personal access token first',
    fields: [
      {
        key: 'apiKey',
        label: 'Personal Access Token',
        type: 'password' as const,
        placeholder: 'github_pat_... or ghp_...',
        required: true,
        description: 'Your GitHub Personal Access Token (starts with github_pat_ or ghp_)'
      }
    ]
  },
  openai: {
    name: 'OpenAI',
    description: 'AI-powered content generation and analysis',
    provider: IntegrationProvider.OpenAI,
    type: IntegrationType.Enhancer,
    icon: <Bot className="w-6 h-6" />,
    setupUrl: 'https://platform.openai.com/api-keys',
    setupLabel: 'Create an OpenAI API key first',
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
    name: 'Claude',
    description: 'Advanced AI assistant and content analysis',
    provider: IntegrationProvider.Anthropic,
    type: IntegrationType.Enhancer,
    icon: <Zap className="w-6 h-6" />,
    setupUrl: 'https://console.anthropic.com/',
    setupLabel: 'Create an Anthropic API key first',
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
  },
  google: {
    name: 'Google',
    description: 'Calendar, Drive, and productivity tools',
    provider: IntegrationProvider.Google,
    type: IntegrationType.KnowledgeBase,
    icon: <Calendar className="w-6 h-6" />,
    isOAuth: true,
  }
};

interface IntegrationCardProps {
  integrationType: keyof typeof INTEGRATION_CONFIGS;
  className?: string;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integrationType,
  className = ''
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  const {
    integrations,
    loading,
    error,
    fetchIntegrations,
    addIntegration,
    deleteIntegration,
    initiateOAuthFlow,
    clearError
  } = useIntegrationsStore();
  
  const pb = usePocketBase();
  const { user } = useAuth();
  
  const config = INTEGRATION_CONFIGS[integrationType];
  
  // Type guards
  const isOAuthConfig = (config: IntegrationConfig): config is OAuthIntegrationConfig => {
    return 'isOAuth' in config && config.isOAuth === true;
  };
  
  const isApiKeyConfig = (config: IntegrationConfig): config is ApiKeyIntegrationConfig => {
    return 'fields' in config;
  };
  
  // Check if this integration is already connected
  const existingIntegration = integrations.find(
    integration => integration.provider === config.provider
  );
  const isConnected = !!existingIntegration;

  // Fetch integrations on mount
  useEffect(() => {
    if (pb && user) {
      fetchIntegrations(pb);
    }
  }, [pb, user, fetchIntegrations]);

  // Clear any errors when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      clearError();
    }
  }, [isDialogOpen, clearError]);

  const handleConnect = async () => {
    if (!pb || !user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to connect integrations.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isOAuthConfig(config)) {
        // Handle OAuth flow
        const redirectUri = `${window.location.origin}/auth/${config.provider.toLowerCase()}/callback`;
        const { authUrl, state } = await initiateOAuthFlow(pb, config.provider, [], redirectUri);
        
        // Store OAuth state in localStorage for verification (CRITICAL FIX)
        console.log('🚀 IntegrationCard: Storing OAuth state:', {
          state: state,
          provider: config.provider,
          redirectUri: redirectUri
        });
        
        localStorage.setItem('oauth_state', state);
        localStorage.setItem('oauth_provider', config.provider);
        
        console.log('✅ IntegrationCard: OAuth state stored:', {
          storedState: localStorage.getItem('oauth_state'),
          storedProvider: localStorage.getItem('oauth_provider'),
          stateMatches: localStorage.getItem('oauth_state') === state
        });
        
        // Redirect to OAuth provider
        console.log('🔄 IntegrationCard: Redirecting to:', authUrl);
        window.location.href = authUrl;
      } else {
        // Handle API key integration
        await handleApiKeyIntegration(credentials);
      }
    } catch (error: any) {
      console.error('Integration connection failed:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || `Failed to connect ${config.name} integration.`,
        variant: 'destructive',
      });
    }
  };

  const handleApiKeyIntegration = async (formCredentials: Record<string, string>) => {
    console.log('Creating integration with credentials:', {
      provider: config.provider,
      type: config.type,
      credentials: formCredentials,
      hasApiKey: !!formCredentials.apiKey
    });
    
    const integration = createIntegrationFromForm(
      config.provider,
      config.type,
      formCredentials
    );
    
    console.log('Created integration object:', integration);
    
    await addIntegration(pb, integration);
    
    toast({
      title: 'Integration Connected',
      description: `Successfully connected ${config.name} integration.`,
    });
    
    setCredentials({});
    setIsDialogOpen(false);
  };

  const handleDisconnect = async () => {
    if (!pb || !existingIntegration) return;

    try {
      await deleteIntegration(pb, existingIntegration);
      toast({
        title: 'Integration Disconnected',
        description: `Successfully disconnected ${config.name} integration.`,
      });
    } catch (error: any) {
      console.error('Integration disconnection failed:', error);
      toast({
        title: 'Disconnection Failed',
        description: error.message || `Failed to disconnect ${config.name} integration.`,
        variant: 'destructive',
      });
    }
  };

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className={`group relative bg-slate-800/20 rounded-xl border border-slate-700/20 hover:border-[#FF7000]/20 transition-all duration-200 p-4 aspect-square flex flex-col ${className}`}>
      {/* Integration Icon and Status */}
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${isConnected ? 'bg-[#FF7000]/10' : 'bg-slate-700/30'} transition-colors`}>
          <div className={`${isConnected ? 'text-[#FF7000]' : 'text-slate-400'} transition-colors`}>
            {config.icon}
          </div>
        </div>
        
        {/* Connection Status Icon */}
        <div className={`p-1.5 rounded-full ${isConnected ? 'bg-[#FF7000]/20' : 'bg-slate-700/30'}`}>
          {isConnected ? (
            <Link className="w-4 h-4 text-[#FF7000]" />
          ) : (
            <Unlink className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Integration Info */}
      <div className="flex-1 mb-4">
        <h3 className="text-white font-medium text-sm mb-1 group-hover:text-[#FF7000] transition-colors">
          {config.name}
        </h3>
        <p className="text-slate-400 text-xs leading-relaxed">
          {config.description}
        </p>
      </div>

      {/* Action Button */}
      <div className="mt-auto">
        {isConnected ? (
          <Button
            onClick={handleDisconnect}
            disabled={loading}
            variant="outline"
            size="sm"
            className="w-full bg-slate-800/30 border-slate-600/30 text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <Unlink className="w-3 h-3 mr-1" />
            )}
            Disconnect
          </Button>
                 ) : isOAuthConfig(config) ? (
           <Button
             onClick={handleConnect}
             disabled={loading}
             size="sm"
             className="w-full bg-[#FF7000]/20 hover:bg-[#FF7000]/30 text-[#FF7000] border border-[#FF7000]/30 transition-all"
           >
             {loading ? (
               <Loader2 className="w-3 h-3 animate-spin mr-1" />
             ) : (
               <Shield className="w-3 h-3 mr-1" />
             )}
             Connect
           </Button>
         ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="w-full bg-[#FF7000]/20 hover:bg-[#FF7000]/30 text-[#FF7000] border border-[#FF7000]/30 transition-all"
              >
                <Key className="w-3 h-3 mr-1" />
                Connect
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  {config.icon}
                  Connect {config.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">
                  {config.description}
                </p>
                
                {config.setupUrl && (
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-blue-400 text-xs mb-2">{config.setupLabel}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(config.setupUrl, '_blank')}
                      className="text-blue-400 border-blue-400/30 hover:bg-blue-500/10"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Setup Guide
                    </Button>
                  </div>
                )}
                
                                 {isApiKeyConfig(config) && (
                   <IntegrationCredentialsForm
                     integration={{
                       name: config.name,
                       description: config.description,
                       fields: config.fields,
                       setupUrl: config.setupUrl,
                       setupLabel: config.setupLabel,
                       iconComponent: config.icon
                     }}
                     onSave={async (creds) => {
                       await handleApiKeyIntegration(creds);
                     }}
                     onCancel={() => setIsDialogOpen(false)}
                     existingCredentials={credentials}
                   />
                 )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default IntegrationCard;
