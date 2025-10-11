import React, { useState, useEffect } from 'react';
import { Button } from '@/components/atoms/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/atoms/Dialog';
import { useIntegrationsStore } from '@/stores/useMockIntegrationsStore';
import { usePocketBase } from "@/hooks/useMockPocketBase";
import useMockAuth from '@/hooks/useMockAuth';
import { useToast } from '@/hooks/useToast';
import { IntegrationProvider } from '@/models/IntegrationProvider';
import { 
  Github, 
  Calendar, 
  Check,
  Loader2,
  ExternalLink
} from 'lucide-react';

// OAuth provider configurations
const OAUTH_PROVIDER_CONFIGS = {
  [IntegrationProvider.Google]: {
    name: 'Google',
    description: 'Connect your Google account for Calendar, Drive, and more',
    icon: <Calendar className="w-5 h-5" />,
    setupUrl: 'https://console.cloud.google.com/apis/credentials',
    setupLabel: 'You need to create Google OAuth credentials first'
  },
  [IntegrationProvider.Github]: {
    name: 'GitHub',
    description: 'Connect your GitHub account for repositories and more',
    icon: <Github className="w-5 h-5" />,
    setupUrl: 'https://github.com/settings/developers',
    setupLabel: 'You need to create a GitHub OAuth App first'
  }
};

interface OAuthIntegrationCardProps {
  provider: IntegrationProvider;
  className?: string;
}

const OAuthIntegrationCard: React.FC<OAuthIntegrationCardProps> = ({
  provider,
  className = ''
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const {
    integrations,
    loading,
    error,
    fetchIntegrations,
    initiateOAuthFlow,
    deleteIntegration,
    getIntegrationsByProvider,
    clearError
  } = useIntegrationsStore();

  const pb = usePocketBase();
  const { user } = useMockAuth();

  const config = OAUTH_PROVIDER_CONFIGS[provider];

  // Get existing integrations for this provider
  const providerIntegrations = getIntegrationsByProvider(provider);
  const isConnected = providerIntegrations.length > 0;
  const existingIntegration = providerIntegrations[0];

  // Fetch integrations when component mounts
  useEffect(() => {
    if (pb) {
      fetchIntegrations(pb);
    }
  }, [fetchIntegrations, pb]);

  const handleConnect = async () => {
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
      
      // Use provider-specific redirect URI
      const redirectUri = provider === IntegrationProvider.Google 
        ? `${window.location.origin}/auth/google/callback`
        : `${window.location.origin}/auth/github/callback`;
        
      const { authUrl, state } = await initiateOAuthFlow(
        pb,
        provider,
        [],
        redirectUri
      );

      // Store OAuth state in localStorage for verification
      console.log('🚀 Storing OAuth state:', {
        state: state,
        provider: provider,
        redirectUri: redirectUri,
        beforeStorage: {
          oauth_state: localStorage.getItem('oauth_state'),
          oauth_provider: localStorage.getItem('oauth_provider')
        }
      });
      
      localStorage.setItem('oauth_state', state);
      localStorage.setItem('oauth_provider', provider);
      
      console.log('✅ OAuth state stored:', {
        storedState: localStorage.getItem('oauth_state'),
        storedProvider: localStorage.getItem('oauth_provider'),
        stateMatches: localStorage.getItem('oauth_state') === state
      });

      // Redirect to OAuth provider
      console.log('🔄 Redirecting to:', authUrl);
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('Failed to initiate OAuth flow:', error);
      toast({
        title: 'Connection Failed',
        description: error.message || `Failed to connect to ${config.name}. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = async () => {
    if (!pb || !existingIntegration) return;

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

            {!isConnected && (
              <div className="space-y-4">
                <div className="text-sm text-slate-400">
                  {config.setupLabel}
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-blue-300 text-sm">
                    We'll redirect you to {config.name} to authorize access to your account.
                    Your credentials will be stored securely.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-slate-700/30 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConnect}
                    className="bg-[#FF7000] hover:bg-[#FF7000]/90 text-white"
                  >
                    Connect to {config.name}
                  </Button>
                </div>
              </div>
            )}
            
            {isConnected && (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-medium">Connected to {config.name}</span>
                  </div>
                  <p className="text-green-300 text-sm">
                    Integration is active and ready to use.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-700/30">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-slate-700/30 text-slate-400 hover:text-white"
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDisconnect}
                    className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                  >
                    Disconnect Integration
                  </Button>
                </div>
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

export default OAuthIntegrationCard; 
